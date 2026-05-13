import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  query, orderBy, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase/config'
import { seedRooms } from '../firebase/seed'
import {
  FiLogOut, FiEdit2, FiTrash2, FiPlus, FiUpload, FiX,
  FiCheck, FiAlertCircle, FiHome, FiImage, FiEye, FiEyeOff,
} from 'react-icons/fi'

// ─── Colour helpers ───────────────────────────────────────
const STATUS = {
  confirmed:    { label: 'مؤكد',           color: '#2563eb', bg: '#dbeafe' },
  pending:      { label: 'معلق',           color: '#d97706', bg: '#fef3c7' },
  'checked-in': { label: 'تسجيل وصول',    color: '#059669', bg: '#d1fae5' },
  'checked-out':{ label: 'تسجيل مغادرة',  color: '#6b7280', bg: '#f3f4f6' },
  cancelled:    { label: 'ملغى',           color: '#dc2626', bg: '#fee2e2' },
}

const inp = {
  width: '100%', padding: '9px 12px', border: '1px solid #D4C9B8',
  borderRadius: 8, fontSize: 14, fontFamily: 'Cairo, Inter, sans-serif',
  background: '#FFFDF9', color: '#1C1C14', boxSizing: 'border-box',
  outline: 'none',
}

const lbl = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#5a5544',
  marginBottom: 5, fontFamily: 'Cairo, sans-serif',
}

// ─── Entry point ──────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser]     = useState(null)
  const [ready, setReady]   = useState(false)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true) }), [])

  if (!ready) return <Loader full />
  if (!user)  return <LoginForm />
  return <Dashboard user={user} />
}

// ─── Login ────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPass]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} dir="rtl">
      <div style={{ background: '#fff', borderRadius: 16, padding: '44px 40px', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏨</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C14', fontFamily: 'Cairo, sans-serif', marginBottom: 4 }}>لوحة الإدارة</h1>
          <p style={{ fontSize: 13, color: '#7A7860' }}>منتجع العلبي</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} required placeholder="admin@example.com" />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={lbl}>كلمة المرور</label>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPass(e.target.value)} style={{ ...inp, paddingLeft: 40 }} required placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', left: 10, bottom: 9, background: 'none', border: 'none', cursor: 'pointer', color: '#7A7860', padding: 0 }}>
              {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><FiAlertCircle size={14} />{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#3d5a3a', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 15, fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
          يجب تفعيل Firebase Authentication وإضافة مستخدم admin من Firebase Console
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────
function Dashboard({ user }) {
  const [tab, setTab]               = useState('rooms')
  const [rooms, setRooms]           = useState([])
  const [bookings, setBookings]     = useState([])
  const [loadingRooms, setLR]       = useState(true)
  const [loadingBookings, setLB]    = useState(true)
  const [modalRoom, setModalRoom]   = useState(null) // null=closed, {}=new, room=edit
  const [seeding, setSeeding]       = useState(false)
  const [seedMsg, setSeedMsg]       = useState('')

  useEffect(() => {
    return onSnapshot(collection(db, 'rooms'), snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => parseInt(a.number) - parseInt(b.number)))
      setLR(false)
    })
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLB(false)
    })
  }, [])

  const handleSeed = async () => {
    if (!confirm('هل تريد إضافة الغرف الـ١٤ الحقيقية؟ سيتم الكتابة فوق أي غرفة موجودة بنفس الرقم.')) return
    setSeeding(true)
    try {
      const count = await seedRooms()
      setSeedMsg(`✅ تم إضافة ${count} غرفة بنجاح`)
    } catch (err) {
      setSeedMsg(`❌ خطأ: ${err.message}`)
    } finally {
      setSeeding(false)
      setTimeout(() => setSeedMsg(''), 5000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'Cairo, Inter, sans-serif' }} dir="rtl">
      {/* Top bar */}
      <div style={{ background: '#3d5a3a', color: '#fff', height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>🏨 منتجع العلبي — لوحة الإدارة</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, opacity: 0.75 }}>{user.email}</span>
          <a href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 13, textDecoration: 'none' }}>
            <FiHome size={13} /> الموقع
          </a>
          <button onClick={() => signOut(auth)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
            <FiLogOut size={13} /> خروج
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E0D0', padding: '0 24px', display: 'flex', gap: 0 }}>
        {[['rooms', `الغرف (${rooms.length})`], ['bookings', `الحجوزات (${bookings.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: tab === id ? '2.5px solid #3d5a3a' : '2.5px solid transparent', color: tab === id ? '#3d5a3a' : '#7A7860', fontWeight: tab === id ? 700 : 400, cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Seed message */}
      {seedMsg && (
        <div style={{ background: seedMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', padding: '10px 24px', fontSize: 14, color: seedMsg.startsWith('✅') ? '#065f46' : '#991b1b', borderBottom: '1px solid #E8E0D0' }}>
          {seedMsg}
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'rooms' && (
          <RoomsTab
            rooms={rooms}
            loading={loadingRooms}
            onAdd={() => setModalRoom({})}
            onEdit={(r) => setModalRoom(r)}
            onSeed={handleSeed}
            seeding={seeding}
          />
        )}
        {tab === 'bookings' && (
          <BookingsTab bookings={bookings} loading={loadingBookings} rooms={rooms} />
        )}
      </div>

      {/* Room modal */}
      {modalRoom !== null && (
        <RoomModal
          room={Object.keys(modalRoom).length === 0 ? null : modalRoom}
          onClose={() => setModalRoom(null)}
        />
      )}
    </div>
  )
}

// ─── Rooms tab ────────────────────────────────────────────
function RoomsTab({ rooms, loading, onAdd, onEdit, onSeed, seeding }) {
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const filtered = rooms.filter(r =>
    r.number?.includes(search) ||
    r.nameAr?.includes(search) ||
    r.nameEn?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (room) => {
    if (!confirm(`هل تريد حذف الغرفة ${room.nameAr}؟ لا يمكن التراجع عن هذا.`)) return
    setDeleting(room.id)
    try { await deleteDoc(doc(db, 'rooms', room.id)) }
    catch (err) { alert('فشل الحذف: ' + err.message) }
    finally { setDeleting(null) }
  }

  const toggleActive = async (room) => {
    await updateDoc(doc(db, 'rooms', room.id), { active: !room.active, updatedAt: Timestamp.now() })
  }

  if (loading) return <Loader />

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث برقم الغرفة أو الاسم..."
          style={{ ...inp, width: 'auto', flex: 1, minWidth: 200 }}
        />
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3d5a3a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap' }}>
          <FiPlus size={16} /> إضافة غرفة
        </button>
        <button onClick={onSeed} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', color: '#3d5a3a', border: '1.5px solid #3d5a3a', borderRadius: 9, padding: '9px 18px', fontWeight: 700, cursor: seeding ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap', opacity: seeding ? 0.6 : 1 }}>
          {seeding ? '⏳ جارٍ الإضافة...' : '📋 إضافة الـ١٤ غرفة'}
        </button>
      </div>

      {/* Rooms count */}
      <p style={{ fontSize: 13, color: '#7A7860', marginBottom: 16 }}>{filtered.length} غرفة</p>

      {/* Rooms grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A7860' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏨</p>
          <p style={{ marginBottom: 16 }}>لا توجد غرف بعد. اضغط "إضافة الـ١٤ غرفة" لإضافة الغرف الحقيقية.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onEdit={onEdit} onDelete={handleDelete} onToggle={toggleActive} deleting={deleting === room.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, onEdit, onDelete, onToggle, deleting }) {
  const mainImg = room.images?.[0]
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', border: '1px solid #E8E0D0', opacity: room.active === false ? 0.6 : 1 }}>
      <div style={{ height: 160, background: '#f3f0ea', position: 'relative' }}>
        {mainImg ? (
          <img src={mainImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb' }}>
            <FiImage size={40} />
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, right: 10, background: room.active !== false ? '#d1fae5' : '#fee2e2', color: room.active !== false ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
          {room.active !== false ? 'نشطة' : 'مخفية'}
        </span>
        {room.featured && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>مميزة</span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#1C1C14', marginBottom: 2 }}>{room.nameAr}</p>
            <p style={{ fontSize: 12, color: '#7A7860' }}>رقم {room.number} · الطابق {room.floor} · {room.capacity} أشخاص</p>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3d5a3a' }}>
            {room.price ? `$${room.price}` : 'عند الطلب'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#9a9282', marginBottom: 12 }}>{room.bedsAr}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onEdit(room)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#3d5a3a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            <FiEdit2 size={13} /> تعديل
          </button>
          <button onClick={() => onToggle(room)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#f5f0e8', color: '#5a5544', border: '1px solid #D4C9B8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
            {room.active !== false ? <FiEyeOff size={13} /> : <FiEye size={13} />}
          </button>
          <button onClick={() => onDelete(room)} disabled={deleting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: deleting ? 'not-allowed' : 'pointer' }}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Room modal (add / edit) ──────────────────────────────
const ROOM_TYPES = [
  { value: 'family',    label: 'عائلية' },
  { value: 'standard',  label: 'عادية' },
  { value: 'deluxe',    label: 'ديلوكس' },
  { value: 'suite',     label: 'جناح' },
  { value: 'penthouse', label: 'بنتهاوس' },
]

function RoomModal({ room, onClose }) {
  const isNew = !room
  const fileRef = useRef()

  const [form, setForm] = useState({
    number:      room?.number      ?? '',
    type:        room?.type        ?? 'family',
    nameAr:      room?.nameAr      ?? '',
    nameEn:      room?.nameEn      ?? '',
    descAr:      room?.descAr      ?? '',
    descEn:      room?.descEn      ?? '',
    capacity:    room?.capacity    ?? '',
    bedsAr:      room?.bedsAr      ?? '',
    beds:        room?.beds        ?? '',
    price:       room?.price       ?? '',
    amenitiesAr: room?.amenitiesAr?.join('، ') ?? '',
    amenities:   room?.amenities?.join(', ')  ?? '',
    featured:    room?.featured    ?? false,
    active:      room?.active      !== false,
  })
  const [images, setImages]       = useState(room?.images ?? [])
  const [urlInput, setUrlInput]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const roomId = room?.id ?? `room-${form.number}`

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (!form.number) { setError('أدخل رقم الغرفة أولاً قبل رفع الصور'); return }
    setUploading(true); setError('')
    try {
      for (const file of files) {
        const storageRef = ref(storage, `rooms/room-${form.number}/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        setImages(prev => [...prev, url])
      }
    } catch (err) {
      setError('فشل رفع الصورة: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    setImages(prev => [...prev, url])
    setUrlInput('')
  }

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!form.number || !form.nameAr || !form.capacity || !form.bedsAr) {
      setError('الحقول المطلوبة: رقم الغرفة، الاسم بالعربي، عدد الأشخاص، وصف الأسرة')
      return
    }
    setSaving(true); setError('')
    try {
      const id    = roomId
      const floor = parseInt(form.number[0]) || 1
      const data  = {
        number:      form.number.trim(),
        floor,
        type:        form.type,
        nameAr:      form.nameAr.trim(),
        nameEn:      form.nameEn.trim() || form.nameAr.trim(),
        descAr:      form.descAr.trim(),
        descEn:      form.descEn.trim(),
        capacity:    parseInt(form.capacity) || 1,
        bedsAr:      form.bedsAr.trim(),
        beds:        form.beds.trim() || form.bedsAr.trim(),
        price:       form.price !== '' && form.price !== null ? parseFloat(form.price) : null,
        amenitiesAr: form.amenitiesAr.split('،').concat(form.amenitiesAr.split(',')).map(s => s.trim()).filter(Boolean),
        amenities:   form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images,
        featured:    form.featured,
        active:      form.active,
        updatedAt:   Timestamp.now(),
      }
      if (isNew) data.createdAt = Timestamp.now()

      await setDoc(doc(db, 'rooms', id), data, { merge: !isNew })
      onClose()
    } catch (err) {
      setError('فشل الحفظ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', marginBottom: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E8E0D0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C14', fontFamily: 'Cairo, sans-serif' }}>
            {isNew ? 'إضافة غرفة جديدة' : `تعديل غرفة ${room.nameAr}`}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7860', padding: 6 }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Section 1: Basic */}
          <Section title="معلومات أساسية">
            <Row>
              <Field label="رقم الغرفة *" required>
                <input style={inp} value={form.number} onChange={e => set('number', e.target.value)} placeholder="مثال: 101" />
              </Field>
              <Field label="نوع الغرفة *">
                <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                  {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="عدد الأشخاص *">
                <input type="number" style={inp} value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="5" min="1" max="20" />
              </Field>
              <Field label="السعر الليلي $ (اتركه فارغاً إذا عند الطلب)">
                <input type="number" style={inp} value={form.price} onChange={e => set('price', e.target.value)} placeholder="اتركه فارغاً = عند الطلب" min="0" />
              </Field>
            </Row>
            <Row>
              <Field label="">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1C1C14', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                  غرفة مميزة (تظهر في الصفحة الرئيسية)
                </label>
              </Field>
              <Field label="">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1C1C14', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                  غرفة نشطة (تظهر للزوار)
                </label>
              </Field>
            </Row>
          </Section>

          {/* Section 2: Arabic content */}
          <Section title="المحتوى بالعربي">
            <Field label="اسم الغرفة بالعربي *">
              <input style={inp} value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="مثال: شقة ١٠١" />
            </Field>
            <Field label="وصف الغرفة بالعربي">
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} value={form.descAr} onChange={e => set('descAr', e.target.value)} placeholder="وصف مختصر للشقة..." />
            </Field>
            <Field label="تفاصيل الأسرة بالعربي *">
              <input style={inp} value={form.bedsAr} onChange={e => set('bedsAr', e.target.value)} placeholder="مثال: سرير مزدوج + ٣ أسرة مفردة" />
            </Field>
            <Field label="المرافق والخدمات بالعربي (مفصولة بفاصلة)">
              <input style={inp} value={form.amenitiesAr} onChange={e => set('amenitiesAr', e.target.value)} placeholder="واي فاي، تكييف، تلفاز، مطبخ، حمام، صالون" />
            </Field>
          </Section>

          {/* Section 3: English content */}
          <Section title="المحتوى بالإنجليزي (اختياري)">
            <Field label="Room Name (English)">
              <input style={inp} value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="e.g. Apartment 101" />
            </Field>
            <Field label="Description (English)">
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} value={form.descEn} onChange={e => set('descEn', e.target.value)} placeholder="Short room description..." />
            </Field>
            <Field label="Bed Details (English)">
              <input style={inp} value={form.beds} onChange={e => set('beds', e.target.value)} placeholder="e.g. 1 Double Bed + 3 Single Beds" />
            </Field>
            <Field label="Amenities, comma-separated (English)">
              <input style={inp} value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="WiFi, Air Conditioning, TV, Kitchenette, Bathroom" />
            </Field>
          </Section>

          {/* Section 4: Images */}
          <Section title="الصور">
            {/* Thumbnails */}
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 90, height: 70, borderRadius: 8, overflow: 'hidden', border: '2px solid #E8E0D0' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <FiX size={11} />
                    </button>
                    {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: '#3d5a3a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>رئيسية</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3d5a3a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, opacity: uploading ? 0.6 : 1 }}>
                <FiUpload size={14} /> {uploading ? 'جارٍ الرفع...' : 'رفع صورة'}
              </button>
            </div>

            {/* URL input */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input style={{ ...inp, flex: 1 }} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="أو أضف رابط صورة مباشراً..." onKeyDown={e => e.key === 'Enter' && addUrl()} />
              <button onClick={addUrl} style={{ background: '#f5f0e8', color: '#3d5a3a', border: '1.5px solid #3d5a3a', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>إضافة</button>
            </div>
          </Section>

          {/* Error */}
          {error && <p style={{ color: '#dc2626', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><FiAlertCircle size={14} />{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E0D0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#f5f0e8', color: '#5a5544', border: '1px solid #D4C9B8', borderRadius: 9, padding: '9px 22px', cursor: 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3d5a3a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 22px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'Cairo, sans-serif', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'جارٍ الحفظ...' : <><FiCheck size={15} /> حفظ التغييرات</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bookings tab ─────────────────────────────────────────
function BookingsTab({ bookings, loading, rooms }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating]         = useState(null)

  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  const changeStatus = async (id, status) => {
    setUpdating(id)
    try { await updateDoc(doc(db, 'bookings', id), { status }) }
    catch { alert('فشل التحديث') }
    finally { setUpdating(null) }
  }

  const fmtDate = (d) => {
    try {
      const date = d?.toDate ? d.toDate() : new Date(d)
      return date.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return '-' }
  }

  const stats = Object.entries(STATUS).map(([k, v]) => ({
    key: k, label: v.label, color: v.color, bg: v.bg,
    count: bookings.filter(b => b.status === k).length,
  }))

  if (loading) return <Loader />

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.key} style={{ background: s.bg, border: `1.5px solid ${s.color}30`, borderRadius: 10, padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110, cursor: 'pointer' }} onClick={() => setStatusFilter(s.key === statusFilter ? 'all' : s.key)}>
            <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setStatusFilter(k)} style={{ background: statusFilter === k ? '#3d5a3a' : '#fff', color: statusFilter === k ? '#fff' : '#5a5544', border: '1.5px solid', borderColor: statusFilter === k ? '#3d5a3a' : '#D4C9B8', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A7860' }}>لا توجد حجوزات</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(b => {
            const s = STATUS[b.status] || STATUS.confirmed
            const nights = b.nights || Math.ceil((new Date(b.checkOut?.toDate?.() || b.checkOut) - new Date(b.checkIn?.toDate?.() || b.checkIn)) / 86400000)
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 12, background: '#f5f0e8', padding: '2px 8px', borderRadius: 5, color: '#3d5a3a', fontFamily: 'monospace' }}>#{b.id.slice(0, 8).toUpperCase()}</code>
                      <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 100 }}>{s.label}</span>
                      {b.totalPrice != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C14' }}>${b.totalPrice}</span>}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#1C1C14', margin: 0 }}>
                      {b.roomNameAr} ({b.roomNumber}) · {b.guests} أشخاص · {nights} ليلة
                    </p>
                    <p style={{ fontSize: 13, color: '#7A7860', margin: 0 }}>
                      {fmtDate(b.checkIn)} ← {fmtDate(b.checkOut)}
                    </p>
                    <p style={{ fontSize: 13, color: '#5a5544', margin: 0 }}>
                      {b.guestName} · {b.guestPhone}
                      {b.guestEmail ? ` · ${b.guestEmail}` : ''}
                    </p>
                    {b.notes && <p style={{ fontSize: 12, color: '#7A7860', margin: 0, fontStyle: 'italic' }}>📝 {b.notes}</p>}
                    <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>{fmtDate(b.createdAt)}</p>
                  </div>
                  {/* Status changer */}
                  <select
                    value={b.status || 'confirmed'}
                    onChange={e => changeStatus(b.id, e.target.value)}
                    disabled={updating === b.id}
                    style={{ ...inp, width: 'auto', fontSize: 13, cursor: 'pointer', background: s.bg, color: s.color, fontWeight: 700, borderColor: s.color + '60', paddingLeft: 8, paddingRight: 8 }}
                  >
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7A7860', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #E8E0D0' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      {children}
    </div>
  )
}

function Loader({ full }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: full ? '100vh' : 200 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E8E0D0', borderTopColor: '#3d5a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
