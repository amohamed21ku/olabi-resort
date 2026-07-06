import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  query, orderBy, Timestamp, addDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase/config'
import { seedRooms, CATEGORIES } from '../firebase/seed'
import { getNextBookingNumber, formatBookingNumber, buildCustomerWhatsAppUrl, extendBookingStay, assignRoomToBooking, setRoomBlock, clearRoomBlock, isRoomBlockedInRange, HIKE_DOC, DEFAULT_HIKE_CONTENT, saveHikeContent, buildHikeCustomerWhatsAppUrl, computeBookingFinance, addBookingCharge, removeBookingCharge, addBookingPayment, removeBookingPayment, updateBookingRoomPrice, checkInBooking, checkOutBooking, unassignRoomFromBooking } from '../firebase/services'

const CATEGORY_OPTIONS = [
  { value: 'superub', labelAr: 'سوبر' },
  { value: 'premium', labelAr: 'بريميوم' },
  { value: 'deluxe',  labelAr: 'ديلوكس' },
]
const CATEGORY_LABEL_AR = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.labelAr]))
import { compressImage } from '../utils/imageCompress'
import {
  FiLogOut, FiEdit2, FiTrash2, FiPlus, FiUpload, FiX, FiCheck,
  FiAlertCircle, FiHome, FiImage, FiEye, FiEyeOff, FiCalendar,
  FiSearch, FiBookOpen, FiPhone, FiUser, FiMail, FiMessageSquare,
  FiMenu, FiChevronUp, FiChevronDown, FiChevronRight, FiChevronLeft, FiLayers, FiActivity,
  FiCheckSquare, FiSliders, FiDatabase, FiClock, FiDollarSign,
  FiUsers, FiArrowUp, FiArrowDown, FiMoreVertical, FiRefreshCw,
  FiExternalLink, FiPlusCircle, FiMessageCircle,
  FiCreditCard, FiStar, FiBell, FiSettings, FiLock, FiUnlock,
  FiCompass, FiSave, FiCoffee, FiTrendingDown, FiLogIn, FiClipboard,
  FiGrid, FiPrinter,
} from 'react-icons/fi'

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const STATUS = {
  confirmed:    { label: 'مؤكد',        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  pending:      { label: 'معلق',        color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'checked-in': { label: 'وصل',         color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'checked-out':{ label: 'غادر',        color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  cancelled:    { label: 'ملغى',        color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
}

const SOURCE_LABELS = {
  phone:    'هاتف',
  'walk-in':'حضور شخصي',
  website:  'الموقع',
  referral: 'إحالة',
  other:    'أخرى',
}

// Payment status derived from the folio (paid vs. remaining balance).
const PAYMENT_STATUS = {
  paid:    { label: 'مدفوع بالكامل', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  partial: { label: 'مدفوع جزئياً',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  unpaid:  { label: 'غير مدفوع',      color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
}

// Extra-charge categories (restaurant flow) and payment methods.
const CHARGE_CATEGORIES = [
  { value: 'restaurant', label: 'مطعم' },
  { value: 'cafe',       label: 'كافيه' },
  { value: 'room-service', label: 'خدمة الغرف' },
  { value: 'other',      label: 'أخرى' },
]
const CHARGE_CATEGORY_LABEL = Object.fromEntries(CHARGE_CATEGORIES.map(c => [c.value, c.label]))

const PAYMENT_METHODS = [
  { value: 'cash',      label: 'نقد' },
  { value: 'sham-cash', label: 'شام كاش' },
  { value: 'card',      label: 'بطاقة' },
]
const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]))

const NAV_SECTIONS = [
  {
    items: [
      { id: 'front-desk',   label: 'المكتب الأمامي', Icon: FiClipboard },
      { id: 'dashboard',    label: 'نظرة عامة',   Icon: FiActivity },
      { id: 'new-booking',  label: 'حجز جديد',    Icon: FiPlusCircle },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { id: 'bookings',     label: 'الحجوزات',    Icon: FiBookOpen },
      { id: 'calendar',     label: 'تقويم الحجوزات', Icon: FiGrid },
      { id: 'charge-room',  label: 'إضافة على الغرفة', Icon: FiCoffee },
      { id: 'availability', label: 'الإتاحة',     Icon: FiCalendar },
      { id: 'variants',     label: 'الفئات',       Icon: FiStar },
      { id: 'rooms',        label: 'الغرف',        Icon: FiLayers },
    ],
  },
  {
    title: 'الفعاليات',
    items: [
      { id: 'hike',         label: 'مسار العم سيفاك', Icon: FiCompass },
    ],
  },
]

/* ─────────────────────────────────────────────────────────────
   Entry point
───────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true) }), [])
  if (!ready) return <FullLoader />
  if (!user)  return <LoginForm />
  return <Dashboard user={user} />
}

/* ─────────────────────────────────────────────────────────────
   Login
───────────────────────────────────────────────────────────── */
function LoginForm() {
  const [email, setEmail]       = useState('')
  const [pass,  setPass]        = useState('')
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')
  const [showPass, setShow]     = useState(false)

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signInWithEmailAndPassword(auth, email, pass) }
    catch { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة') }
    finally { setLoading(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F1F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#1C2B1C', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FiHome size={20} color="#86efac" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>منتجع العلبي</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>لوحة الإدارة</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={loginLbl}>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@resort.com"
                style={loginInp} onFocus={e => e.target.style.borderColor = '#3d5a3a'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
            <div>
              <label style={loginLbl}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••"
                  style={{ ...loginInp, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = '#3d5a3a'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
                <FiAlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ background: loading ? '#6b7280' : '#1C2B1C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 14, fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background 0.15s' }}>
              {loading ? 'جارٍ التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
const loginLbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.01em' }
const loginInp = { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontFamily: 'Cairo, sans-serif', color: '#111827', background: '#fff', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }

/* ─────────────────────────────────────────────────────────────
   Dashboard shell
───────────────────────────────────────────────────────────── */
function Dashboard({ user }) {
  const [tab, setTab]             = useState('front-desk')
  const [mobileSidebar, setMob]   = useState(false)
  const [rooms, setRooms]         = useState([])
  const [variants, setVariants]   = useState([])
  const [bookings, setBookings]   = useState([])
  const [hikeContent, setHikeContent] = useState(null)
  const [hikeApps, setHikeApps]   = useState([])
  const [loadingR, setLR]         = useState(true)
  const [loadingV, setLV]         = useState(true)
  const [loadingB, setLB]         = useState(true)
  const [editingRoom, setEditingRoom]       = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [seeding, setSeeding]         = useState(false)
  const [seedMsg, setSeedMsg]     = useState('')

  useEffect(() => onSnapshot(collection(db, 'rooms'), snap => {
    setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => +a.number - +b.number))
    setLR(false)
  }), [])

  useEffect(() => onSnapshot(collection(db, 'variants'), snap => {
    setVariants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLV(false)
  }), [])

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLB(false) })
  }, [])

  useEffect(() => onSnapshot(doc(db, HIKE_DOC.col, HIKE_DOC.id), snap => {
    setHikeContent(snap.exists() ? { ...DEFAULT_HIKE_CONTENT, ...snap.data() } : { ...DEFAULT_HIKE_CONTENT })
  }), [])

  useEffect(() => onSnapshot(collection(db, 'hikeApplications'), snap => {
    setHikeApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }), [])

  const handleSeed = async () => {
    if (!confirm('إعادة تهيئة الفئات والغرف؟ (سيُعاد كتابة 5 فئات و14 غرفة)')) return
    setSeeding(true)
    try {
      const { rooms: nR, variants: nV } = await seedRooms()
      setSeedMsg(`تم: ${nV} فئة و ${nR} غرفة`)
    }
    catch (e) { setSeedMsg(`خطأ: ${e.message}`) }
    finally { setSeeding(false); setTimeout(() => setSeedMsg(''), 4000) }
  }

  // ── Booking detail: lifted here so any tab (Front Desk, Bookings) can open
  //    the same full-screen detail page and share one set of action handlers.
  const [openBookingId, setOpenBookingId] = useState(null)
  const openBooking = openBookingId ? bookings.find(b => b.id === openBookingId) : null

  const [updating,  setUpdating]  = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignErr, setAssignErr] = useState('')
  const [extending, setExtending] = useState(false)
  const [extendErr, setExtendErr] = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const [stageBusy, setStageBusy] = useState(false)
  const [stageErr,  setStageErr]  = useState('')

  const changeStatus = async (id, status) => {
    setUpdating(true)
    try { await updateDoc(doc(db, 'bookings', id), { status }) }
    catch { alert('فشل التحديث') }
    finally { setUpdating(false) }
  }
  const handleAssign = async (id, roomId) => {
    setAssigning(true); setAssignErr('')
    try { await assignRoomToBooking(id, roomId) }
    catch (e) {
      if (e?.code === 'ROOM_UNAVAILABLE')          setAssignErr('الغرفة محجوزة في هذه الفترة')
      else if (e?.message === 'TYPE_MISMATCH')      setAssignErr('نوع الغرفة لا يطابق فئة الحجز')
      else if (e?.message === 'CAPACITY_MISMATCH')  setAssignErr('سعة الغرفة لا تطابق سعة الحجز')
      else setAssignErr('فشل التعيين: ' + (e?.message || ''))
    }
    finally { setAssigning(false) }
  }
  const handleUnassign = async (id) => {
    if (!confirm('إلغاء تعيين الغرفة لهذا الحجز؟ سيعود إلى قائمة «غير معيّنة».')) return
    setAssigning(true); setAssignErr('')
    try { await unassignRoomFromBooking(id) }
    catch (e) { setAssignErr('فشل إلغاء التعيين: ' + (e?.message || '')) }
    finally { setAssigning(false) }
  }
  const handleExtend = async (id, newCheckOut) => {
    setExtending(true); setExtendErr('')
    try { await extendBookingStay(id, newCheckOut) }
    catch (e) {
      if (e?.code === 'ROOM_UNAVAILABLE') setExtendErr('الغرفة محجوزة في الفترة الجديدة')
      else setExtendErr('فشل التمديد: ' + (e?.message || ''))
    }
    finally { setExtending(false) }
  }
  const handleDeleteBooking = async (b) => {
    if (!confirm(`حذف حجز ${b.guestName}؟`)) return false
    setDeleting(true)
    try { await deleteDoc(doc(db, 'bookings', b.id)); return true }
    catch { alert('فشل الحذف'); return false }
    finally { setDeleting(false) }
  }
  const handleCheckIn = async (b) => {
    setStageBusy(true); setStageErr('')
    try { await checkInBooking(b.id) }
    catch (e) { setStageErr(e?.message === 'NO_ROOM_ASSIGNED' ? 'يجب تعيين غرفة للحجز أولاً' : 'فشل تسجيل الوصول: ' + (e?.message || '')) }
    finally { setStageBusy(false) }
  }
  const handleCheckOut = async (b, when = null) => {
    const fin = computeBookingFinance(b)
    if (fin.balance > 0 && !confirm(`يوجد مبلغ متبقٍّ قدره ${fin.balance}. هل تريد متابعة تسجيل المغادرة؟`)) return
    setStageBusy(true); setStageErr('')
    try { await checkOutBooking(b.id, when) }
    catch (e) { setStageErr('فشل تسجيل المغادرة: ' + (e?.message || '')) }
    finally { setStageBusy(false) }
  }

  const pending = bookings.filter(b => b.status === 'pending').length
  const pendingHike = hikeApps.filter(a => a.status === 'pending').length
  const navLabel = openBooking
    ? 'تفاصيل الحجز'
    : tab === 'room-form'
      ? (editingRoom ? `تعديل غرفة ${editingRoom.number}` : 'إضافة غرفة جديدة')
      : tab === 'variant-form'
        ? (editingVariant ? `تعديل: ${editingVariant.nameAr || editingVariant.id}` : 'إضافة فئة جديدة')
        : NAV_SECTIONS.flatMap(s => s.items).find(n => n.id === tab)?.label ?? ''

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F4F6F4', fontFamily: 'Cairo, sans-serif', display: 'flex' }}>
      {/* Mobile backdrop */}
      {mobileSidebar && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} onClick={() => setMob(false)} />}

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 240,
        background: '#1C2B1C', display: 'flex', flexDirection: 'column', zIndex: 40,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        transform: mobileSidebar ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'rgba(134,239,172,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiHome size={16} color="#86efac" />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>منتجع العلبي</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>
                  {section.title}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(({ id, label, Icon }) => {
                  const active = tab === id
                  const badgeCount = id === 'bookings' ? pending : id === 'hike' ? pendingHike : 0
                  const hasBadge = badgeCount > 0
                  return (
                    <button key={id} onClick={() => { setTab(id); setOpenBookingId(null); setMob(false) }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(134,239,172,0.12)' : 'transparent',
                      color: active ? '#86efac' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s', textAlign: 'right',
                    }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{label}</span>
                      {hasBadge && (
                        <span style={{ background: '#fbbf24', color: '#78350f', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100, lineHeight: '18px' }}>{badgeCount}</span>
                      )}
                      {id === 'new-booking' && (
                        <span style={{ background: 'rgba(134,239,172,0.15)', color: '#86efac', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100, lineHeight: '18px' }}>جديد</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <a href="/" target="_blank" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            <FiExternalLink size={14} /><span>عرض الموقع</span>
          </a>
          <button onClick={() => signOut(auth)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Cairo, sans-serif', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'none' }}>
            <FiLogOut size={14} /><span>تسجيل الخروج</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(134,239,172,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiUser size={13} color="#86efac" />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, marginRight: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setMob(s => !s)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }} className="mobile-menu-btn">
              <FiMenu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{navLabel}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {seedMsg && (
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                {seedMsg}
              </span>
            )}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>متصل</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 28px' }}>
          {openBooking ? (
            <BookingDetailPage
              booking={openBooking}
              rooms={rooms}
              bookings={bookings}
              onBack={() => setOpenBookingId(null)}
              updating={updating}
              onChangeStatus={(s) => changeStatus(openBooking.id, s)}
              assigning={assigning}
              assignErr={assignErr}
              onAssign={(rid) => handleAssign(openBooking.id, rid)}
              onUnassign={() => handleUnassign(openBooking.id)}
              extending={extending}
              extendErr={extendErr}
              onExtend={(d) => handleExtend(openBooking.id, d)}
              deleting={deleting}
              onDelete={async () => { if (await handleDeleteBooking(openBooking)) setOpenBookingId(null) }}
              stageBusy={stageBusy}
              stageErr={stageErr}
              onCheckIn={() => handleCheckIn(openBooking)}
              onCheckOut={(when) => handleCheckOut(openBooking, when)}
            />
          ) : (
            <>
              {tab === 'front-desk'   && <FrontDeskTab bookings={bookings} rooms={rooms} loading={loadingB || loadingR} onOpen={setOpenBookingId} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} stageBusy={stageBusy} onNewBooking={() => setTab('new-booking')} />}
              {tab === 'dashboard'    && <DashboardTab rooms={rooms} bookings={bookings} setTab={setTab} />}
              {tab === 'variants'     && <VariantsTab variants={variants} rooms={rooms} loading={loadingV || loadingR} onAdd={() => { setEditingVariant(null); setTab('variant-form') }} onEdit={v => { setEditingVariant(v); setTab('variant-form') }} onSeed={handleSeed} seeding={seeding} />}
              {tab === 'variant-form' && <VariantFormPage variant={editingVariant} onBack={() => setTab('variants')} />}
              {tab === 'rooms'        && <RoomsTab rooms={rooms} variants={variants} bookings={bookings} loading={loadingR || loadingV} onAdd={() => { setEditingRoom(null); setTab('room-form') }} onEdit={r => { setEditingRoom(r); setTab('room-form') }} onSeed={handleSeed} seeding={seeding} />}
              {tab === 'room-form'    && <RoomFormPage room={editingRoom} variants={variants} onBack={() => setTab('rooms')} />}
              {tab === 'availability' && <AvailabilityTab rooms={rooms} variants={variants} bookings={bookings} loading={loadingR || loadingB} />}
              {tab === 'bookings'     && <BookingsTab bookings={bookings} loading={loadingB} rooms={rooms} onOpen={setOpenBookingId} />}
              {tab === 'calendar'     && <CalendarTab bookings={bookings} rooms={rooms} loading={loadingB || loadingR} onOpen={setOpenBookingId} />}
              {tab === 'charge-room'  && <ChargeToRoomTab bookings={bookings} loading={loadingB} />}
              {tab === 'new-booking'  && <NewBookingTab rooms={rooms} variants={variants} bookings={bookings} onDone={() => setTab('bookings')} />}
              {tab === 'hike'         && <HikeTab content={hikeContent} applications={hikeApps} />}
            </>
          )}
        </main>
      </div>

    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Dashboard tab
───────────────────────────────────────────────────────────── */
function DashboardTab({ rooms, bookings, setTab }) {
  const active     = rooms.filter(r => r.active !== false).length
  const occupied   = bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status)).length
  const pending    = bookings.filter(b => b.status === 'pending').length
  const unassigned = bookings.filter(b => !b.roomId && !['cancelled', 'checked-out'].includes(b.status)).length
  const revenue    = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.totalPrice || 0), 0)
  const outstanding = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + Math.max(0, computeBookingFinance(b).balance), 0)
  const recent     = bookings.slice(0, 6)

  const fmtD = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' }) } catch { return '—' } }

  const kpis = [
    { label: 'إجمالي الغرف',    value: rooms.length,  sub: `${active} نشطة`,       Icon: FiLayers,     accent: '#3d5a3a' },
    { label: 'حجوزات نشطة',     value: occupied,      sub: 'ضيف داخل المنتجع',     Icon: FiUsers,      accent: '#1d4ed8' },
    { label: 'غير معينة',       value: unassigned,    sub: unassigned ? 'تحتاج تعيين غرفة' : 'الكل معين', Icon: FiHome, accent: unassigned ? '#b45309' : '#6b7280' },
    { label: 'بانتظار التأكيد', value: pending,       sub: pending ? 'تحتاج مراجعة' : 'لا يوجد معلق', Icon: FiClock, accent: pending ? '#b45309' : '#6b7280' },
    { label: 'إجمالي الإيرادات',value: `${revenue.toLocaleString()}`, sub: 'كل الحجوزات غير الملغاة', Icon: FiCreditCard, accent: '#15803d' },
    { label: 'مستحقات (المتبقّي)', value: `${outstanding.toLocaleString()}`, sub: outstanding ? 'مبالغ غير محصّلة' : 'لا مستحقات', Icon: FiTrendingDown, accent: outstanding ? '#b45309' : '#6b7280' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, background: k.accent + '12', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.Icon size={16} color={k.accent} />
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 6 }}>{k.value}</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>{k.label}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Recent bookings table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiBookOpen size={15} color="#6B7280" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>آخر الحجوزات</span>
            </div>
            <button onClick={() => setTab('bookings')} style={{ fontSize: 12, color: '#3d5a3a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>عرض الكل</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>لا توجد حجوزات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {['الضيف', 'الغرفة', 'الوصول', 'المغادرة', 'الحالة'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((b, i) => {
                  const s = STATUS[b.status] || STATUS.confirmed
                  return (
                    <tr key={b.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #F9FAFB' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.guestName}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{b.guestPhone}</p>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{b.roomNameAr}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{fmtD(b.checkIn)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{fmtD(b.checkOut)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusPill status={b.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1C2B1C', borderRadius: 12, padding: '20px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>إجراءات سريعة</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'إنشاء حجز جديد', id: 'new-booking', Icon: FiPlusCircle, accent: '#86efac' },
                { label: 'إدارة الحجوزات', id: 'bookings',    Icon: FiBookOpen,   accent: 'rgba(255,255,255,0.6)' },
                { label: 'فحص الإتاحة',    id: 'availability',Icon: FiCalendar,   accent: 'rgba(255,255,255,0.6)' },
              ].map(item => (
                <button key={item.id} onClick={() => setTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: item.accent, fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 500, cursor: 'pointer', textAlign: 'right', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                  <item.Icon size={15} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>إحصائيات الحجوزات</p>
            {Object.entries(STATUS).map(([k, v]) => {
              const count = bookings.filter(b => b.status === k).length
              const pct   = bookings.length ? Math.round(count / bookings.length * 100) : 0
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <StatusPill status={k} />
                  <div style={{ flex: 1, height: 4, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: v.color, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 24, textAlign: 'left' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Rooms tab
───────────────────────────────────────────────────────────── */
function RoomsTab({ rooms, variants, bookings, loading, onAdd, onEdit, onSeed, seeding }) {
  const [search,      setSearch]  = useState('')
  const [floorF,      setFloor]   = useState('all')
  const [typeF,       setType]    = useState('all')
  const [activeF,     setActive]  = useState('all')
  const [deleting,    setDel]     = useState(null)

  const floors   = ['all', ...new Set(rooms.map(r => r.floor).filter(Boolean).sort())]
  const types    = ['all', ...new Set(rooms.map(r => r.type).filter(Boolean).sort())]
  const activeBookings  = bookings.filter(b => ['confirmed', 'pending', 'checked-in'].includes(b.status))
  const occupiedIds     = new Set(activeBookings.map(b => b.roomId))

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    return (!search || r.number?.includes(q) || r.type?.toLowerCase().includes(q))
      && (floorF  === 'all' || String(r.floor) === String(floorF))
      && (typeF   === 'all' || r.type === typeF)
      && (activeF === 'all' || (activeF === 'active' ? r.active !== false : r.active === false))
  })

  const handleDelete = async room => {
    if (!confirm(`حذف غرفة ${room.number}؟`)) return
    setDel(room.id)
    try { await deleteDoc(doc(db, 'rooms', room.id)) }
    catch (e) { alert(e.message) }
    finally { setDel(null) }
  }
  const toggleActive = r => updateDoc(doc(db, 'rooms', r.id), { active: !r.active, updatedAt: Timestamp.now() })

  if (loading) return <PageLoader />

  const chips = [
    { label: 'إجمالي',  v: rooms.length,                                 c: '#374151', bg: '#F3F4F6' },
    { label: 'نشطة',    v: rooms.filter(r => r.active !== false).length,  c: '#15803d', bg: '#f0fdf4' },
    { label: 'مخفية',   v: rooms.filter(r => r.active === false).length,   c: '#b91c1c', bg: '#fef2f2' },
    { label: 'محجوزة',  v: occupiedIds.size,                              c: '#1d4ed8', bg: '#eff6ff' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chips.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: c.bg, border: `1px solid ${c.c}20` }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: c.c, lineHeight: 1 }}>{c.v}</span>
            <span style={{ fontSize: 12, color: c.c, opacity: 0.8 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الغرفة أو الاسم أو النوع..."
            style={{ ...filterInp, paddingRight: 36 }} />
        </div>
        <select value={floorF} onChange={e => setFloor(e.target.value)} style={filterInp}>
          <option value="all">كل الطوابق</option>
          {floors.filter(f => f !== 'all').map(f => <option key={f} value={f}>الطابق {f}</option>)}
        </select>
        <select value={typeF} onChange={e => setType(e.target.value)} style={filterInp}>
          <option value="all">كل الفئات</option>
          {types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{CATEGORY_LABEL_AR[t] || t}</option>)}
        </select>
        <select value={activeF} onChange={e => setActive(e.target.value)} style={filterInp}>
          <option value="all">كل الحالات</option>
          <option value="active">نشطة فقط</option>
          <option value="inactive">مخفية فقط</option>
        </select>
        <div style={{ display: 'flex', gap: 8, marginRight: 'auto' }}>
          <Btn onClick={onSeed} disabled={seeding} variant="outline" icon={<FiDatabase size={14} />}>{seeding ? 'جارٍ...' : 'إعادة التهيئة'}</Btn>
          <Btn onClick={onAdd} icon={<FiPlus size={14} />}>إضافة غرفة</Btn>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF' }}>{filtered.length} غرفة</p>

      {filtered.length === 0 ? (
        <Empty icon={<FiLayers size={28} />} text="لا توجد غرف. اضغط «إضافة الـ١٤ غرفة» للبدء." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onEdit={onEdit} onDelete={handleDelete} onToggle={toggleActive}
              deleting={deleting === room.id} isOccupied={occupiedIds.has(room.id)}
              booking={activeBookings.find(b => b.roomId === room.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, onEdit, onDelete, onToggle, deleting, isOccupied, booking }) {
  const variantLabel = CATEGORY_LABEL_AR[room.type] || room.type || '—'
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: room.active === false ? 0.65 : 1, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}>
      {/* Body */}
      <div style={{ padding: '16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>غرفة {room.number}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>الطابق {room.floor} · سعة {room.capacity}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: room.active !== false ? '#f0fdf4' : '#F9FAFB', color: room.active !== false ? '#15803d' : '#6B7280', border: `1px solid ${room.active !== false ? '#bbf7d0' : '#E5E7EB'}` }}>
              {room.active !== false ? <FiEye size={10} /> : <FiEyeOff size={10} />}
              {room.active !== false ? 'نشطة' : 'مخفية'}
            </span>
            {isOccupied && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>محجوزة</span>}
          </div>
        </div>
        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 5, marginBottom: 12 }}>{variantLabel} · {room.capacity} أشخاص</span>
        {booking && (
          <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 8, padding: '8px 10px', marginBottom: 12, fontSize: 12 }}>
            <p style={{ fontWeight: 700, color: '#1E40AF', marginBottom: 2 }}>{booking.guestName}</p>
            <p style={{ color: '#3B82F6' }}>{booking.guestPhone}</p>
          </div>
        )}
        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(room)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#1C2B1C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2d4429'}
            onMouseLeave={e => e.currentTarget.style.background = '#1C2B1C'}>
            <FiEdit2 size={12} /> تعديل
          </button>
          <button onClick={() => onToggle(room)} title={room.active !== false ? 'إخفاء' : 'إظهار'} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB' }}>
            {room.active !== false ? <FiEyeOff size={13} /> : <FiEye size={13} />}
          </button>
          <button onClick={() => onDelete(room)} disabled={deleting} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FCA5A5' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA' }}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Availability tab
───────────────────────────────────────────────────────────── */
function AvailabilityTab({ rooms, variants = [], bookings, loading }) {
  const variantOf = (room) => variants.find(v =>
    v.type === room.type && Number(v.capacity) === Number(room.capacity)
  )
  const labelFor = (room) => {
    const v = variantOf(room)
    return v?.nameAr || `${CATEGORY_LABEL_AR[room.type] || room.type} — ${room.capacity}p`
  }
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [from, setFrom] = useState(today)
  const [to,   setTo]   = useState(tomorrow)

  const setRange = d => { setFrom(new Date().toISOString().split('T')[0]); setTo(new Date(Date.now() + d * 86400000).toISOString().split('T')[0]) }
  const getBooking = room => bookings.find(b => {
    if (b.roomId !== room.id || ['cancelled', 'checked-out'].includes(b.status)) return false
    const bIn  = b.checkIn?.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
    const bOut = b.checkOut?.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
    return bIn < new Date(to) && bOut > new Date(from)
  })
  const fmtD = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' }) } catch { return '—' } }

  const [blockBusy, setBlockBusy] = useState(null)
  const [blockErr,  setBlockErr]  = useState('')
  const handleBlock = async (roomId, until) => {
    setBlockBusy(roomId); setBlockErr('')
    try { await setRoomBlock(roomId, until) }
    catch (e) { setBlockErr('فشل الحظر: ' + (e?.message || '')) }
    finally { setBlockBusy(null) }
  }
  const handleUnblock = async (roomId) => {
    setBlockBusy(roomId); setBlockErr('')
    try { await clearRoomBlock(roomId) }
    catch (e) { setBlockErr('فشل إلغاء الحظر: ' + (e?.message || '')) }
    finally { setBlockBusy(null) }
  }

  if (loading) return <PageLoader />

  const rangeFrom = new Date(from)
  const rangeTo   = new Date(to)
  const withStatus = rooms.map(r => ({
    room:    r,
    booking: getBooking(r),
    blocked: isRoomBlockedInRange(r, rangeFrom, rangeTo),
  }))
  const occupied   = withStatus.filter(x => !!x.booking)
  const blockedArr = withStatus.filter(x => !x.booking && x.blocked)
  const available  = withStatus.filter(x => !x.booking && !x.blocked && x.room.active !== false)
  const inactive   = withStatus.filter(x => !x.booking && !x.blocked && x.room.active === false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date picker panel */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <FiCalendar size={14} color="#6B7280" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>تحديد الفترة الزمنية</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={smallLbl}>من</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={smallLbl}>إلى</label>
            <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['اليوم', 1], ['٣ أيام', 3], ['أسبوع', 7], ['شهر', 30]].map(([l, d]) => (
              <button key={d} onClick={() => setRange(d)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3d5a3a'; e.currentTarget.style.color = '#3d5a3a' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {blockErr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
          <FiAlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#b91c1c' }}>{blockErr}</span>
        </div>
      )}

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'متاحة',   v: available.length,  c: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'محجوزة',  v: occupied.length,   c: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'محظورة',  v: blockedArr.length, c: '#b45309', bg: '#fffbeb', border: '#fde68a' },
          { label: 'مخفية',   v: inactive.length,   c: '#6b7280', bg: '#F9FAFB', border: '#E5E7EB' },
          { label: 'الإجمالي',v: rooms.length,      c: '#374151', bg: '#fff',    border: '#E5E7EB' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.c, lineHeight: 1, marginBottom: 4 }}>{s.v}</p>
            <p style={{ fontSize: 12, color: s.c, opacity: 0.7, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Occupied rooms */}
      {occupied.length > 0 && (
        <AvailSection title={`الغرف المحجوزة (${occupied.length})`} color="#1d4ed8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {occupied.map(({ room, booking }) => (
              <div key={room.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #BFDBFE', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>غرفة {room.number}</p>
                  <StatusPill status={booking.status} />
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>الطابق {room.floor} · {labelFor(room)}</p>
                <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                  <p style={{ fontWeight: 700, color: '#1E40AF', marginBottom: 3 }}>{booking.guestName}</p>
                  <p style={{ color: '#3B82F6', marginBottom: 3 }}>{booking.guestPhone}</p>
                  <p style={{ color: '#93C5FD', fontSize: 11 }}>{fmtD(booking.checkIn)} ← {fmtD(booking.checkOut)} · {booking.guests} أشخاص</p>
                  {booking.totalPrice && <p style={{ color: '#1D4ED8', fontWeight: 700, marginTop: 4 }}>{booking.totalPrice}</p>}
                </div>
              </div>
            ))}
          </div>
        </AvailSection>
      )}

      {/* Blocked rooms */}
      {blockedArr.length > 0 && (
        <AvailSection title={`الغرف المحظورة (${blockedArr.length})`} color="#b45309">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {blockedArr.map(({ room }) => (
              <div key={room.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #FDE68A', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>غرفة {room.number}</p>
                  <FiLock size={12} color="#b45309" />
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{labelFor(room)} · {room.capacity} أشخاص</p>
                <p style={{ fontSize: 11, color: '#92400E', marginBottom: 8 }}>محظورة حتى {fmtD(room.blockedUntil)}</p>
                <button
                  onClick={() => handleUnblock(room.id)}
                  disabled={blockBusy === room.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', cursor: blockBusy === room.id ? 'wait' : 'pointer', fontFamily: 'Cairo, sans-serif' }}
                >
                  <FiUnlock size={11} /> {blockBusy === room.id ? 'جارٍ...' : 'إلغاء الحظر'}
                </button>
              </div>
            ))}
          </div>
        </AvailSection>
      )}

      {/* Available rooms */}
      {available.length > 0 && (
        <AvailSection title={`الغرف المتاحة (${available.length})`} color="#15803d">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {available.map(({ room }) => (
              <AvailableRoomCard
                key={room.id}
                room={room}
                label={labelFor(room)}
                busy={blockBusy === room.id}
                onBlock={(until) => handleBlock(room.id, until)}
              />
            ))}
          </div>
        </AvailSection>
      )}

      {inactive.length > 0 && (
        <AvailSection title={`مخفية (${inactive.length})`} color="#9CA3AF">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {inactive.map(({ room }) => (
              <div key={room.id} style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 14px', opacity: 0.7 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>غرفة {room.number} · {labelFor(room)}</p>
              </div>
            ))}
          </div>
        </AvailSection>
      )}
    </div>
  )
}

function AvailSection({ title, color, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function AvailableRoomCard({ room, label, busy, onBlock }) {
  const [expanded, setExpanded] = useState(false)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [until, setUntil] = useState(tomorrow)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #BBF7D0', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>غرفة {room.number}</p>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      </div>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{label} · {room.capacity} أشخاص</p>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
        >
          <FiLock size={11} /> حظر حتى تاريخ
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={until}
            min={today}
            onChange={e => setUntil(e.target.value)}
            style={{ flex: 1, minWidth: 110, padding: '5px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #E5E7EB', fontFamily: 'Cairo, sans-serif', outline: 'none' }}
          />
          <button
            onClick={() => until && onBlock(until)}
            disabled={!until || busy}
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: 'none', background: (!until || busy) ? '#E5E7EB' : '#1C2B1C', color: (!until || busy) ? '#9CA3AF' : '#fff', cursor: (!until || busy) ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}
          >
            {busy ? 'جارٍ...' : 'حظر'}
          </button>
          <button
            onClick={() => setExpanded(false)}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
            title="إلغاء"
          >
            <FiX size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Bookings tab  (table layout)
───────────────────────────────────────────────────────────── */
function BookingsTab({ bookings, loading, onOpen }) {
  const [statusF,  setStatusF]  = useState('all')
  const [search,   setSearch]   = useState('')
  const [updating, setUpdating] = useState(null)
  const [deleting, setDel]      = useState(null)

  const filtered = bookings.filter(b => {
    const isUnassigned = !b.roomId
    const matchesUnassignedFilter = statusF === 'unassigned' ? isUnassigned : true
    const matchesStatus = statusF === 'all' || statusF === 'unassigned' || b.status === statusF
    return matchesStatus && matchesUnassignedFilter
      && (!search || b.guestName?.includes(search) || b.guestPhone?.includes(search)
          || b.roomNameAr?.includes(search) || b.roomNumber?.includes(search)
          || b.roomType?.includes(search))
  })

  const changeStatus = async (id, status) => {
    setUpdating(id)
    try { await updateDoc(doc(db, 'bookings', id), { status }) }
    catch { alert('فشل التحديث') }
    finally { setUpdating(null) }
  }

  const handleDelete = async b => {
    if (!confirm(`حذف حجز ${b.guestName}؟`)) return
    setDel(b.id)
    try { await deleteDoc(doc(db, 'bookings', b.id)) }
    catch { alert('فشل الحذف') }
    finally { setDel(null) }
  }

  const fmtD = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: '2-digit' }) } catch { return '—' } }

  if (loading) return <PageLoader />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الضيف، الهاتف، أو رقم الغرفة..."
            style={{ ...filterInp, paddingRight: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['all', 'الكل'],
            ['unassigned', 'غير معينة'],
            ...Object.entries(STATUS).map(([k, v]) => [k, v.label]),
          ].map(([k, l]) => {
            const active = statusF === k
            const count = k === 'unassigned'
              ? bookings.filter(b => !b.roomId && !['cancelled', 'checked-out'].includes(b.status)).length
              : k === 'all'
                ? null
                : bookings.filter(b => b.status === k).length
            return (
              <button key={k} onClick={() => setStatusF(k)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: active ? '#1C2B1C' : (k === 'unassigned' ? '#FFFBEB' : '#F9FAFB'),
                color: active ? '#fff' : (k === 'unassigned' ? '#b45309' : '#6B7280'),
                borderColor: active ? '#1C2B1C' : (k === 'unassigned' ? '#FDE68A' : '#E5E7EB'),
              }}>{l} {count != null && <span style={{ opacity: 0.65 }}>({count})</span>}</button>
            )
          })}
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF' }}>{filtered.length} حجز</p>

      {filtered.length === 0 ? (
        <Empty icon={<FiBookOpen size={28} />} text="لا توجد حجوزات تطابق البحث" />
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                {['#', 'الضيف', 'الغرفة', 'الوصول', 'المغادرة', 'الليالي', 'المبلغ', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const nights = b.nights || Math.max(1, Math.ceil((new Date(b.checkOut?.toDate?.() || b.checkOut) - new Date(b.checkIn?.toDate?.() || b.checkIn)) / 86400000))
                const fin    = computeBookingFinance(b)
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => onOpen(b.id)}>
                    <td style={{ padding: '12px 14px' }}>
                      <code style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace', fontWeight: 600 }}>
                        #{b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id.slice(0, 6).toUpperCase()}
                      </code>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 1 }}>{b.guestName}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{b.guestPhone}</p>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      {b.roomId ? (
                        <>
                          {b.roomNameAr}<span style={{ color: '#9CA3AF', marginRight: 4 }}>#{b.roomNumber}</span>
                        </>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 5, padding: '2px 8px' }}>
                            غير معين
                          </span>
                          {b.roomType && (
                            <span style={{ fontSize: 12, color: '#6B7280' }}>
                              {CATEGORY_LABEL_AR[b.roomType] || b.roomType}
                              {b.roomCapacity ? ` · ${b.roomCapacity} ${b.roomCapacity === 1 ? 'شخص' : 'أشخاص'}` : ''}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtD(b.checkIn)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtD(b.checkOut)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{nights}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {b.totalPrice != null || fin.chargesTotal > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fin.grandTotal}</span>
                          {fin.balance > 0
                            ? <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>متبقّي {fin.balance}</span>
                            : <PaymentStatusPill status="paid" />}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>عند الطلب</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                      <StatusPill status={b.status} />
                    </td>
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {b.status === 'pending' && (
                          <button onClick={() => changeStatus(b.id, 'confirmed')} disabled={updating === b.id} title="تأكيد الحجز"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap' }}>
                            <FiCheck size={12} /> تأكيد
                          </button>
                        )}
                        <a
                          href={buildCustomerWhatsAppUrl(b, 'ar')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`تأكيد الحجز مع ${b.guestName} عبر واتساب`}
                          style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                        >
                          <FiMessageCircle size={13} />
                        </a>
                        <button onClick={() => onOpen(b.id)} title="عرض التفاصيل" style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap' }}>
                          التفاصيل <FiChevronLeft size={13} />
                        </button>
                        <button onClick={() => handleDelete(b)} disabled={deleting === b.id} style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Booking detail — full page opened when a booking row is clicked.
   Clearer than the old inline dropdown: all guest, stay, room and
   money controls on one screen.
───────────────────────────────────────────────────────────── */
function BookingDetailPage({
  booking: b, rooms, bookings, onBack,
  updating, onChangeStatus,
  assigning, assignErr, onAssign, onUnassign,
  extending, extendErr, onExtend,
  deleting, onDelete,
  stageBusy, stageErr, onCheckIn, onCheckOut,
}) {
  const fin = computeBookingFinance(b)
  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.checkOut?.toDate?.() || b.checkOut) - new Date(b.checkIn?.toDate?.() || b.checkIn)) / 86400000))
  const fmtFull = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '—' } }
  const fmtTime = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '—' } }
  const ref = b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id.slice(0, 6).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
          <FiChevronRight size={14} /> رجوع إلى الحجوزات
        </button>
        <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{b.guestName}</h2>
            <code style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace', fontWeight: 600 }}>#{ref}</code>
            <StatusPill status={b.status} />
            <PaymentStatusPill status={fin.paymentStatus} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={buildCustomerWhatsAppUrl(b, 'ar')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: '#15803d', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, textDecoration: 'none' }}>
            <FiMessageCircle size={14} /> واتساب
          </a>
          <button onClick={onDelete} disabled={deleting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: deleting ? 'wait' : 'pointer' }}>
            <FiTrash2 size={13} /> حذف
          </button>
        </div>
      </div>

      {/* Stage action bar — the receptionist's primary next step */}
      <StageActionBar
        booking={b} fin={fin} busy={stageBusy} error={stageErr}
        onConfirm={() => onChangeStatus('confirmed')} onCheckIn={onCheckIn} onCheckOut={onCheckOut}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
        {/* Left column: money + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FolioPanel booking={b} editablePrice />

          <AssignRoomControl
            booking={b}
            rooms={rooms}
            bookings={bookings}
            busy={assigning}
            error={assignErr}
            onAssign={onAssign}
            onUnassign={onUnassign}
          />

          <ExtendStayControl
            booking={b}
            busy={extending}
            error={extendErr}
            onSave={onExtend}
          />
        </div>

        {/* Right column: guest + stay info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUser size={14} color="#6B7280" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>معلومات الضيف</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <InfoItem icon={<FiPhone size={13} />} label="الهاتف" value={b.guestPhone} />
              {b.guestEmail && <InfoItem icon={<FiMail size={13} />} label="البريد" value={b.guestEmail} />}
              <InfoItem icon={<FiUsers size={13} />} label="الأشخاص" value={`${b.guests} ضيف`} />
              {b.source && <InfoItem icon={<FiSliders size={13} />} label="المصدر" value={SOURCE_LABELS[b.source] || b.source} />}
              <InfoItem icon={<FiClock size={13} />} label="تاريخ الحجز" value={fmtFull(b.createdAt)} />
              {b.notes && <InfoItem icon={<FiMessageSquare size={13} />} label="ملاحظات" value={b.notes} />}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCalendar size={14} color="#6B7280" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>تفاصيل الإقامة</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <InfoItem icon={<FiHome size={13} />} label="الغرفة" value={b.roomId ? `${b.roomNameAr || ''} · ${b.roomNumber}` : 'غير معيّنة'} />
              <InfoItem icon={<FiCalendar size={13} />} label="الوصول" value={fmtFull(b.checkIn)} />
              <InfoItem icon={<FiCalendar size={13} />} label="المغادرة" value={fmtFull(b.checkOut)} />
              <InfoItem icon={<FiClock size={13} />} label="الليالي" value={`${nights} ليلة`} />
              {b.checkedInAt  && <InfoItem icon={<FiLogIn size={13} />}  label="سجّل الوصول"  value={fmtTime(b.checkedInAt)} />}
              {b.checkedOutAt && <InfoItem icon={<FiLogOut size={13} />} label="سجّل المغادرة" value={fmtTime(b.checkedOutAt)} />}
            </div>
          </div>

          {/* Status control */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '14px 16px' }}>
            <label style={smallLbl}>حالة الحجز</label>
            <select value={b.status || 'confirmed'} onChange={e => onChangeStatus(e.target.value)} disabled={updating}
              style={{ ...fieldStyle, fontWeight: 700, color: STATUS[b.status]?.color || '#374151', opacity: updating ? 0.5 : 1 }}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Current local date-time as a value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
function nowLocalStr() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/* ─────────────────────────────────────────────────────────────
   Stage action bar — shows the guest's current stage in the stay
   lifecycle and the one obvious next action for the receptionist.
───────────────────────────────────────────────────────────── */
function StageActionBar({ booking: b, fin, busy, error, onConfirm, onCheckIn, onCheckOut }) {
  const status = b.status || 'confirmed'
  const [departAt, setDepartAt] = useState(nowLocalStr())
  const bigBtn = (bg, disabled = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10,
    background: disabled ? '#E5E7EB' : bg, color: disabled ? '#9CA3AF' : '#fff', border: 'none',
    fontSize: 14, fontWeight: 700, fontFamily: 'Cairo, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
  })

  let tone = '#F9FAFB', bTone = '#E5E7EB', message = null, action = null

  if (status === 'cancelled') {
    tone = '#FEF2F2'; bTone = '#FECACA'
    message = 'هذا الحجز ملغى.'
  } else if (status === 'checked-out') {
    tone = '#F0FDF4'; bTone = '#BBF7D0'
    message = fin.balance > 0 ? `غادر الضيف — لكن يوجد مبلغ متبقٍّ ${fin.balance}.` : 'غادر الضيف. الحساب مسدَّد بالكامل. ✓'
  } else if (status === 'checked-in') {
    tone = '#EFF6FF'; bTone = '#BFDBFE'
    message = fin.balance > 0
      ? `الضيف داخل المنتجع. المتبقّي على الحساب: ${fin.balance}.`
      : 'الضيف داخل المنتجع. الحساب مسدَّد.'
    action = (
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>وقت المغادرة</label>
          <input type="datetime-local" value={departAt} onChange={e => setDepartAt(e.target.value)}
            style={{ ...fieldStyle, padding: '8px 10px', fontSize: 12.5, width: 200 }} />
        </div>
        <button onClick={() => onCheckOut(departAt)} disabled={busy} style={bigBtn('#1d4ed8', busy)}>
          <FiLogOut size={16} /> {busy ? 'جارٍ...' : 'تسجيل المغادرة'}
        </button>
      </div>
    )
  } else {
    // pending or confirmed → arriving guest
    if (!b.roomId) {
      tone = '#FFFBEB'; bTone = '#FDE68A'
      message = 'قبل تسجيل الوصول، عيّن غرفة للحجز من الأسفل.'
    } else {
      tone = '#F0FDF4'; bTone = '#BBF7D0'
      message = status === 'pending' ? 'حجز غير مؤكد — أكّده ثم سجّل وصول الضيف.' : 'جاهز لتسجيل وصول الضيف.'
    }
    action = (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {status === 'pending' && (
          <button onClick={onConfirm} disabled={busy} style={bigBtn('#3d5a3a', busy)}>
            <FiCheck size={16} /> تأكيد الحجز
          </button>
        )}
        <button onClick={onCheckIn} disabled={busy || !b.roomId} style={bigBtn('#15803d', busy || !b.roomId)}>
          <FiLogIn size={16} /> {busy ? 'جارٍ...' : 'تسجيل الوصول'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: tone, border: `1px solid ${bTone}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusPill status={status} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{message}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {error && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#b91c1c' }}><FiAlertCircle size={13} /> {error}</span>}
        {action}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Front Desk — the receptionist's home screen: today's arrivals,
   in-house guests, and today's departures, with one-click actions.
───────────────────────────────────────────────────────────── */
function FrontDeskTab({ bookings, rooms, loading, onOpen, onCheckIn, onCheckOut, stageBusy, onNewBooking }) {
  const [search, setSearch] = useState('')
  if (loading) return <PageLoader />

  const todayStr = new Date().toISOString().split('T')[0]
  const dayStr = d => {
    const dt = d?.toDate ? d.toDate() : (d ? new Date(d) : null)
    if (!dt || isNaN(dt.getTime())) return ''
    return dt.toISOString().split('T')[0]
  }
  const active = b => !['cancelled', 'checked-out'].includes(b.status)
  const matchesSearch = b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.guestName?.toLowerCase().includes(q) || b.guestPhone?.includes(search) || String(b.roomNumber || '').includes(search)
  }

  const arrivals = bookings.filter(b => active(b) && b.status !== 'checked-in'
    && dayStr(b.checkIn) <= todayStr && dayStr(b.checkOut) > todayStr && matchesSearch(b))
  const inHouse  = bookings.filter(b => b.status === 'checked-in' && matchesSearch(b))
  const departures = bookings.filter(b => b.status === 'checked-in'
    && dayStr(b.checkOut) <= todayStr && matchesSearch(b))

  const activeRooms = rooms.filter(r => r.active !== false).length
  const occupied = new Set(inHouse.map(b => b.roomId).filter(Boolean)).size

  const kpis = [
    { label: 'وصول اليوم',   value: arrivals.length,   accent: '#15803d', Icon: FiLogIn },
    { label: 'داخل المنتجع', value: inHouse.length,    accent: '#1d4ed8', Icon: FiUsers },
    { label: 'مغادرة اليوم', value: departures.length, accent: '#b45309', Icon: FiLogOut },
    { label: 'الإشغال',      value: `${occupied}/${activeRooms}`, accent: '#3d5a3a', Icon: FiHome },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>المكتب الأمامي</h2>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>{new Date().toLocaleDateString('ar-SY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Btn onClick={onNewBooking} icon={<FiPlusCircle size={15} />}>حجز جديد</Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: k.accent + '14', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <k.Icon size={17} color={k.accent} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 420 }}>
        <FiSearch size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو رقم الغرفة..." style={{ ...fieldStyle, paddingRight: 36 }} />
      </div>

      {/* Departures first — most time-sensitive */}
      <FrontDeskSection title="مغادرة اليوم" count={departures.length} color="#b45309" empty="لا مغادرات اليوم.">
        {departures.map(b => (
          <FrontDeskCard key={b.id} booking={b} kind="departure" busy={stageBusy}
            onOpen={() => onOpen(b.id)} onAction={() => onCheckOut(b)} />
        ))}
      </FrontDeskSection>

      <FrontDeskSection title="وصول اليوم" count={arrivals.length} color="#15803d" empty="لا وصول متوقع اليوم.">
        {arrivals.map(b => (
          <FrontDeskCard key={b.id} booking={b} kind="arrival" busy={stageBusy}
            onOpen={() => onOpen(b.id)} onAction={() => onCheckIn(b)} />
        ))}
      </FrontDeskSection>

      <FrontDeskSection title="نزلاء داخل المنتجع" count={inHouse.length} color="#1d4ed8" empty="لا يوجد نزلاء حالياً.">
        {inHouse.map(b => (
          <FrontDeskCard key={b.id} booking={b} kind="in-house" busy={stageBusy}
            onOpen={() => onOpen(b.id)} onAction={() => onCheckOut(b)} />
        ))}
      </FrontDeskSection>
    </div>
  )
}

function FrontDeskSection({ title, count, color, empty, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</p>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: color + '14', borderRadius: 100, padding: '1px 9px' }}>{count}</span>
      </div>
      {count === 0
        ? <p style={{ fontSize: 13, color: '#9CA3AF', padding: '2px 2px 4px' }}>{empty}</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>{children}</div>}
    </div>
  )
}

function FrontDeskCard({ booking: b, kind, busy, onOpen, onAction }) {
  const fin = computeBookingFinance(b)
  const hasRoom = !!b.roomId
  const fmtD = d => { try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' }) } catch { return '—' } }

  const cfg = {
    arrival:   { btn: 'تسجيل الوصول',  Icon: FiLogIn,  bg: '#15803d' },
    departure: { btn: 'تسجيل المغادرة', Icon: FiLogOut, bg: '#1d4ed8' },
    'in-house':{ btn: 'تسجيل المغادرة', Icon: FiLogOut, bg: '#1d4ed8' },
  }[kind]

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 40, borderRadius: 9, background: hasRoom ? '#1C2B1C' : '#FEF3C7', color: hasRoom ? '#86efac' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
          {hasRoom ? b.roomNumber : '—'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.guestName}</p>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>{b.guestPhone} · {b.guests} ضيف</p>
        </div>
        {fin.balance > 0
          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>متبقّي {fin.balance}</span>
          : <PaymentStatusPill status="paid" />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
        <FiCalendar size={12} />
        <span>{fmtD(b.checkIn)} ← {fmtD(b.checkOut)}</span>
        {!hasRoom && <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 5, padding: '1px 7px', marginRight: 'auto' }}>بحاجة لتعيين غرفة</span>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAction} disabled={busy || (kind === 'arrival' && !hasRoom)}
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Cairo, sans-serif',
            background: (busy || (kind === 'arrival' && !hasRoom)) ? '#E5E7EB' : cfg.bg,
            color: (busy || (kind === 'arrival' && !hasRoom)) ? '#9CA3AF' : '#fff',
            cursor: (busy || (kind === 'arrival' && !hasRoom)) ? 'not-allowed' : 'pointer' }}>
          <cfg.Icon size={14} /> {cfg.btn}
        </button>
        <button onClick={onOpen} title="التفاصيل"
          style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
          التفاصيل <FiChevronLeft size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Inline extend-stay editor (rendered inside the booking detail)
───────────────────────────────────────────────────────────── */
function ExtendStayControl({ booking, busy, error, onSave }) {
  const current = booking.checkOut?.toDate
    ? booking.checkOut.toDate().toISOString().split('T')[0]
    : new Date(booking.checkOut).toISOString().split('T')[0]
  const checkInISO = booking.checkIn?.toDate
    ? booking.checkIn.toDate().toISOString().split('T')[0]
    : new Date(booking.checkIn).toISOString().split('T')[0]

  const minDate = new Date(new Date(checkInISO).getTime() + 86400000).toISOString().split('T')[0]
  const [newOut, setNewOut] = useState(current)

  useEffect(() => { setNewOut(current) }, [current])

  const changed = newOut && newOut !== current

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, flexWrap: 'wrap' }}>
      <FiCalendar size={14} color="#6B7280" />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>تمديد الإقامة</span>
      <span style={{ fontSize: 11, color: '#9CA3AF' }}>المغادرة الحالية: {current}</span>
      <input
        type="date"
        value={newOut}
        min={minDate}
        onChange={e => setNewOut(e.target.value)}
        style={{ ...fieldStyle, padding: '6px 10px', width: 160, fontSize: 12 }}
      />
      <button
        onClick={() => changed && onSave(newOut)}
        disabled={!changed || busy}
        style={{
          padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700,
          fontFamily: 'Cairo, sans-serif',
          background: (!changed || busy) ? '#E5E7EB' : '#1C2B1C',
          color:      (!changed || busy) ? '#9CA3AF' : '#fff',
          cursor:     (!changed || busy) ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        {busy
          ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</>
          : <><FiCheck size={12} /> حفظ</>}
      </button>
      {error && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#b91c1c' }}>
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Inline assign-room control (for type-only customer bookings)
───────────────────────────────────────────────────────────── */
function AssignRoomControl({ booking, rooms, bookings, busy, error, onAssign, onUnassign }) {
  const [pick, setPick] = useState('')
  const assigned = !!booking.roomId

  const bIn  = booking.checkIn?.toDate  ? booking.checkIn.toDate()  : new Date(booking.checkIn)
  const bOut = booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut)
  const reqCap = Number(booking.roomCapacity) || null

  // Match rooms with exact (type, capacity). Capacity must match because
  // each variant is a separate listing — a Premium-4 booking cannot be
  // filled with a Premium-5 room (and vice versa). The room currently
  // assigned to this booking is flagged so it can't be re-picked.
  const candidates = rooms
    .filter(r => r.active !== false
      && r.type === booking.roomType
      && (reqCap == null || Number(r.capacity) === reqCap))
    .map(r => {
      const isCurrent = r.id === booking.roomId
      const bookingConflict = bookings.some(o => {
        if (o.id === booking.id) return false
        if (o.roomId !== r.id) return false
        if (['cancelled', 'checked-out'].includes(o.status)) return false
        const oIn  = o.checkIn?.toDate  ? o.checkIn.toDate()  : new Date(o.checkIn)
        const oOut = o.checkOut?.toDate ? o.checkOut.toDate() : new Date(o.checkOut)
        return oIn < bOut && oOut > bIn
      })
      const blocked = isRoomBlockedInRange(r, bIn, bOut)
      return { room: r, isCurrent, conflict: bookingConflict || blocked, blocked }
    })
    .sort((a, b) => +a.room.number - +b.room.number)

  const accent = assigned ? '#374151' : '#b45309'
  const bg     = assigned ? '#F9FAFB' : '#FFFBEB'
  const border = assigned ? '#E5E7EB' : '#FDE68A'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, flexWrap: 'wrap' }}>
      <FiHome size={14} color={accent} />
      <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{assigned ? 'تغيير الغرفة' : 'تعيين غرفة'}</span>
      <span style={{ fontSize: 11, color: assigned ? '#6B7280' : '#92400E' }}>
        {assigned ? `الحالية: غرفة ${booking.roomNumber} · ` : ''}
        {CATEGORY_LABEL_AR[booking.roomType] || booking.roomType}
        {reqCap ? ` · ${reqCap} ${reqCap === 1 ? 'شخص' : 'أشخاص'}` : ''}
      </span>
      <select
        value={pick}
        onChange={e => setPick(e.target.value)}
        style={{ ...fieldStyle, padding: '6px 10px', width: 220, fontSize: 12 }}
      >
        <option value="">{assigned ? '— اختر غرفة أخرى —' : '— اختر غرفة —'}</option>
        {candidates.length === 0 && <option disabled>لا توجد غرف بهذه السعة</option>}
        {candidates.map(({ room, isCurrent, conflict, blocked }) => (
          <option key={room.id} value={room.id} disabled={conflict || isCurrent}>
            غرفة {room.number} · سعة {room.capacity}{isCurrent ? ' — الحالية' : conflict ? (blocked ? ' — محظورة' : ' — محجوزة') : ''}
          </option>
        ))}
      </select>
      <button
        onClick={() => pick && onAssign(pick)}
        disabled={!pick || busy}
        style={{
          padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700,
          fontFamily: 'Cairo, sans-serif',
          background: (!pick || busy) ? '#E5E7EB' : '#1C2B1C',
          color:      (!pick || busy) ? '#9CA3AF' : '#fff',
          cursor:     (!pick || busy) ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        {busy
          ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</>
          : <><FiCheck size={12} /> {assigned ? 'تغيير' : 'تعيين'}</>}
      </button>
      {assigned && onUnassign && (
        <button
          onClick={onUnassign}
          disabled={busy}
          title="إلغاء تعيين الغرفة"
          style={{
            padding: '6px 12px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2',
            color: '#DC2626', fontSize: 12, fontWeight: 700, fontFamily: 'Cairo, sans-serif',
            cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <FiX size={12} /> إلغاء التعيين
        </button>
      )}
      {error && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#b91c1c' }}>
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Folio panel — TWO separate ledgers so the room bill stays clear
   of the extras (restaurant/café) bill. Each ledger has its own
   total, paid, and remaining. Shared by the booking detail page and
   the Charge-to-Room tab.
───────────────────────────────────────────────────────────── */
function FolioPanel({ booking, editablePrice = false }) {
  const fin = computeBookingFinance(booking)
  const charges  = Array.isArray(booking.charges)  ? booking.charges  : []
  const payments = Array.isArray(booking.payments) ? booking.payments : []
  const roomPayments   = payments.filter(p => (p.ledger || 'room') === 'room')
  const extrasPayments = payments.filter(p => p.ledger === 'extras')

  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  // Room-price editor
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput]     = useState(booking.totalPrice != null ? String(booking.totalPrice) : '')
  useEffect(() => { setPriceInput(booking.totalPrice != null ? String(booking.totalPrice) : '') }, [booking.totalPrice])

  // Add-charge form
  const [cLabel, setCLabel] = useState('')
  const [cAmount, setCAmount] = useState('')
  const [cCat, setCCat]     = useState('restaurant')

  const run = async (fn) => {
    setBusy(true); setError('')
    try { await fn() }
    catch (e) { setError(e?.message === 'INVALID_AMOUNT' ? 'المبلغ غير صالح' : 'فشل الحفظ: ' + (e?.message || '')) }
    finally { setBusy(false) }
  }

  const savePrice = () => run(async () => {
    await updateBookingRoomPrice(booking.id, priceInput)
    setEditingPrice(false)
  })
  const submitCharge = () => {
    if (!(parseFloat(cAmount) > 0)) { setError('أدخل مبلغاً صحيحاً للرسم'); return }
    run(async () => {
      await addBookingCharge(booking.id, { label: cLabel, amount: parseFloat(cAmount), category: cCat })
      setCLabel(''); setCAmount('')
    })
  }
  const addPayment = (ledger, { amount, method }, reset) => run(async () => {
    await addBookingPayment(booking.id, { amount, method, ledger })
    reset && reset()
  })

  const fmtAt = (at) => {
    const d = at?.toDate ? at.toDate() : (at ? new Date(at) : null)
    if (!d || isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
      {/* Header + grand remaining */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCreditCard size={15} color="#6B7280" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>الحساب والمدفوعات</span>
          <PaymentStatusPill status={fin.paymentStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>الإجمالي المتبقّي</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: fin.balance > 0 ? '#b45309' : '#15803d' }}>{fin.balance}</span>
        </div>
      </div>

      {/* Grand summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          ['الإجمالي', `${fin.grandTotal}`, '#111827'],
          ['المدفوع', `${fin.paidTotal}`, '#15803d'],
          ['المتبقّي', `${fin.balance}`, fin.balance > 0 ? '#b45309' : '#15803d'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: c, lineHeight: 1.2 }}>{v}</p>
            <p style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* ── Room ledger ── */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 9, padding: '12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <FiHome size={13} color="#3d5a3a" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>حساب الغرفة</span>
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>سعر الغرفة</span>
            {editingPrice ? (
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <input type="number" min={0} value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="0" autoFocus style={{ ...fieldStyle, width: 90, padding: '5px 8px', fontSize: 12 }} />
                <button onClick={savePrice} disabled={busy} style={{ ...folioAddBtn, padding: '5px 10px' }}><FiCheck size={12} /></button>
                <button onClick={() => { setEditingPrice(false); setPriceInput(booking.totalPrice != null ? String(booking.totalPrice) : '') }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', display: 'flex', padding: 3 }}><FiX size={14} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: booking.totalPrice != null ? '#111827' : '#9CA3AF' }}>
                  {booking.totalPrice != null ? `${fin.roomTotal}` : 'غير محدد'}
                </span>
                {editablePrice && (
                  <button onClick={() => setEditingPrice(true)} title="تعديل السعر" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#3d5a3a', background: '#F0F7F0', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                    <FiEdit2 size={11} /> تعديل
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Room mini-stats */}
          <div style={{ display: 'flex', gap: 8, fontSize: 11.5, marginBottom: 10 }}>
            <span style={{ color: '#15803d' }}>مدفوع: <strong>{fin.roomPaid}</strong></span>
            <span style={{ color: fin.roomBalance > 0 ? '#b45309' : '#15803d' }}>المتبقّي: <strong>{Math.max(0, fin.roomBalance)}</strong></span>
          </div>

          {/* Room payments */}
          {roomPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {roomPayments.map(p => (
                <FolioLineRow key={p.id} tone="pay" badge={PAYMENT_METHOD_LABEL[p.method] || p.method}
                  text={p.note || 'دفعة غرفة'} at={fmtAt(p.at)} amount={p.amount}
                  busy={busy} onRemove={() => run(() => removeBookingPayment(booking.id, p.id))} />
              ))}
            </div>
          )}
          <AddPaymentForm balance={Math.max(0, fin.roomBalance)} busy={busy} label="دفعة غرفة"
            onAdd={(pmt, reset) => addPayment('room', pmt, reset)} />
        </div>

        {/* ── Extras ledger ── */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 9, padding: '12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <FiCoffee size={13} color="#b45309" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>الرسوم الإضافية (مطعم، كافيه…)</span>
          </div>

          {/* Charges list */}
          {charges.length === 0
            ? <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>لا توجد رسوم بعد.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {charges.map(c => (
                  <FolioLineRow key={c.id} tone="charge" badge={CHARGE_CATEGORY_LABEL[c.category] || c.category}
                    text={c.label} at={fmtAt(c.at)} amount={c.amount}
                    busy={busy} onRemove={() => run(() => removeBookingCharge(booking.id, c.id))} />
                ))}
              </div>
            )}
          {/* Add charge */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <input value={cLabel} onChange={e => setCLabel(e.target.value)} placeholder="الوصف (مثال: غداء)" style={{ ...fieldStyle, flex: 1, minWidth: 100, padding: '7px 10px', fontSize: 12 }} />
            <input type="number" min={0} value={cAmount} onChange={e => setCAmount(e.target.value)} placeholder="0" style={{ ...fieldStyle, width: 64, padding: '7px 10px', fontSize: 12 }} />
            <select value={cCat} onChange={e => setCCat(e.target.value)} style={{ ...fieldStyle, width: 96, padding: '7px 8px', fontSize: 12 }}>
              {CHARGE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button onClick={submitCharge} disabled={busy} style={{ ...folioAddBtn, background: '#b45309' }}><FiPlus size={13} /> رسم</button>
          </div>

          {/* Extras mini-stats */}
          <div style={{ display: 'flex', gap: 8, fontSize: 11.5, marginBottom: 10, paddingTop: 8, borderTop: '1px dashed #F3F4F6' }}>
            <span style={{ color: '#374151' }}>المجموع: <strong>{fin.chargesTotal}</strong></span>
            <span style={{ color: '#15803d' }}>مدفوع: <strong>{fin.extrasPaid}</strong></span>
            <span style={{ color: fin.extrasBalance > 0 ? '#b45309' : '#15803d' }}>المتبقّي: <strong>{Math.max(0, fin.extrasBalance)}</strong></span>
          </div>

          {/* Extras payments */}
          {extrasPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {extrasPayments.map(p => (
                <FolioLineRow key={p.id} tone="pay" badge={PAYMENT_METHOD_LABEL[p.method] || p.method}
                  text={p.note || 'دفعة رسوم'} at={fmtAt(p.at)} amount={p.amount}
                  busy={busy} onRemove={() => run(() => removeBookingPayment(booking.id, p.id))} />
              ))}
            </div>
          )}
          <AddPaymentForm balance={Math.max(0, fin.extrasBalance)} busy={busy} label="دفعة رسوم"
            onAdd={(pmt, reset) => addPayment('extras', pmt, reset)} />
        </div>
      </div>

      {error && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, color: '#b91c1c' }}>
          <FiAlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  )
}

/* One line in a folio ledger — a charge (tone="charge") or a payment (tone="pay"). */
function FolioLineRow({ tone, badge, text, at, amount, onRemove, busy }) {
  const pay = tone === 'pay'
  const bg  = pay ? '#F0FDF4' : '#FAFAFA'
  const badgeStyle = pay
    ? { color: '#15803d', background: '#fff', border: '1px solid #BBF7D0' }
    : { color: '#b45309', background: '#FFFBEB', border: '1px solid #FDE68A' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '6px 8px', background: bg, borderRadius: 7 }}>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px', flexShrink: 0, ...badgeStyle }}>{badge}</span>}
      <span style={{ flex: 1, color: '#374151', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text} <span style={{ color: '#C4C4C4', fontSize: 10 }}>{at}</span></span>
      <span style={{ fontWeight: 700, color: pay ? '#15803d' : '#111827', flexShrink: 0 }}>{pay ? '−' : ''}{amount}</span>
      {onRemove && <button onClick={onRemove} disabled={busy} title="حذف" style={{ padding: 3, borderRadius: 5, border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><FiX size={13} /></button>}
    </div>
  )
}

/* Amount + method + "pay the remaining" shortcut + submit. */
function AddPaymentForm({ balance, busy, onAdd, label = 'دفعة' }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const submit = () => {
    if (!(parseFloat(amount) > 0)) return
    onAdd({ amount: parseFloat(amount), method }, () => setAmount(''))
  }
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={{ ...fieldStyle, width: 64, padding: '7px 10px', fontSize: 12 }} />
      <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...fieldStyle, width: 100, padding: '7px 8px', fontSize: 12 }}>
        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      {balance > 0 && (
        <button onClick={() => setAmount(String(balance))} disabled={busy} title="دفع كامل المتبقّي" style={{ ...folioAddBtn, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>{balance}</button>
      )}
      <button onClick={submit} disabled={busy} style={{ ...folioAddBtn, background: '#15803d' }}><FiPlus size={13} /> {label}</button>
    </div>
  )
}

const folioAddBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 7,
  border: 'none', background: '#1C2B1C', color: '#fff', fontSize: 12, fontWeight: 700,
  fontFamily: 'Cairo, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap',
}

/* ─────────────────────────────────────────────────────────────
   Charge-to-Room tab — the restaurant / café flow.
   Staff pick an in-house guest and push a bill onto their room.
───────────────────────────────────────────────────────────── */
function ChargeToRoomTab({ bookings, loading }) {
  const [search, setSearch]   = useState('')
  const [openId, setOpenId]   = useState(null)

  if (loading) return <PageLoader />

  // In-house guests: an assigned room and an active (not left/cancelled) stay.
  const inHouse = bookings
    .filter(b => b.roomId && ['confirmed', 'checked-in', 'pending'].includes(b.status))
    .filter(b => {
      if (!search) return true
      const q = search.toLowerCase()
      return b.guestName?.toLowerCase().includes(q)
        || b.guestPhone?.includes(search)
        || String(b.roomNumber || '').includes(search)
    })
    .sort((a, b) => +(a.roomNumber || 0) - +(b.roomNumber || 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
        أضف فاتورة المطعم أو الكافيه على غرفة النزيل مباشرةً. اختر النزيل ثم أضف الرسم — يُحسب المتبقّي تلقائياً.
      </div>

      <div style={{ position: 'relative', maxWidth: 420 }}>
        <FiSearch size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الغرفة أو اسم النزيل..." style={{ ...fieldStyle, paddingRight: 36 }} />
      </div>

      {inHouse.length === 0 ? (
        <Empty icon={<FiCoffee size={28} />} text="لا يوجد نزلاء بغرف معيّنة حالياً." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inHouse.map(b => {
            const fin  = computeBookingFinance(b)
            const open = openId === b.id
            return (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <button onClick={() => setOpenId(open ? null : b.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>
                  <div style={{ width: 46, height: 40, borderRadius: 9, background: '#1C2B1C', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{b.roomNumber}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{b.guestName}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>غرفة {b.roomNumber} · {b.roomNameAr || ''}</p>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: fin.balance > 0 ? '#b45309' : '#15803d' }}>{fin.balance}</p>
                    <p style={{ fontSize: 10.5, color: '#9CA3AF' }}>المتبقّي</p>
                  </div>
                  <PaymentStatusPill status={fin.paymentStatus} />
                  <FiChevronDown size={16} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <FolioPanel booking={b} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Reservation calendar — a room × day "tape chart". Rooms are rows,
   days are columns; each booking is a bar spanning its nights, colored
   by status. Slide week by week, and export the view to PDF.
───────────────────────────────────────────────────────────── */
const CAL_DAYS = 7

function CalendarTab({ bookings, rooms, loading, onOpen }) {
  const [anchor, setAnchor] = useState(() => new Date(new Date().toISOString().split('T')[0]))
  const gridRef = useRef(null)

  if (loading) return <PageLoader />

  const toStr = d => d.toISOString().split('T')[0]
  const todayStr = toStr(new Date())
  const dayStr = v => {
    const dt = v?.toDate ? v.toDate() : (v ? new Date(v) : null)
    return dt && !isNaN(dt.getTime()) ? toStr(dt) : ''
  }

  const days = Array.from({ length: CAL_DAYS }, (_, i) => {
    const d = new Date(anchor); d.setDate(d.getDate() + i); return d
  })
  const dayStrs = days.map(toStr)

  const sortedRooms = rooms.slice().sort((a, b) => (+a.number || 0) - (+b.number || 0))
  const bookingsFor = (roomId) => bookings.filter(b => b.roomId === roomId && b.status !== 'cancelled')
  const covering = (list, ds) => list.find(b => {
    const ci = dayStr(b.checkIn), co = dayStr(b.checkOut)
    return ci && co && ds >= ci && ds < co
  })

  const shift = n => setAnchor(a => { const d = new Date(a); d.setDate(d.getDate() + n); return d })
  const rangeLabel = `${days[0].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' })} — ${days[CAL_DAYS - 1].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const exportPdf = () => {
    const html = gridRef.current?.outerHTML || ''
    const w = window.open('', '_blank')
    if (!w) { alert('يرجى السماح بالنوافذ المنبثقة لتصدير PDF'); return }
    const legend = Object.entries(STATUS)
      .filter(([k]) => k !== 'cancelled')
      .map(([, s]) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-left:14px;font-size:11px"><span style="width:11px;height:11px;border-radius:3px;background:${s.bg};border:1px solid ${s.color}"></span>${s.label}</span>`)
      .join('')
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقويم الحجوزات — ${rangeLabel}</title>
      <style>
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; font-family:'Cairo','Segoe UI',Arial,sans-serif; }
        body{ margin:22px; color:#111827; }
        h1{ font-size:17px; margin:0 0 3px; }
        p.sub{ color:#6B7280; font-size:12px; margin:0 0 10px; }
        .legend{ margin:0 0 14px; }
        table{ width:100%; border-collapse:collapse; table-layout:fixed; }
        th,td{ border:1px solid #E5E7EB; padding:5px 6px; font-size:11px; text-align:center; vertical-align:middle; }
        @page{ size:landscape; margin:12mm; }
      </style></head><body>
      <h1>منتجع العلبي — تقويم الحجوزات</h1>
      <p class="sub">${rangeLabel}</p>
      <div class="legend">${legend}</div>
      ${html}
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 350)
  }

  const renderRow = (list) => {
    const cells = []
    let i = 0
    while (i < CAL_DAYS) {
      const ds = dayStrs[i]
      const b = covering(list, ds)
      if (b) {
        let span = 1
        while (i + span < CAL_DAYS && covering(list, dayStrs[i + span])?.id === b.id) span++
        const s = STATUS[b.status] || STATUS.confirmed
        cells.push(
          <td key={ds} colSpan={span} onClick={() => onOpen(b.id)}
            style={{ border: '1px solid #E5E7EB', padding: 3, cursor: 'pointer', background: '#fff' }}>
            <div title={`${b.guestName} · ${s.label}`}
              style={{ background: s.bg, border: `1px solid ${s.border}`, borderRight: `3px solid ${s.color}`, borderRadius: 6, padding: '5px 8px', textAlign: 'right', overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.guestName}</span>
              <span style={{ fontSize: 10, color: s.color, opacity: 0.8 }}>{s.label}</span>
            </div>
          </td>
        )
        i += span
      } else {
        cells.push(<td key={ds} style={{ border: '1px solid #E5E7EB', background: ds === todayStr ? '#F0FDF4' : '#fff' }} />)
        i++
      }
    }
    return cells
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => shift(-CAL_DAYS)} title="الأسبوع السابق" style={calNavBtn}><FiChevronRight size={16} /></button>
          <button onClick={() => setAnchor(new Date(todayStr))} style={{ ...calNavBtn, width: 'auto', padding: '0 14px', fontSize: 12.5, fontWeight: 700 }}>اليوم</button>
          <button onClick={() => shift(CAL_DAYS)} title="الأسبوع التالي" style={calNavBtn}><FiChevronLeft size={16} /></button>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{rangeLabel}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginRight: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {Object.entries(STATUS).filter(([k]) => k !== 'cancelled').map(([k, s]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#6B7280' }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: s.bg, border: `1px solid ${s.color}` }} />{s.label}
              </span>
            ))}
          </div>
          <Btn onClick={exportPdf} variant="outline" icon={<FiPrinter size={14} />}>تصدير PDF</Btn>
        </div>
      </div>

      {sortedRooms.length === 0 ? (
        <Empty icon={<FiGrid size={28} />} text="لا توجد غرف لعرضها." />
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table ref={gridRef} style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 120 }} />
              {days.map((d, i) => <col key={i} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...calHeadCell, textAlign: 'right', position: 'sticky', right: 0, background: '#FAFAFA', zIndex: 2 }}>الغرفة</th>
                {days.map(d => {
                  const isToday = toStr(d) === todayStr
                  return (
                    <th key={toStr(d)} style={{ ...calHeadCell, background: isToday ? '#ECFDF3' : '#FAFAFA', color: isToday ? '#15803d' : '#6B7280' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600 }}>{d.toLocaleDateString('ar-SY', { weekday: 'short' })}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#15803d' : '#111827' }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>{d.toLocaleDateString('ar-SY', { month: 'short' })}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRooms.map(room => (
                <tr key={room.id}>
                  <td style={{ ...calRoomCell, position: 'sticky', right: 0, zIndex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>غرفة {room.number}</div>
                    <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{CATEGORY_LABEL_AR[room.type] || room.type} · {room.capacity}</div>
                  </td>
                  {renderRow(bookingsFor(room.id))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const calNavBtn = { width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }
const calHeadCell = { border: '1px solid #E5E7EB', padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }
const calRoomCell = { border: '1px solid #E5E7EB', padding: '8px 10px', textAlign: 'right', background: '#fff', whiteSpace: 'nowrap' }

/* ─────────────────────────────────────────────────────────────
   New Booking tab
───────────────────────────────────────────────────────────── */
function NewBookingTab({ rooms, variants = [], bookings, onDone }) {
  const variantOf = (room) => variants.find(v =>
    v.type === room.type && Number(v.capacity) === Number(room.capacity)
  )
  const labelFor = (room) => variantOf(room)?.nameAr || `${CATEGORY_LABEL_AR[room.type] || room.type} — ${room.capacity}p`
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [checkIn,  setCheckIn]  = useState(today)
  const [checkOut, setCheckOut] = useState(tomorrow)
  const [guests,   setGuests]   = useState(2)
  const [roomId,   setRoomId]   = useState('')
  const [roomQ,    setRoomQ]    = useState('')
  const [form,     setForm]     = useState({ guestName: '', guestPhone: '', guestEmail: '', notes: '', source: 'phone', status: 'confirmed', priceOverride: '', deposit: '' })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))

  const isAvailable = rid => {
    if (!checkIn || !checkOut) return true
    const f = new Date(checkIn), t = new Date(checkOut)
    const room = rooms.find(r => r.id === rid)
    if (room && isRoomBlockedInRange(room, f, t)) return false
    return !bookings.some(b => {
      if (b.roomId !== rid || ['cancelled', 'checked-out'].includes(b.status)) return false
      const bIn  = b.checkIn?.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
      const bOut = b.checkOut?.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
      return bIn < t && bOut > f
    })
  }

  const selectedRoom    = rooms.find(r => r.id === roomId)
  const selectedVariant = selectedRoom ? variantOf(selectedRoom) : null
  const autoPrice       = selectedVariant?.price ? selectedVariant.price * nights : null
  const totalPrice      = form.priceOverride !== '' ? (parseFloat(form.priceOverride) || null) : autoPrice

  const displayRooms = rooms.filter(r => {
    if (r.active === false) return false
    if (!roomQ) return true
    const q = roomQ.toLowerCase()
    const v = variantOf(r)
    return r.number?.includes(q)
      || r.type?.toLowerCase().includes(q)
      || (v?.nameAr || '').includes(roomQ)
      || (v?.nameEn || '').toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    if (!roomId)                { setError('يرجى اختيار غرفة'); return }
    if (!form.guestName.trim()) { setError('يرجى إدخال اسم الضيف'); return }
    if (!form.guestPhone.trim()){ setError('يرجى إدخال رقم الهاتف'); return }
    if (!isAvailable(roomId))   { setError('الغرفة المختارة محجوزة في هذه الفترة'); return }

    setSaving(true); setError('')
    try {
      const room = selectedRoom
      const v    = selectedVariant
      const bookingNumber = await getNextBookingNumber()
      const depositVal = parseFloat(form.deposit)
      const payments = depositVal > 0
        ? [{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), amount: depositVal, method: 'cash', note: 'دفعة مقدمة', ledger: 'room', at: Timestamp.now() }]
        : []
      await addDoc(collection(db, 'bookings'), {
        roomId: room.id, roomNumber: room.number,
        roomType: room.type, roomCapacity: room.capacity,
        roomNameEn: v?.nameEn || v?.nameAr || `${room.type} ${room.capacity}p`,
        roomNameAr: v?.nameAr || v?.nameEn || `${room.type} ${room.capacity}p`,
        checkIn, checkOut, nights, guests: parseInt(guests), totalPrice,
        guestName: form.guestName.trim(), guestPhone: form.guestPhone.trim(),
        guestEmail: form.guestEmail.trim(), notes: form.notes.trim(),
        source: form.source, status: form.status,
        bookingNumber, payments, charges: [],
        createdAt: Timestamp.now(), createdBy: 'admin',
      })
      setSuccess(`تم إنشاء الحجز — رقم: #${formatBookingNumber(bookingNumber)}`)
      setRoomId(''); setForm({ guestName: '', guestPhone: '', guestEmail: '', notes: '', source: 'phone', status: 'confirmed', priceOverride: '', deposit: '' })
      setCheckIn(today); setCheckOut(tomorrow); setGuests(2)
    } catch (e) { setError('فشل إنشاء الحجز: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>إنشاء حجز جديد</h2>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>لحجوزات الهاتف، الحضور الشخصي، أو أي طلب خارج الموقع</p>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCheckSquare size={16} color="#15803d" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{success}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDone} style={{ fontSize: 12, background: '#15803d', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: 'pointer' }}>عرض الحجوزات</button>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}><FiX size={16} /></button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step 1 */}
          <FormCard step={1} title="تفاصيل الإقامة">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div>
                <label style={smallLbl}>تاريخ الوصول</label>
                <input type="date" value={checkIn} onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(new Date(new Date(e.target.value).getTime() + 86400000).toISOString().split('T')[0]) }} style={fieldStyle} />
              </div>
              <div>
                <label style={smallLbl}>تاريخ المغادرة</label>
                <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={smallLbl}>عدد الأشخاص</label>
                <input type="number" value={guests} min={1} max={20} onChange={e => setGuests(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={smallLbl}>عدد الليالي</label>
                <div style={{ ...fieldStyle, background: '#F9FAFB', color: '#374151', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{nights} ليلة</div>
              </div>
            </div>
          </FormCard>

          {/* Step 2 */}
          <FormCard step={2} title="اختيار الغرفة">
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <FiSearch size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input value={roomQ} onChange={e => setRoomQ(e.target.value)} placeholder="بحث بالاسم، الرقم، أو النوع..."
                style={{ ...fieldStyle, paddingRight: 36 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, maxHeight: 280, overflowY: 'auto', paddingLeft: 2 }}>
              {displayRooms.map(room => {
                const avail    = isAvailable(room.id)
                const selected = roomId === room.id
                return (
                  <button key={room.id} onClick={() => avail && setRoomId(room.id)} disabled={!avail} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${selected ? '#3d5a3a' : avail ? '#E5E7EB' : '#F3F4F6'}`,
                    background: selected ? '#F0F7F0' : avail ? '#fff' : '#FAFAFA',
                    cursor: avail ? 'pointer' : 'not-allowed', opacity: avail ? 1 : 0.5,
                    textAlign: 'right', transition: 'all 0.15s', fontFamily: 'Cairo, sans-serif',
                  }}>
                    <div style={{ width: 48, height: 36, borderRadius: 7, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#6B7280' }}>
                      {room.number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: selected ? '#1a3a1a' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>غرفة {room.number}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{labelFor(room)}</p>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {selected && <FiCheck size={14} color="#3d5a3a" />}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: avail ? '#F0FDF4' : '#FEF2F2', color: avail ? '#15803d' : '#B91C1C' }}>
                        {avail ? 'متاحة' : 'محجوزة'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </FormCard>

          {/* Step 3 */}
          <FormCard step={3} title="معلومات الضيف">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={smallLbl}>اسم الضيف <Req /></label>
                <div style={{ position: 'relative' }}>
                  <FiUser size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input value={form.guestName} onChange={e => set('guestName', e.target.value)} placeholder="الاسم الكامل" style={{ ...fieldStyle, paddingRight: 32 }} />
                </div>
              </div>
              <div>
                <label style={smallLbl}>رقم الهاتف <Req /></label>
                <div style={{ position: 'relative' }}>
                  <FiPhone size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input value={form.guestPhone} onChange={e => set('guestPhone', e.target.value)} placeholder="+963..." type="tel" style={{ ...fieldStyle, paddingRight: 32 }} />
                </div>
              </div>
              <div>
                <label style={smallLbl}>البريد الإلكتروني</label>
                <div style={{ position: 'relative' }}>
                  <FiMail size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input value={form.guestEmail} onChange={e => set('guestEmail', e.target.value)} placeholder="اختياري" type="email" style={{ ...fieldStyle, paddingRight: 32 }} />
                </div>
              </div>
              <div>
                <label style={smallLbl}>مصدر الحجز</label>
                <select value={form.source} onChange={e => set('source', e.target.value)} style={fieldStyle}>
                  {Object.entries(SOURCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={smallLbl}>ملاحظات خاصة</label>
                <div style={{ position: 'relative' }}>
                  <FiMessageSquare size={13} style={{ position: 'absolute', right: 11, top: 11, color: '#9CA3AF', pointerEvents: 'none' }} />
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="طلبات خاصة أو ملاحظات..."
                    style={{ ...fieldStyle, paddingRight: 32, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
              </div>
            </div>
          </FormCard>
        </div>

        {/* Right: summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#1C2B1C', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ملخص الحجز</p>
            </div>

            {/* Room preview */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
              {selectedRoom ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 40, borderRadius: 8, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#6B7280' }}>
                    {selectedRoom.number}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{labelFor(selectedRoom)}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>غرفة {selectedRoom.number} · الطابق {selectedRoom.floor}</p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0', color: '#D1D5DB', fontSize: 12 }}>
                  <FiLayers size={20} style={{ margin: '0 auto 6px' }} />
                  <p>لم تُختر غرفة بعد</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
              {[
                ['الوصول', checkIn],
                ['المغادرة', checkOut],
                [`الليالي`, `${nights} ليلة`],
                ['الأشخاص', `${guests} شخص`],
                ...(form.guestName ? [['الضيف', form.guestName]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <label style={smallLbl}>السعر الإجمالي ($)</label>
              <input type="number" value={form.priceOverride} onChange={e => set('priceOverride', e.target.value)} min={0}
                placeholder={autoPrice != null ? String(autoPrice) : 'عند الطلب'}
                style={fieldStyle} />
              {autoPrice != null && form.priceOverride === '' && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                  {selectedVariant.price} × {nights} ليالٍ = <strong style={{ color: '#374151' }}>{autoPrice}</strong>
                </p>
              )}
              {totalPrice != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>الإجمالي</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#3d5a3a' }}>{totalPrice}</span>
                </div>
              )}
            </div>

            {/* Deposit paid now */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <label style={smallLbl}>دفعة مقدمة الآن ($) — اختياري</label>
              <input type="number" value={form.deposit} onChange={e => set('deposit', e.target.value)} min={0}
                placeholder="0" style={fieldStyle} />
              {parseFloat(form.deposit) > 0 && totalPrice != null && (
                <p style={{ fontSize: 11, color: '#b45309', marginTop: 5, fontWeight: 600 }}>
                  المتبقّي بعد الدفعة: {Math.max(0, totalPrice - parseFloat(form.deposit))}
                </p>
              )}
            </div>

            {/* Status */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <label style={smallLbl}>حالة الحجز</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={fieldStyle}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{ margin: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px' }}>
                <FiAlertCircle size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#b91c1c' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div style={{ padding: '14px 16px' }}>
              <button onClick={handleSubmit} disabled={saving || !roomId || !form.guestName || !form.guestPhone} style={{
                width: '100%', background: (!roomId || !form.guestName || !form.guestPhone || saving) ? '#E5E7EB' : '#1C2B1C',
                color: (!roomId || !form.guestName || !form.guestPhone || saving) ? '#9CA3AF' : '#fff',
                border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 14,
                fontFamily: 'Cairo, sans-serif', cursor: (!roomId || !form.guestName || !form.guestPhone || saving) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving ? <><FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</> : <><FiCheckSquare size={15} /> تأكيد الحجز</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Room Form Page — INVENTORY ONLY
   Rooms are physical units (number, type, capacity, active).
   All customer-facing copy lives on the variant, not the room.
───────────────────────────────────────────────────────────── */
function RoomFormPage({ room, variants = [], onBack }) {
  const isNew = !room

  const [form, setForm] = useState({
    number:   room?.number   ?? '',
    type:     room?.type     ?? '',
    capacity: room?.capacity ?? '',
    floor:    room?.floor    ?? '',
    active:   room?.active   !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const roomId = room?.id ?? (form.number ? `room-${form.number}` : '')

  // Only allow (type, capacity) pairs that correspond to a real variant.
  const variantOptions = variants
    .slice()
    .sort((a, b) => {
      const idxA = CATEGORIES.indexOf(a.type), idxB = CATEGORIES.indexOf(b.type)
      if (idxA !== idxB) return idxA - idxB
      return (a.capacity || 0) - (b.capacity || 0)
    })

  const handleVariantPick = (e) => {
    const v = variants.find(x => x.id === e.target.value)
    if (!v) return
    set('type', v.type)
    set('capacity', String(v.capacity))
  }

  const handleSave = async () => {
    if (!form.number || !form.type || !form.capacity) {
      setError('الحقول المطلوبة: رقم الغرفة، الفئة، السعة'); return
    }
    setSaving(true); setError('')
    try {
      const floor = form.floor !== '' ? parseInt(form.floor) : (parseInt(form.number[0]) || 1)
      await setDoc(doc(db, 'rooms', roomId), {
        number:   form.number.trim(),
        floor,
        type:     form.type.trim(),
        capacity: parseInt(form.capacity) || 1,
        active:   form.active,
        updatedAt: Timestamp.now(),
        ...(isNew ? { createdAt: Timestamp.now() } : {}),
      }, { merge: !isNew })
      onBack()
    } catch (e) { setError('فشل الحفظ: ' + e.message) }
    finally { setSaving(false) }
  }

  const focusStyle = e => (e.target.style.borderColor = '#3d5a3a')
  const blurStyle  = e => (e.target.style.borderColor = '#E5E7EB')
  const variantKey = form.type && form.capacity ? `${form.type}-${form.capacity}` : ''

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
          <FiChevronRight size={14} /> رجوع إلى الغرف
        </button>
        <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{isNew ? 'إضافة غرفة جديدة' : `تعديل غرفة ${room.number}`}</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            الغرف وحدات مخزون فقط — الاسم والصور تُدار في «الفئات».
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: saving ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving
            ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</>
            : <><FiCheck size={14} /> {isNew ? 'إضافة الغرفة' : 'حفظ التغييرات'}</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RFSection step="1" title="بيانات الغرفة">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <ModalField label="رقم الغرفة *">
              <input value={form.number} onChange={e => set('number', e.target.value)} placeholder="101" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
            <ModalField label="الفئة (نوع + سعة) *">
              <select value={variantKey} onChange={handleVariantPick} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">— اختر فئة —</option>
                {variantOptions.map(v => (
                  <option key={v.id} value={v.id}>
                    {CATEGORY_LABEL_AR[v.type] || v.type} — {v.capacity} أشخاص
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="الطابق">
              <input type="number" value={form.floor} onChange={e => set('floor', e.target.value)} placeholder="(يُحسب من الرقم)" min={1} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '9px 14px', borderRadius: 8, border: `1px solid ${form.active ? '#86efac' : '#E5E7EB'}`, background: form.active ? '#f0fdf4' : '#F9FAFB', fontFamily: 'Cairo, sans-serif' }}>
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#3d5a3a', width: 14, height: 14 }} />
              <span style={{ fontWeight: form.active ? 600 : 400, color: form.active ? '#3d5a3a' : '#6B7280' }}>غرفة نشطة (متاحة للحجز)</span>
            </label>
          </div>
        </RFSection>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px' }}>
            <FiAlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Variants Tab — list of customer-facing categories
───────────────────────────────────────────────────────────── */
function VariantsTab({ variants, rooms, loading, onEdit, onSeed, seeding }) {
  if (loading) return <PageLoader />

  const sorted = variants.slice().sort((a, b) => {
    const idxA = CATEGORIES.indexOf(a.type), idxB = CATEGORIES.indexOf(b.type)
    if (idxA !== idxB) return idxA - idxB
    return (a.capacity || 0) - (b.capacity || 0)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
        كل فئة (سوبر/بريميوم/ديلوكس × عدد الأشخاص) هي بطاقة منفصلة يراها العميل. الاسم والوصف والصور تُدار هنا — أرقام الغرف الفعلية تُدار في «الغرف».
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn onClick={onSeed} disabled={seeding} variant="outline" icon={<FiDatabase size={14} />}>
          {seeding ? 'جارٍ...' : 'إعادة التهيئة'}
        </Btn>
      </div>

      {sorted.length === 0 ? (
        <Empty icon={<FiStar size={28} />} text="لا توجد فئات بعد. اضغط «إعادة التهيئة» لإنشاء الفئات الافتراضية." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {sorted.map(v => {
            const units = rooms.filter(r => r.type === v.type && Number(r.capacity) === Number(v.capacity))
            const activeUnits = units.filter(r => r.active !== false).length
            return (
              <div key={v.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: v.active === false ? 0.65 : 1 }}>
                <div style={{ height: 152, background: '#F3F4F6', position: 'relative' }}>
                  {v.images?.[0]
                    ? <img src={v.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={28} color="#D1D5DB" /></div>}
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: v.active !== false ? '#f0fdf4' : '#F9FAFB', color: v.active !== false ? '#15803d' : '#6B7280', border: `1px solid ${v.active !== false ? '#bbf7d0' : '#E5E7EB'}` }}>
                      {v.active !== false ? 'ظاهرة' : 'مخفية'}
                    </span>
                    {v.featured && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}><FiStar size={9} />مميزة</span>}
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {CATEGORY_LABEL_AR[v.type] || v.type} · {v.capacity} أشخاص
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{v.nameAr || '(بدون اسم)'}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
                    {activeUnits} غرفة نشطة من أصل {units.length}
                  </p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12, minHeight: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.descAr || '—'}
                  </p>
                  <button onClick={() => onEdit(v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#1C2B1C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
                    <FiEdit2 size={13} /> تعديل الفئة
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Variant Form Page — full customer-facing editor
───────────────────────────────────────────────────────────── */
function VariantFormPage({ variant, onBack }) {
  const isNew = !variant
  const [form, setForm] = useState({
    type:        variant?.type        ?? '',
    capacity:    variant?.capacity    ?? '',
    nameAr:      variant?.nameAr      ?? '',
    nameEn:      variant?.nameEn      ?? '',
    descAr:      variant?.descAr      ?? '',
    descEn:      variant?.descEn      ?? '',
    bedsAr:      variant?.bedsAr      ?? '',
    beds:        variant?.beds        ?? '',
    price:       variant?.price       ?? '',
    amenitiesAr: variant?.amenitiesAr?.join('، ') ?? '',
    amenities:   variant?.amenities?.join(', ')  ?? '',
    featured:    variant?.featured    ?? false,
    active:      variant?.active      !== false,
  })
  const [images, setImages] = useState(variant?.images ?? [])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const variantId = variant?.id ?? (form.type && form.capacity ? `${form.type}-${form.capacity}` : '')

  const handleSave = async () => {
    if (!form.type || !form.capacity || !form.nameAr) {
      setError('الحقول المطلوبة: الفئة، السعة، الاسم بالعربي'); return
    }
    setSaving(true); setError('')
    try {
      await setDoc(doc(db, 'variants', variantId), {
        type:     form.type.trim(),
        capacity: parseInt(form.capacity) || 1,
        nameAr:   form.nameAr.trim(),
        nameEn:   form.nameEn.trim() || form.nameAr.trim(),
        descAr:   form.descAr.trim(),
        descEn:   form.descEn.trim(),
        bedsAr:   form.bedsAr.trim(),
        beds:     form.beds.trim() || form.bedsAr.trim(),
        price:    form.price !== '' ? parseFloat(form.price) : null,
        currency: 'USD',
        amenitiesAr: form.amenitiesAr.split(/[،,]/).map(s => s.trim()).filter(Boolean),
        amenities:   form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images,
        featured: form.featured,
        active:   form.active,
        updatedAt: Timestamp.now(),
        ...(isNew ? { createdAt: Timestamp.now() } : {}),
      }, { merge: !isNew })
      onBack()
    } catch (e) { setError('فشل الحفظ: ' + e.message) }
    finally { setSaving(false) }
  }

  const focusStyle = e => (e.target.style.borderColor = '#3d5a3a')
  const blurStyle  = e => (e.target.style.borderColor = '#E5E7EB')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
          <FiChevronRight size={14} /> رجوع إلى الفئات
        </button>
        <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{isNew ? 'إضافة فئة جديدة' : `تعديل: ${variant.nameAr || variant.id}`}</h2>
          {!isNew && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{CATEGORY_LABEL_AR[variant.type] || variant.type} · {variant.capacity} أشخاص</p>}
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 9, background: saving ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving
            ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</>
            : <><FiCheck size={14} /> {isNew ? 'إضافة الفئة' : 'حفظ التغييرات'}</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RFSection step="1" title="المعلومات الأساسية">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <ModalField label="الفئة *">
              <select value={form.type} onChange={e => set('type', e.target.value)} disabled={!isNew} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">— اختر —</option>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.labelAr}</option>)}
              </select>
            </ModalField>
            <ModalField label="عدد الأشخاص *">
              <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} disabled={!isNew} min={1} max={20} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
            <ModalField label="السعر الليلي $">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="فارغ = عند الطلب" min={0} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {[['featured', 'فئة مميزة'], ['active', 'فئة نشطة (ظاهرة للزوار)']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '9px 14px', borderRadius: 8, border: `1px solid ${form[k] ? '#86efac' : '#E5E7EB'}`, background: form[k] ? '#f0fdf4' : '#F9FAFB', fontFamily: 'Cairo, sans-serif' }}>
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ accentColor: '#3d5a3a', width: 14, height: 14 }} />
                <span style={{ fontWeight: form[k] ? 600 : 400, color: form[k] ? '#3d5a3a' : '#6B7280' }}>{l}</span>
              </label>
            ))}
          </div>
        </RFSection>

        <RFSection step="2" title="المحتوى بالعربي">
          <ModalField label="اسم الفئة *">
            <input value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="شقة سوبر — لـ 5 أشخاص" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </ModalField>
          <ModalField label="الوصف">
            <textarea value={form.descAr} onChange={e => set('descAr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} placeholder="وصف قصير يراه العميل في بطاقة الفئة." onFocus={focusStyle} onBlur={blurStyle} />
          </ModalField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ModalField label="تفاصيل الأسرة">
              <input value={form.bedsAr} onChange={e => set('bedsAr', e.target.value)} placeholder="سرير مزدوج + ٣ أسرة" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
            <ModalField label="المرافق (مفصولة بفاصلة عربية)">
              <input value={form.amenitiesAr} onChange={e => set('amenitiesAr', e.target.value)} placeholder="واي فاي، تكييف، تلفاز" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
          </div>
        </RFSection>

        <RFSection step="3" title="المحتوى بالإنجليزي" optional>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ModalField label="Name">
              <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="Superub Apartment — for 5" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
            <ModalField label="Bed Details">
              <input value={form.beds} onChange={e => set('beds', e.target.value)} placeholder="1 Double + 3 Singles" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </ModalField>
          </div>
          <ModalField label="Description">
            <textarea value={form.descEn} onChange={e => set('descEn', e.target.value)} rows={2} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} placeholder="Short customer-facing description." onFocus={focusStyle} onBlur={blurStyle} />
          </ModalField>
          <ModalField label="Amenities (comma separated)">
            <input value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="WiFi, AC, TV" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </ModalField>
        </RFSection>

        <ImageManager
          images={images}
          setImages={setImages}
          docId={variantId}
          onError={msg => setError(msg)}
        />

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px' }}>
            <FiAlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 16 }}>
          <button onClick={onBack}
            style={{ padding: '10px 22px', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 26px', borderRadius: 9, background: saving ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving
              ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</>
              : <><FiCheck size={14} /> {isNew ? 'إضافة الفئة' : 'حفظ التغييرات'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* Numbered section card for the room form */
function RFSection({ step, title, optional, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#1C2B1C', color: '#86efac', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {step}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1 }}>{title}</span>
        {optional && (
          <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '3px 10px', borderRadius: 100, fontWeight: 500, border: '1px solid #E5E7EB' }}>اختياري</span>
        )}
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Image Manager  — grid layout with hover-overlay actions
───────────────────────────────────────────────────────────── */
function ImageManager({ images, setImages, docId, roomNumber, onError, pathPrefix = 'variants', step = '4', title = 'صور الفئة' }) {
  // docId is preferred (variant slug). roomNumber kept for legacy callers.
  const uploadKey = docId || roomNumber
  const fileRef = useRef()
  const [uploading,  setUploading]  = useState(false)
  const [uploadProg, setUploadProg] = useState({ done: 0, total: 0 })
  const [preview,    setPreview]    = useState(null)

  const handleUpload = async e => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (!uploadKey) { onError('أكمل الحقول الأساسية أولاً (الفئة والسعة)'); return }
    setUploading(true)
    setUploadProg({ done: 0, total: files.length })
    onError('')
    try {
      const uploaded = await Promise.all(files.map(async file => {
        const compressed = await compressImage(file)
        const safeName   = compressed.name.replace(/[^\w.\-]+/g, '_')
        const sRef       = ref(storage, `${pathPrefix}/${uploadKey}/${Date.now()}_${safeName}`)
        await uploadBytes(sRef, compressed)
        const url = await getDownloadURL(sRef)
        setUploadProg(p => ({ ...p, done: p.done + 1 }))
        return url
      }))
      setImages(p => [...p, ...uploaded])
    } catch (err) { onError('فشل رفع الصورة: ' + err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const makeCover = idx => setImages(p => { const a = [...p]; const [img] = a.splice(idx, 1); return [img, ...a] })
  const remove    = idx => setImages(p => p.filter((_, i) => i !== idx))
  const moveUp    = idx => setImages(p => {
    if (idx <= 0) return p
    const a = [...p]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a
  })
  const moveDown  = idx => setImages(p => {
    if (idx >= p.length - 1) return p
    const a = [...p]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a
  })

  /* drag-and-drop reorder */
  const dragFrom = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const onDragStart = idx => { dragFrom.current = idx }
  const onDragOver  = (e, idx) => { e.preventDefault(); setDragOver(idx) }
  const onDrop      = (e, idx) => {
    e.preventDefault()
    const from = dragFrom.current
    if (from !== null && from !== idx) {
      setImages(p => {
        const a = [...p]
        const [moved] = a.splice(from, 1)
        a.splice(idx, 0, moved)
        return a
      })
    }
    dragFrom.current = null; setDragOver(null)
  }
  const onDragEnd = () => { dragFrom.current = null; setDragOver(null) }

  const pct = uploadProg.total ? Math.round(uploadProg.done / uploadProg.total * 100) : 0

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: '#1C2B1C', color: '#86efac', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
            {images.length > 0 && (
              <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 10 }}>
                {images.length} {images.length === 1 ? 'صورة' : 'صور'} · رتّب باستخدام الأسهم ↑↓ أو السحب · ⭐ لتغيير الغلاف
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: uploading ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', flexShrink: 0 }}>
            <FiUpload size={13} />
            {uploading ? `${uploadProg.done}/${uploadProg.total} جارٍ الرفع` : 'رفع صور'}
          </button>
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div style={{ padding: '10px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 5, background: '#dcfce7', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#16a34a', borderRadius: 100, width: pct + '%', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: 12, color: '#166534', fontWeight: 700, whiteSpace: 'nowrap' }}>{pct}%</span>
            <span style={{ fontSize: 12, color: '#166534', whiteSpace: 'nowrap' }}>({uploadProg.done}/{uploadProg.total})</span>
          </div>
        )}

        {/* Image area */}
        <div style={{ padding: '20px' }}>
          {images.length === 0 ? (

            /* Empty / drop zone */
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed #D1D5DB', borderRadius: 14, padding: '56px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#FAFAFA' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3d5a3a'; e.currentTarget.style.background = '#f0fdf4' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFA' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FiImage size={26} color="#9CA3AF" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>لم تُضف صور بعد</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>JPG · PNG · WEBP · يمكن اختيار أكثر من صورة دفعة واحدة</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, background: '#1C2B1C', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>
                <FiUpload size={13} /> اختر صوراً
              </div>
            </div>

          ) : (

            /* Image grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {images.map((url, i) => (
                <ImageCard
                  key={url + i}
                  url={url}
                  index={i}
                  total={images.length}
                  isCover={i === 0}
                  isDragOver={dragOver === i}
                  onMakeCover={() => makeCover(i)}
                  onRemove={() => remove(i)}
                  onPreview={() => setPreview(url)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={e => onDrop(e, i)}
                  onDragEnd={onDragEnd}
                />
              ))}

              {/* Add more card */}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, border: '2px dashed #D1D5DB', background: '#FAFAFA', color: '#9CA3AF', fontSize: 12, fontFamily: 'Cairo, sans-serif', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#3d5a3a'; e.currentTarget.style.color = '#3d5a3a'; e.currentTarget.style.background = '#f0fdf4' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = '#FAFAFA' }}>
                <FiPlus size={22} />
                <span>إضافة صور</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={preview} alt=""
            style={{ maxWidth: '88vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <FiX size={20} />
          </button>
        </div>
      )}
    </>
  )
}

/* Single image card — drag-and-drop + always-visible reorder controls */
function ImageCard({ url, index, total, isCover, isDragOver, onMakeCover, onRemove, onPreview, onMoveUp, onMoveDown, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const [hov, setHov] = useState(false)
  const isFirst = index === 0
  const isLast  = index === total - 1

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden',
        border: isDragOver ? '2px dashed #3d5a3a' : `2px solid ${isCover ? '#86efac' : '#E5E7EB'}`,
        background: isDragOver ? '#f0fdf4' : '#F3F4F6',
        cursor: 'grab', transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hov && !isDragOver ? '0 6px 16px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>

      <img src={url} alt="" loading={index < 3 ? 'eager' : 'lazy'} decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />

      {/* Top-left: position number, or cover badge if first */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        background: isCover ? '#1C2B1C' : 'rgba(0,0,0,0.6)',
        color: isCover ? '#86efac' : '#fff',
        fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6,
        pointerEvents: 'none', fontFamily: 'Cairo, sans-serif',
        backdropFilter: 'blur(3px)',
      }}>
        {isCover
          ? <><FiStar size={10} /> غلاف</>
          : <>#{index + 1}</>}
      </div>

      {/* Top-right: drag handle hint */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(0,0,0,0.5)', borderRadius: 6,
        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', backdropFilter: 'blur(3px)',
      }}>
        <FiMenu size={12} color="#fff" />
      </div>

      {/* Bottom action bar — ALWAYS visible, no hover required */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        padding: '8px 8px 7px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.78) 35%, rgba(0,0,0,0))',
      }}>
        {/* Reorder arrows */}
        <div style={{ display: 'flex', gap: 4 }}>
          <ImgBtn onClick={onMoveUp}   disabled={isFirst} title="نقل إلى الأمام"><FiChevronUp   size={14} /></ImgBtn>
          <ImgBtn onClick={onMoveDown} disabled={isLast}  title="نقل إلى الخلف"><FiChevronDown size={14} /></ImgBtn>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {!isCover && <ImgBtn onClick={onMakeCover} accent title="جعلها صورة الغلاف"><FiStar  size={14} /></ImgBtn>}
          <ImgBtn onClick={onPreview} title="معاينة"><FiEye    size={14} /></ImgBtn>
          <ImgBtn onClick={onRemove}  danger title="حذف"><FiTrash2 size={14} /></ImgBtn>
        </div>
      </div>
    </div>
  )
}

/* Icon button used inside the image card action bar */
function ImgBtn({ children, onClick, disabled, danger, accent, title }) {
  const bg = disabled ? 'rgba(255,255,255,0.12)'
           : danger   ? 'rgba(239, 68, 68, 0.95)'
           : accent   ? 'rgba(245, 158, 11, 0.95)'
           :            'rgba(255,255,255,0.95)'
  const fg = disabled              ? 'rgba(255,255,255,0.4)'
           : (danger || accent)    ? '#fff'
           :                         '#1C2B1C'
  return (
    <button
      onClick={e => { e.stopPropagation(); if (!disabled) onClick() }}
      disabled={disabled}
      title={title}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: bg, color: fg,
        backdropFilter: 'blur(4px)', transition: 'transform 0.12s, background 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'scale(1.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────
   Shared style objects
───────────────────────────────────────────────────────────── */
const fieldStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 13, fontFamily: 'Cairo, sans-serif', color: '#111827', background: '#fff',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
}

const filterInp = {
  ...fieldStyle, background: '#F9FAFB',
}

const smallLbl = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280',
  marginBottom: 6, letterSpacing: '0.02em',
}

/* ─────────────────────────────────────────────────────────────
   Shared components
───────────────────────────────────────────────────────────── */
function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.confirmed
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function PaymentStatusPill({ status }) {
  const s = PAYMENT_STATUS[status] || PAYMENT_STATUS.unpaid
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      <FiCreditCard size={10} style={{ flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', icon }) {
  const isPrimary = variant === 'primary'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
      background: isPrimary ? '#1C2B1C' : '#F9FAFB',
      color:      isPrimary ? '#fff'     : '#374151',
      border:     isPrimary ? 'none'     : '1px solid #E5E7EB',
    }}>{icon}{children}</button>
  )
}

function FormCard({ step, title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1C2B1C', color: '#86efac', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 16px' }}>{children}</div>
    </div>
  )
}

function ModalGroup({ title, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F3F4F6' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function ModalField({ label, children }) {
  return (
    <div>
      <label style={smallLbl}>{label}</label>
      {children}
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <span style={{ color: '#9CA3AF', marginTop: 1 }}>{icon}</span>
      <span style={{ color: '#9CA3AF', marginLeft: 2 }}>{label}:</span>
      <span style={{ color: '#374151', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Empty({ icon, text }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '60px 20px', textAlign: 'center', color: '#D1D5DB' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 13, color: '#9CA3AF' }}>{text}</p>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid #E5E7EB', borderTopColor: '#3d5a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function FullLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6F4' }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #E5E7EB', borderTopColor: '#3d5a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Req() {
  return <span style={{ color: '#EF4444', marginRight: 2 }}>*</span>
}

/* ─────────────────────────────────────────────────────────────
   Hike event tab — content editor + applications
───────────────────────────────────────────────────────────── */
function HikeTab({ content, applications }) {
  const [view, setView] = useState('content')
  if (!content) return <PageLoader />
  const pending = applications.filter(a => a.status === 'pending').length

  const TabBtn = ({ id, label, badge }) => {
    const active = view === id
    return (
      <button onClick={() => setView(id)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9,
        border: `1px solid ${active ? '#1C2B1C' : '#E5E7EB'}`, cursor: 'pointer',
        background: active ? '#1C2B1C' : '#fff', color: active ? '#fff' : '#374151',
        fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700,
      }}>
        {label}
        {badge > 0 && (
          <span style={{ background: active ? 'rgba(255,255,255,0.2)' : '#fbbf24', color: active ? '#fff' : '#78350f', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100 }}>{badge}</span>
        )}
      </button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <TabBtn id="content" label="محتوى الصفحة" />
        <TabBtn id="applications" label="طلبات الانضمام" badge={pending} />
      </div>
      {view === 'content'
        ? <HikeContentEditor content={content} />
        : <HikeApplications applications={applications} content={content} />}
    </div>
  )
}

/* Content editor for the public hike page (siteContent/hike) */
function HikeContentEditor({ content }) {
  const TEXT_FIELDS = [
    'titleAr','titleEn','taglineAr','taglineEn','introAr','introEn',
    'routeAr','routeEn','morningAr','morningEn','eveningAr','eveningEn',
    'priceNoteAr','priceNoteEn',
  ]
  const [form, setForm] = useState(() => {
    const init = {}
    TEXT_FIELDS.forEach(k => { init[k] = content[k] ?? '' })
    init.priceExternal = content.priceExternal ?? ''
    init.residentsFree = content.residentsFree !== false
    init.active        = content.active !== false
    return init
  })
  const [images,    setImages]    = useState(content.images ?? [])
  const [logoUrl,   setLogoUrl]   = useState(content.logoUrl ?? '')
  const [highlights, setHighlights] = useState(content.highlights ?? [])
  const [upcoming,  setUpcoming]  = useState(content.upcoming ?? [])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [logoBusy,  setLogoBusy]  = useState(false)
  const logoRef = useRef()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const focusStyle = e => (e.target.style.borderColor = '#3d5a3a')
  const blurStyle  = e => (e.target.style.borderColor = '#E5E7EB')

  const handleLogo = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setLogoBusy(true); setError('')
    try {
      const compressed = await compressImage(file)
      const safeName   = compressed.name.replace(/[^\w.\-]+/g, '_')
      const sRef       = ref(storage, `hike/logo/${Date.now()}_${safeName}`)
      await uploadBytes(sRef, compressed)
      setLogoUrl(await getDownloadURL(sRef))
    } catch (err) { setError('فشل رفع الشعار: ' + err.message) }
    finally { setLogoBusy(false); e.target.value = '' }
  }

  const addHighlight = () => setHighlights(p => [...p, { ar: '', en: '' }])
  const setHighlight = (i, k, v) => setHighlights(p => p.map((h, idx) => idx === i ? { ...h, [k]: v } : h))
  const delHighlight = i => setHighlights(p => p.filter((_, idx) => idx !== i))

  const addDate = () => setUpcoming(p => [...p, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: '', timeAr: '', timeEn: '' }])
  const setDate = (i, k, v) => setUpcoming(p => p.map((d, idx) => idx === i ? { ...d, [k]: v } : d))
  const delDate = i => setUpcoming(p => p.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!form.titleAr.trim()) { setError('العنوان بالعربي مطلوب'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { ...form }
      payload.priceExternal = form.priceExternal === '' ? null : parseFloat(form.priceExternal)
      payload.priceCurrency = 'USD'
      payload.logoUrl   = logoUrl
      payload.images    = images
      payload.highlights = highlights.filter(h => (h.ar || '').trim() || (h.en || '').trim())
      payload.upcoming  = upcoming
        .filter(d => d.date)
        .sort((a, b) => a.date.localeCompare(b.date))
      await saveHikeContent(payload)
      setSuccess('تم حفظ التغييرات بنجاح')
      setTimeout(() => setSuccess(''), 3500)
    } catch (e) { setError('فشل الحفظ: ' + e.message) }
    finally { setSaving(false) }
  }

  const SaveBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <a href="/hike" target="_blank" rel="noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3d5a3a', fontWeight: 600, textDecoration: 'none' }}>
        <FiExternalLink size={13} /> معاينة الصفحة
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {success && <span style={{ fontSize: 12, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 600 }}>{success}</span>}
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 26px', borderRadius: 9, background: saving ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ...</> : <><FiSave size={14} /> حفظ التغييرات</>}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SaveBar />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px' }}>
          <FiAlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
        </div>
      )}

      {/* Visibility + logo */}
      <RFSection step="1" title="الإعدادات العامة والشعار">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form.active ? '#86efac' : '#E5E7EB'}`, background: form.active ? '#f0fdf4' : '#F9FAFB', fontFamily: 'Cairo, sans-serif', width: 'fit-content' }}>
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#3d5a3a', width: 14, height: 14 }} />
          <span style={{ fontWeight: form.active ? 600 : 400, color: form.active ? '#3d5a3a' : '#6B7280' }}>الفعالية نشطة (ظاهرة للزوار)</span>
        </label>

        <ModalField label="شعار الفعالية">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 84, height: 84, borderRadius: 14, border: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiImage size={24} color="#9CA3AF" />}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
              <button onClick={() => logoRef.current?.click()} disabled={logoBusy}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: logoBusy ? '#9CA3AF' : '#1C2B1C', color: '#fff', border: 'none', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: logoBusy ? 'not-allowed' : 'pointer' }}>
                <FiUpload size={13} /> {logoBusy ? 'جارٍ الرفع...' : 'رفع شعار'}
              </button>
              {logoUrl && (
                <button onClick={() => setLogoUrl('')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#fff', color: '#DC2626', border: '1px solid #FECACA', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
                  <FiX size={13} /> إزالة
                </button>
              )}
            </div>
          </div>
        </ModalField>
      </RFSection>

      {/* Arabic content */}
      <RFSection step="2" title="المحتوى بالعربي">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ModalField label="العنوان *"><input value={form.titleAr} onChange={e => set('titleAr', e.target.value)} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
          <ModalField label="العبارة التعريفية"><input value={form.taglineAr} onChange={e => set('taglineAr', e.target.value)} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        </div>
        <ModalField label="الفكرة / المقدمة"><textarea value={form.introAr} onChange={e => set('introAr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        <ModalField label="خط السير"><textarea value={form.routeAr} onChange={e => set('routeAr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ModalField label="الرحلة الصباحية"><textarea value={form.morningAr} onChange={e => set('morningAr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
          <ModalField label="الرحلة المسائية"><textarea value={form.eveningAr} onChange={e => set('eveningAr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        </div>
      </RFSection>

      {/* English content */}
      <RFSection step="3" title="المحتوى بالإنجليزي" optional>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ModalField label="Title"><input value={form.titleEn} onChange={e => set('titleEn', e.target.value)} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
          <ModalField label="Tagline"><input value={form.taglineEn} onChange={e => set('taglineEn', e.target.value)} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        </div>
        <ModalField label="Intro"><textarea value={form.introEn} onChange={e => set('introEn', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        <ModalField label="Route"><textarea value={form.routeEn} onChange={e => set('routeEn', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ModalField label="Morning trip"><textarea value={form.morningEn} onChange={e => set('morningEn', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
          <ModalField label="Evening trip"><textarea value={form.eveningEn} onChange={e => set('eveningEn', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        </div>
      </RFSection>

      {/* Highlights */}
      <RFSection step="4" title="أبرز المعالم (تظهر كوسوم على الصفحة)" optional>
        {highlights.length === 0 && <p style={{ fontSize: 13, color: '#9CA3AF' }}>لا توجد معالم بعد.</p>}
        {highlights.map((h, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
            <input value={h.ar} onChange={e => setHighlight(i, 'ar', e.target.value)} placeholder="بالعربي (مثال: جبل الأقرع)" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <input value={h.en} onChange={e => setHighlight(i, 'en', e.target.value)} placeholder="English (e.g. Mount Aqra)" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <button onClick={() => delHighlight(i)} style={iconDangerBtn}><FiTrash2 size={14} /></button>
          </div>
        ))}
        <button onClick={addHighlight} style={addRowBtn}><FiPlus size={14} /> إضافة معلم</button>
      </RFSection>

      {/* Pricing */}
      <RFSection step="5" title="الأسعار والمشاركة">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form.residentsFree ? '#86efac' : '#E5E7EB'}`, background: form.residentsFree ? '#f0fdf4' : '#F9FAFB', fontFamily: 'Cairo, sans-serif', width: 'fit-content' }}>
          <input type="checkbox" checked={form.residentsFree} onChange={e => set('residentsFree', e.target.checked)} style={{ accentColor: '#3d5a3a', width: 14, height: 14 }} />
          <span style={{ fontWeight: form.residentsFree ? 600 : 400, color: form.residentsFree ? '#3d5a3a' : '#6B7280' }}>دخول النزلاء مجاني وتلقائي</span>
        </label>
        <ModalField label="رسوم المشاركة لغير النزلاء ($ للشخص)">
          <input type="number" min={0} value={form.priceExternal} onChange={e => set('priceExternal', e.target.value)} placeholder="فارغ = حسب الطلب / لا يُعرض" style={{ ...fieldStyle, maxWidth: 260 }} onFocus={focusStyle} onBlur={blurStyle} />
        </ModalField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ModalField label="ملاحظة الأسعار (عربي)"><textarea value={form.priceNoteAr} onChange={e => set('priceNoteAr', e.target.value)} rows={2} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
          <ModalField label="Pricing note (English)"><textarea value={form.priceNoteEn} onChange={e => set('priceNoteEn', e.target.value)} rows={2} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} onFocus={focusStyle} onBlur={blurStyle} /></ModalField>
        </div>
      </RFSection>

      {/* Upcoming dates */}
      <RFSection step="6" title="مواعيد الرحلات القادمة">
        <p style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: -4 }}>المواعيد التي مرّ تاريخها لا تظهر للزوار تلقائياً. أقرب موعد قادم يظهر في أعلى الصفحة.</p>
        {upcoming.length === 0 && <p style={{ fontSize: 13, color: '#9CA3AF' }}>لا توجد مواعيد مجدولة بعد.</p>}
        {upcoming.map((d, i) => (
          <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
            <input type="date" value={d.date} onChange={e => setDate(i, 'date', e.target.value)} style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <input value={d.timeAr} onChange={e => setDate(i, 'timeAr', e.target.value)} placeholder="الوقت/تفاصيل (عربي) — مثال: 8 صباحاً" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <input value={d.timeEn} onChange={e => setDate(i, 'timeEn', e.target.value)} placeholder="Time/details (English) — e.g. 8 AM" style={fieldStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <button onClick={() => delDate(i)} style={iconDangerBtn}><FiTrash2 size={14} /></button>
          </div>
        ))}
        <button onClick={addDate} style={addRowBtn}><FiPlus size={14} /> إضافة موعد</button>
      </RFSection>

      <ImageManager images={images} setImages={setImages} docId="gallery" pathPrefix="hike" step="7" title="صور الفعالية" onError={msg => setError(msg)} />

      <div style={{ paddingBottom: 16 }}><SaveBar /></div>
    </div>
  )
}

/* Applications list for the hike event */
function HikeApplications({ applications, content }) {
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  const setStatus = async (id, status) => {
    try { await updateDoc(doc(db, 'hikeApplications', id), { status }) }
    catch (e) { alert('تعذّر تحديث الحالة: ' + e.message) }
  }
  const handleDelete = async (a) => {
    if (!confirm(`حذف طلب ${a.name}؟`)) return
    setDeleting(a.id)
    try { await deleteDoc(doc(db, 'hikeApplications', a.id)) }
    catch (e) { alert('تعذّر الحذف: ' + e.message) }
    finally { setDeleting(null) }
  }

  const FILTERS = [
    { k: 'all', label: 'الكل' },
    { k: 'pending', label: 'معلق' },
    { k: 'confirmed', label: 'مؤكد' },
    { k: 'cancelled', label: 'ملغى' },
  ]
  const list = applications.filter(a => filter === 'all' || a.status === filter)

  const fmt = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const fmtCreated = (ts) => {
    if (!ts?.seconds) return ''
    return new Date(ts.seconds * 1000).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map(({ k, label }) => {
          const active = filter === k
          const count = k === 'all' ? applications.length : applications.filter(a => a.status === k).length
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '7px 16px', borderRadius: 100, border: `1px solid ${active ? '#1C2B1C' : '#E5E7EB'}`,
              background: active ? '#1C2B1C' : '#fff', color: active ? '#fff' : '#374151',
              fontSize: 12.5, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              {label} ({count})
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <Empty icon={<FiCompass size={26} />} text="لا توجد طلبات في هذه الحالة." />
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {list.map(a => {
            const st = STATUS[a.status] || STATUS.pending
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      #{a.id.slice(0, 6).toUpperCase()} · {fmtCreated(a.createdAt)}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>{st.label}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#374151', marginBottom: 14 }}>
                  <InfoItem icon={<FiPhone size={12} />} label="الهاتف" value={a.phone} />
                  {a.email && <InfoItem icon={<FiMail size={12} />} label="البريد" value={a.email} />}
                  <InfoItem icon={<FiUsers size={12} />} label="عدد الأشخاص" value={a.partySize} />
                  <InfoItem icon={<FiCalendar size={12} />} label="الموعد" value={fmt(a.eventDate)} />
                  <InfoItem icon={a.isResident ? <FiCheck size={12} /> : <FiUser size={12} />} label="الحالة" value={a.isResident ? 'نزيل في المنتجع' : 'من خارج الفندق'} />
                  {a.notes && <InfoItem icon={<FiMessageSquare size={12} />} label="ملاحظات" value={a.notes} />}
                </div>

                {/* Status control */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <select value={a.status} onChange={e => setStatus(a.id, e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12.5, fontFamily: 'Cairo, sans-serif', color: '#374151', background: '#fff', cursor: 'pointer' }}>
                    <option value="pending">معلق</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="cancelled">ملغى</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={buildHikeCustomerWhatsAppUrl(a, content, 'ar')} target="_blank" rel="noreferrer"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#15803d', color: '#fff', borderRadius: 8, padding: '8px 0', fontSize: 12, fontFamily: 'Cairo, sans-serif', fontWeight: 600, textDecoration: 'none' }}>
                    <FiMessageCircle size={13} /> تواصل مع المتقدّم
                  </a>
                  <button onClick={() => handleDelete(a)} disabled={deleting === a.id}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const iconDangerBtn = { padding: '9px 11px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }
const addRowBtn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px dashed #86efac', background: '#f0fdf4', color: '#3d5a3a', fontSize: 13, fontFamily: 'Cairo, sans-serif', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }
