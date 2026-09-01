import { useState } from 'react'
import { FiCheck, FiAlertCircle, FiUser, FiHome } from 'react-icons/fi'
import { formatBookingNumber, computeBookingFinance, updateBookingGuestInfo, updateBookingRoomLine, getBookingRooms } from '../../services'
import { CATEGORY_LABEL_AR, CATEGORY_OPTIONS } from '../../constants'
import Modal from '../../components/Modal'
import { Card, CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import { Field } from '../../components/FormCard'
import DeleteBookingButton from '../../components/DeleteBookingButton'
import { StatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import ConfirmBookingModal from './ConfirmBookingModal'

// The one place a booking gets managed end-to-end from a compact popup —
// used by the two lists that have no room of their own to link out to
// (PendingApprovalSection, NeedsRoomSection; once a room is assigned,
// UpcomingArrivalsPage instead sends staff to that room's own full page,
// which already has all of this — RoomsPanel — plus the room-reassignment
// and folio tools this popup deliberately doesn't duplicate).
export default function BookingDetailsModal({ booking: b, bookingActions, onClose }) {
  const [confirming, setConfirming] = useState(false)
  const fin = computeBookingFinance(b)
  const lines = getBookingRooms(b)
  const ref = b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id?.slice(0, 6).toUpperCase()

  return (
    <>
      <Modal open wide title={`حجز ${b.guestName}`} onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'monospace', background: 'var(--linen)', padding: '3px 10px', borderRadius: 6 }}>
            #{ref}
          </code>
          <StatusBadge status={b.status} />
          <PaymentStatusBadge status={fin.paymentStatus} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GuestInfoCard booking={b} />

          <Card>
            <CardHeader icon={<FiHome size={14} color="var(--muted)" />}>الغرف والتسعير</CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lines.map(line => <LineEditor key={line.lineId} bookingId={b.id} line={line} />)}
            </CardBody>
          </Card>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--sand)' }}>
          <DeleteBookingButton booking={b} bookingActions={bookingActions} onDeleted={onClose} />
          {b.status === 'pending' && (
            <Button variant="primary" icon={<FiCheck size={14} />} onClick={() => setConfirming(true)}>
              تأكيد الحجز
            </Button>
          )}
        </div>
      </Modal>

      {confirming && (
        <ConfirmBookingModal
          booking={b}
          bookingActions={bookingActions}
          onClose={() => { setConfirming(false); onClose() }}
        />
      )}
    </>
  )
}

function GuestInfoCard({ booking: b }) {
  const [guestName, setGuestName]   = useState(b.guestName || '')
  const [guestPhone, setGuestPhone] = useState(b.guestPhone || '')
  const [guestEmail, setGuestEmail] = useState(b.guestEmail || '')
  const [guests, setGuests]         = useState(String(b.guests || 1))
  const [notes, setNotes]           = useState(b.notes || '')
  const [dirty, setDirty]           = useState(false)
  const [busy, setBusy]             = useState(false)
  const [err, setErr]               = useState('')

  const set = (setter) => (v) => { setter(v); setDirty(true) }

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await updateBookingGuestInfo(b.id, { guestName, guestPhone, guestEmail, guests, notes })
      setDirty(false)
    } catch {
      setErr('فشل حفظ معلومات الضيف')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader icon={<FiUser size={14} color="var(--muted)" />}>معلومات الضيف</CardHeader>
      <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="الاسم"><input className="adm-input" value={guestName} onChange={e => set(setGuestName)(e.target.value)} /></Field>
          <Field label="الهاتف"><input className="adm-input" value={guestPhone} onChange={e => set(setGuestPhone)(e.target.value)} /></Field>
          <Field label="البريد الإلكتروني"><input className="adm-input" value={guestEmail} onChange={e => set(setGuestEmail)(e.target.value)} /></Field>
          <Field label="عدد الأشخاص"><input type="number" min={1} className="adm-input" value={guests} onChange={e => set(setGuests)(e.target.value)} /></Field>
        </div>
        <Field label="ملاحظات">
          <textarea className="adm-input" rows={2} value={notes} onChange={e => set(setNotes)(e.target.value)} style={{ resize: 'vertical' }} />
        </Field>
        {err && <div className="adm-field-error"><FiAlertCircle size={13} /> {err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" icon={<FiCheck size={13} />} disabled={!dirty || busy} onClick={save}>
            {busy ? 'جارٍ الحفظ...' : 'حفظ معلومات الضيف'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

// Dates + a per-night price for one room-line — the same checkIn/checkOut +
// price fields RoomsPanel.jsx already edits for roomed bookings, reused here
// for lines that don't have a room yet (or do, but staff would rather handle
// it from this popup than jump to the room page). Price is entered per night
// and multiplied out on save, since that's how the resort actually quotes a
// stay — but the stored field stays the per-line TOTAL, matching every other
// place in the app that reads line.price (computeBookingFinance, stats, the
// customer WhatsApp message, etc.) — no data-model change, just how this one
// input presents it.
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function LineEditor({ bookingId, line }) {
  const [ci, setCi] = useState(line.checkIn)
  const [co, setCo] = useState(line.checkOut)
  const [roomType, setRoomType] = useState(line.roomType || '')
  const [nightly, setNightly] = useState(
    line.price != null && line.nights ? String(Math.round((line.price / line.nights) * 100) / 100) : ''
  )
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const nights = Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / 86400000))
  const total = nightly !== '' ? Math.round(Number(nightly) * nights * 100) / 100 : null
  const typeChanged = roomType !== (line.roomType || '')

  const setNights = (n) => {
    const clean = Math.max(1, Number(n) || 1)
    setCo(addDays(ci, clean))
    setDirty(true)
  }

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await updateBookingRoomLine(bookingId, line.lineId, { checkIn: ci, checkOut: co, price: total, roomType })
      setDirty(false)
    } catch (e) {
      setErr(e?.message === 'ROOM_UNAVAILABLE' ? 'الغرفة محجوزة في هذه الفترة الجديدة' : 'تعذّر الحفظ: ' + (e?.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ background: 'var(--linen)', borderRadius: 10, padding: 12 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
        {line.roomId
          ? `${line.roomNameAr || ''}${line.roomNumber ? ` #${line.roomNumber}` : ''}`.trim()
          : `${CATEGORY_LABEL_AR[line.roomType] || line.roomType || 'غرفة'} — غير معيّنة`}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Field label="نوع الغرفة">
          <select className="adm-input" value={roomType} onChange={e => { setRoomType(e.target.value); setDirty(true) }} style={{ width: 130 }}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.labelAr}</option>)}
          </select>
        </Field>
        <Field label="الوصول">
          <input type="date" className="adm-input" value={ci} onChange={e => { setCi(e.target.value); setDirty(true) }} style={{ width: 150 }} />
        </Field>
        <Field label="المغادرة">
          <input type="date" className="adm-input" value={co} min={ci} onChange={e => { setCo(e.target.value); setDirty(true) }} style={{ width: 150 }} />
        </Field>
        <Field label="عدد الليالي">
          <input type="number" min={1} className="adm-input" value={nights} onChange={e => setNights(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="السعر لكل ليلة $">
          <input type="number" min={0} className="adm-input" value={nightly} onChange={e => { setNightly(e.target.value); setDirty(true) }} placeholder="0" style={{ width: 110 }} />
        </Field>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', paddingBottom: 12 }}>
          {total != null ? `الإجمالي $${total}` : ''}
        </span>
        <Button variant="ghost" size="sm" icon={<FiCheck size={13} />} disabled={busy || !dirty} onClick={save}>
          حفظ
        </Button>
      </div>
      {typeChanged && line.roomId && (
        <div className="adm-field-error" style={{ marginTop: 8, background: 'var(--adm-tone-warn-bg)', color: 'var(--adm-tone-warn-text)' }}>
          <FiAlertCircle size={12} /> سيتم إلغاء تعيين الغرفة الحالية عند تغيير النوع
        </div>
      )}
      {err && <div className="adm-field-error" style={{ marginTop: 8 }}><FiAlertCircle size={12} /> {err}</div>}
    </div>
  )
}
