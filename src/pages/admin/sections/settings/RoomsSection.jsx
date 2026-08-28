import { useState } from 'react'
import {
  FiSearch, FiPlus, FiDatabase, FiEdit2, FiEye, FiEyeOff, FiTrash2, FiLayers,
} from 'react-icons/fi'
import { db, doc, deleteDoc, updateDoc, Timestamp, seedRooms } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import { occupiedRoomIdSet, bookingOccupiesRoom } from '../../utils/bookingHelpers'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

// The physical room inventory: number, floor, capacity, category, active
// flag. Customer-facing content (name/images/description) lives on the
// category instead (RoomCategoriesSection). The "إعادة التهيئة" reseed
// button lives here (not duplicated on the categories screen) since one
// press repopulates both the 5 categories and the 14 rooms — and, because it
// can overwrite existing data, it now goes through ConfirmDialog instead of
// the old window.confirm().
export default function RoomsSection({ rooms, bookings, onAdd, onEdit }) {
  const [search, setSearch] = useState('')
  const [floorF, setFloor] = useState('all')
  const [typeF, setType] = useState('all')
  const [activeF, setActive] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [seedOpen, setSeedOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')

  const floors = ['all', ...new Set(rooms.map(r => r.floor).filter(Boolean).sort())]
  const types = ['all', ...new Set(rooms.map(r => r.type).filter(Boolean).sort())]
  const activeBookings = bookings.filter(b => ['confirmed', 'pending', 'checked-in'].includes(b.status))
  const occupiedIds = occupiedRoomIdSet(activeBookings)

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    return (!search || r.number?.includes(q) || r.type?.toLowerCase().includes(q))
      && (floorF === 'all' || String(r.floor) === String(floorF))
      && (typeF === 'all' || r.type === typeF)
      && (activeF === 'all' || (activeF === 'active' ? r.active !== false : r.active === false))
  })

  const toggleActive = r => updateDoc(doc(db, 'rooms', r.id), { active: !r.active, updatedAt: Timestamp.now() })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setError('')
    try {
      await deleteDoc(doc(db, 'rooms', deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { setError('فشل الحذف: ' + e.message) }
    finally { setDeleting(false) }
  }

  const handleSeed = async () => {
    setSeeding(true); setError('')
    try {
      await seedRooms()
      setSeedOpen(false)
    } catch (e) { setError('فشل إعادة التهيئة: ' + e.message) }
    finally { setSeeding(false) }
  }

  const chips = [
    { label: 'إجمالي', v: rooms.length, tone: 'muted' },
    { label: 'نشطة', v: rooms.filter(r => r.active !== false).length, tone: 'good' },
    { label: 'مخفية', v: rooms.filter(r => r.active === false).length, tone: 'bad' },
    { label: 'محجوزة', v: occupiedIds.size, tone: 'warn' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chips.map(c => (
          <span key={c.label} className={`adm-badge adm-badge--${c.tone}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {c.v} {c.label}
          </span>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--adm-danger-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '12px 16px' }}>
          <span className="adm-field-error">{error}</span>
        </div>
      )}

      <div className="adm-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="adm-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث برقم الغرفة أو النوع..."
            style={{ paddingInlineStart: 34 }}
          />
        </div>
        <select className="adm-input" style={{ width: 'auto' }} value={floorF} onChange={e => setFloor(e.target.value)}>
          <option value="all">كل الطوابق</option>
          {floors.filter(f => f !== 'all').map(f => <option key={f} value={f}>الطابق {f}</option>)}
        </select>
        <select className="adm-input" style={{ width: 'auto' }} value={typeF} onChange={e => setType(e.target.value)}>
          <option value="all">كل الفئات</option>
          {types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{CATEGORY_LABEL_AR[t] || t}</option>)}
        </select>
        <select className="adm-input" style={{ width: 'auto' }} value={activeF} onChange={e => setActive(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="active">نشطة فقط</option>
          <option value="inactive">مخفية فقط</option>
        </select>
        <div style={{ display: 'flex', gap: 8, marginInlineStart: 'auto' }}>
          <Button variant="outline" icon={<FiDatabase size={14} />} onClick={() => setSeedOpen(true)}>إعادة التهيئة</Button>
          <Button icon={<FiPlus size={14} />} onClick={onAdd}>إضافة غرفة</Button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} غرفة</p>

      {filtered.length === 0 ? (
        <EmptyState icon={<FiLayers size={28} />} text="لا توجد غرف. اضغط «إعادة التهيئة» للبدء بالإعدادات الافتراضية." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {filtered.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={onEdit}
              onDelete={() => setDeleteTarget(room)}
              onToggle={toggleActive}
              isOccupied={occupiedIds.has(room.id)}
              booking={activeBookings.find(b => bookingOccupiesRoom(b, room.id))}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الغرفة"
        message={deleteTarget ? `سيتم حذف غرفة ${deleteTarget.number} نهائياً — هل أنت متأكد؟` : ''}
        confirmLabel="حذف الغرفة"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={seedOpen}
        title="إعادة تهيئة الغرف والفئات"
        message="سيتم إنشاء 5 فئات و14 غرفة بالإعدادات الافتراضية، وقد يستبدل هذا بيانات موجودة بنفس الأرقام — هل تريد المتابعة؟"
        confirmLabel={seeding ? 'جارٍ...' : 'إعادة التهيئة'}
        busy={seeding}
        onConfirm={handleSeed}
        onCancel={() => setSeedOpen(false)}
      />
    </div>
  )
}

function RoomCard({ room, onEdit, onDelete, onToggle, isOccupied, booking }) {
  const variantLabel = CATEGORY_LABEL_AR[room.type] || room.type || '—'
  return (
    <div className="adm-card" style={{ opacity: room.active === false ? 0.65 : 1 }}>
      <div className="adm-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>غرفة {room.number}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>الطابق {room.floor} · سعة {room.capacity}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span className={`adm-badge ${room.active !== false ? 'adm-badge--good' : 'adm-badge--muted'}`}>
              {room.active !== false ? <FiEye size={10} /> : <FiEyeOff size={10} />}
              {room.active !== false ? 'نشطة' : 'مخفية'}
            </span>
            {isOccupied && <span className="adm-badge adm-badge--warn">محجوزة</span>}
          </div>
        </div>

        <span className="adm-badge adm-badge--muted" style={{ marginBottom: 12 }}>{variantLabel} · {room.capacity} أشخاص</span>

        {booking && (
          <div style={{ background: 'var(--olive-light)', border: '1px solid var(--adm-tone-good-border)', borderRadius: 8, padding: '8px 10px', margin: '12px 0', fontSize: 12 }}>
            <p style={{ fontWeight: 700, color: 'var(--terracotta-dark)', marginBottom: 2 }}>{booking.guestName}</p>
            <p style={{ color: 'var(--charcoal)' }}>{booking.guestPhone}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <Button variant="primary" size="sm" icon={<FiEdit2 size={12} />} onClick={() => onEdit(room)} style={{ flex: 1 }}>تعديل</Button>
          <Button
            variant="outline" size="sm" iconOnly
            icon={room.active !== false ? <FiEyeOff size={13} /> : <FiEye size={13} />}
            title={room.active !== false ? 'إخفاء الغرفة' : 'إظهار الغرفة'}
            onClick={() => onToggle(room)}
          />
          <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={13} />} title="حذف الغرفة" onClick={onDelete} />
        </div>
      </div>
    </div>
  )
}
