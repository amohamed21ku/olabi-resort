import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useGuardedNavigate } from '../../hooks/useGuardedNavigate'
import {
  FiChevronRight, FiMessageCircle, FiTrash2, FiUser, FiPhone, FiMail,
  FiUsers, FiSliders, FiClock, FiMessageSquare, FiCalendar, FiHome, FiLogIn, FiLogOut, FiLock, FiUnlock, FiAlertCircle,
} from 'react-icons/fi'
import {
  getBookingRooms, formatBookingNumber, buildCustomerWhatsAppUrl, computeBookingFinance,
  setRoomBlock, clearRoomBlock,
} from '../../services'
import { fmtDateFull, fmtDateTime, fmtDateShort, bookingRoomsInfo } from '../../utils/bookingHelpers'
import { getRoomFocusBooking } from '../../utils/roomStatus'
import { STATUS, SOURCE_LABELS, CATEGORY_LABEL_AR } from '../../constants'
import { Card, CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Field } from '../../components/FormCard'
import { StatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import InfoItem from '../../components/InfoItem'
import FolioPanel from '../../components/FolioPanel'
import StageActionBar from './StageActionBar'
import RoomsPanel from './RoomsPanel'
import NewBookingForm from './NewBookingForm'

// Single entry point for "a room" — vacant or occupied. Everything a clerk
// might need to do with this room lives on this one page.
export default function RoomPanel({ rooms, bookings, bookingActions }) {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { go } = useGuardedNavigate()
  const room = rooms.find(r => r.id === roomId)

  if (!room) {
    return (
      <div className="adm-card" style={{ padding: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>هذه الغرفة غير موجودة.</p>
        <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={() => go('/admin/reservation')} style={{ marginTop: 12 }}>
          رجوع إلى لوحة الغرف
        </Button>
      </div>
    )
  }

  // A click that already knows which booking it wants (e.g. a name in the
  // Upcoming Arrivals list, or a specific bar in the calendar) targets it
  // directly via ?bookingId= instead of leaving room selection to
  // getRoomFocusBooking's "what's relevant for this room today" guess —
  // which, for a room with more than one relevant booking (a guest checked
  // in today AND a different guest arriving in two days), could otherwise
  // resolve to the wrong one and show mismatched dates for who was clicked.
  const targetBookingId = searchParams.get('bookingId')
  const targeted = targetBookingId ? bookings.find(b => b.id === targetBookingId) : null
  const focus = targeted
    ? { kind: 'current', booking: targeted, line: getBookingRooms(targeted).find(l => l.roomId === room.id) || null }
    : getRoomFocusBooking(room, bookings)
  const { kind, booking, line } = focus

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Button variant="ghost" size="sm" icon={<FiChevronRight size={14} />} onClick={() => go('/admin/reservation')}>
        رجوع إلى لوحة الغرف
      </Button>

      {kind === 'current'
        ? <OccupiedRoomPanel room={room} booking={booking} rooms={rooms} bookings={bookings} bookingActions={bookingActions} onBack={() => go('/admin/reservation')} />
        : <VacantRoomPanel room={room} onCreated={() => navigate(`/admin/reservation/${room.id}`)} upcoming={kind === 'upcoming' ? { booking, line } : null} />}
    </div>
  )
}

function RoomBlockControl({ room }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [until, setUntil] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const block = async () => {
    setBusy(true); setError('')
    try { await setRoomBlock(room.id, until); setModalOpen(false) }
    catch (e) { setError('فشل الحظر: ' + (e?.message || '')) }
    finally { setBusy(false) }
  }
  const unblock = async () => {
    setBusy(true); setError('')
    try { await clearRoomBlock(room.id) }
    catch (e) { setError('فشل إلغاء الحظر: ' + (e?.message || '')) }
    finally { setBusy(false) }
  }

  return (
    <>
      {room.blockedUntil ? (
        <Button variant="outline" size="sm" icon={<FiUnlock size={13} />} disabled={busy} onClick={unblock}>
          إلغاء الحظر (محظورة حتى {fmtDateShort(room.blockedUntil)})
        </Button>
      ) : (
        <Button variant="outline" size="sm" icon={<FiLock size={13} />} onClick={() => setModalOpen(true)}>
          حظر الغرفة
        </Button>
      )}
      {error && <div className="adm-field-error" style={{ marginTop: 8 }}>{error}</div>}
      {modalOpen && (
        <Modal open title="حظر الغرفة" onClose={() => setModalOpen(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button variant="primary" disabled={busy} onClick={block}>{busy ? 'جارٍ...' : 'تأكيد الحظر'}</Button>
          </>
        }>
          <Field label="محظورة حتى تاريخ">
            <input type="date" className="adm-input" value={until} min={new Date().toISOString().split('T')[0]} onChange={e => setUntil(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  )
}

function VacantRoomPanel({ room, onCreated, upcoming }) {
  return (
    <>
      <div className="adm-section-header">
        <div>
          <h2>غرفة {room.number}</h2>
          <p>الطابق {room.floor} · {CATEGORY_LABEL_AR[room.type] || room.type} · {room.capacity} أشخاص · شاغرة</p>
        </div>
        <RoomBlockControl room={room} />
      </div>
      {upcoming && (
        <div className="adm-field-error" style={{ background: 'var(--adm-tone-warn-bg)', color: 'var(--adm-tone-warn-text)', marginBottom: 4 }}>
          <FiAlertCircle size={13} />
          هذه الغرفة شاغرة الآن، لكن لديها حجز قادم لـ{upcoming.booking.guestName} بدءاً من {fmtDateShort(upcoming.line.checkIn)} — تأكد أن تاريخ مغادرة الحجز الجديد لا يتجاوز هذا التاريخ.
        </div>
      )}
      <Card>
        <CardHeader icon={<FiHome size={15} color="var(--muted)" />}>بدء حجز جديد لهذه الغرفة</CardHeader>
        <CardBody>
          <NewBookingForm room={room} onCreated={onCreated} maxCheckOut={upcoming?.line?.checkIn} />
        </CardBody>
      </Card>
    </>
  )
}

function OccupiedRoomPanel({ room, booking: b, rooms, bookings, bookingActions, onBack }) {
  const { updating, deleting, stageBusy, stageErr, changeStatus, deleteBooking, checkIn, checkOut } = bookingActions
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCheckOut, setConfirmCheckOut] = useState(null)

  const fin = computeBookingFinance(b)
  const roomLines = getBookingRooms(b)
  const { numbers } = bookingRoomsInfo(b)
  const otherRoomNumbers = numbers.filter(n => n !== room.number)
  const nights = b.nights || Math.max(1, Math.ceil((new Date(b.checkOut?.toDate?.() || b.checkOut) - new Date(b.checkIn?.toDate?.() || b.checkIn)) / 86400000))
  const ref = b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id.slice(0, 6).toUpperCase()

  const handleDelete = async () => {
    const ok = await deleteBooking(b)
    setConfirmDelete(false)
    if (ok) onBack()
  }
  const requestCheckOut = (when) => {
    if (fin.balance > 0) setConfirmCheckOut(when)
    else checkOut(b, when)
  }
  const confirmedCheckOut = () => { checkOut(b, confirmCheckOut); setConfirmCheckOut(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>
              غرفة {room.number} — {b.guestName}
            </h2>
            <code style={{ fontSize: 12, background: 'var(--linen)', color: 'var(--muted)', padding: '2px 9px', borderRadius: 5, fontWeight: 600 }}>#{ref}</code>
            <StatusBadge status={b.status} />
            <PaymentStatusBadge status={fin.paymentStatus} />
          </div>
          {otherRoomNumbers.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--adm-tone-warn-text)', marginTop: 4 }}>
              هذا الحجز يشمل أيضاً: غرفة {otherRoomNumbers.join('، غرفة ')} — تسجيل الوصول/المغادرة هنا يشمل كل هذه الغرف معاً.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="adm-field" style={{ gap: 3 }}>
            <label className="form-lbl" style={{ marginBottom: 0 }}>حالة الحجز</label>
            <select className="adm-input" value={b.status || 'confirmed'} disabled={updating}
              onChange={e => changeStatus(b.id, e.target.value)} style={{ fontWeight: 700, minHeight: 40, width: 140 }}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <RoomBlockControl room={room} />
          <a href={buildCustomerWhatsAppUrl(b, 'ar')} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--secondary">
            <FiMessageCircle size={15} /> واتساب
          </a>
          <Button variant="destructive-outline" icon={<FiTrash2 size={14} />} disabled={deleting} onClick={() => setConfirmDelete(true)}>حذف الحجز</Button>
        </div>
      </div>

      <StageActionBar
        booking={b} fin={fin} busy={stageBusy || updating} error={stageErr}
        onConfirm={() => changeStatus(b.id, 'confirmed')}
        onCheckIn={() => checkIn(b)}
        onRequestCheckOut={requestCheckOut}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RoomsPanel booking={b} rooms={rooms} bookings={bookings} bookingActions={bookingActions} />
          <FolioPanel booking={b} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader icon={<FiUser size={14} color="var(--muted)" />}>معلومات الضيف</CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoItem icon={<FiPhone size={13} />} label="الهاتف" value={b.guestPhone} />
              {b.guestEmail && <InfoItem icon={<FiMail size={13} />} label="البريد" value={b.guestEmail} />}
              <InfoItem icon={<FiUsers size={13} />} label="الأشخاص" value={`${b.guests} ضيف`} />
              {b.source && <InfoItem icon={<FiSliders size={13} />} label="المصدر" value={SOURCE_LABELS[b.source] || b.source} />}
              <InfoItem icon={<FiClock size={13} />} label="تاريخ الحجز" value={fmtDateFull(b.createdAt)} />
              {b.notes && <InfoItem icon={<FiMessageSquare size={13} />} label="ملاحظات" value={b.notes} />}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<FiCalendar size={14} color="var(--muted)" />}>تفاصيل الإقامة</CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoItem icon={<FiHome size={13} />} label={roomLines.length > 1 ? 'الغرف' : 'الغرفة'} value={roomLines.length > 1 ? `${roomLines.length} غرف` : `غرفة ${room.number}`} />
              <InfoItem icon={<FiCalendar size={13} />} label="الوصول" value={fmtDateFull(b.checkIn)} />
              <InfoItem icon={<FiCalendar size={13} />} label="المغادرة" value={fmtDateFull(b.checkOut)} />
              <InfoItem icon={<FiClock size={13} />} label="الليالي" value={`${nights} ليلة`} />
              {b.checkedInAt  && <InfoItem icon={<FiLogIn size={13} />}  label="سجّل الوصول"  value={fmtDateTime(b.checkedInAt)} />}
              {b.checkedOutAt && <InfoItem icon={<FiLogOut size={13} />} label="سجّل المغادرة" value={fmtDateTime(b.checkedOutAt)} />}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="حذف الحجز"
        message={`سيتم حذف حجز ${b.guestName} نهائياً — هل أنت متأكد؟`}
        confirmLabel="حذف الحجز"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmCheckOut != null}
        title="تسجيل المغادرة"
        message={`يوجد مبلغ متبقٍّ قدره ${fin.balance} على حساب هذا الحجز. هل تريد متابعة تسجيل المغادرة؟`}
        confirmLabel="تسجيل المغادرة"
        destructive={false}
        busy={stageBusy}
        onConfirm={confirmedCheckOut}
        onCancel={() => setConfirmCheckOut(null)}
      />
    </div>
  )
}
