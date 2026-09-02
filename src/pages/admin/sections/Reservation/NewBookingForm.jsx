import { useState } from 'react'
import { FiPlusCircle, FiAlertCircle } from 'react-icons/fi'
import { createBooking } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import { variantPrice } from '../../utils/bookingHelpers'
import Button from '../../components/Button'
import { Field } from '../../components/FormCard'
import { useGuardWhile } from '../../hooks/useNavGuard'

function todayStr() { return new Date().toISOString().split('T')[0] }
function addDays(dateStr, n) { return new Date(new Date(dateStr).getTime() + n * 86400000).toISOString().split('T')[0] }

// The entire "new booking" flow for a room that's already been picked from
// the grid — no room-type step needed, since the room IS the context. This
// replaces the old decoupled new-booking form + persistent topbar CTA.
// `minCheckIn`, when given, is a hard floor (e.g. "this room's current stay
// doesn't check out until X") — not a heuristic. There's no equivalent max:
// the operator can pick any checkout, and a stay that actually overlaps
// another booking on this room is rejected by createBooking's own conflict
// check below, same as everywhere else in the app.
export default function NewBookingForm({ room, variants, onCreated, minCheckIn }) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guests, setGuests] = useState(String(room.capacity || 1))
  const [checkIn, setCheckIn] = useState(() => (minCheckIn && minCheckIn > todayStr() ? minCheckIn : todayStr()))
  const [checkOut, setCheckOut] = useState(() => {
    const in0 = minCheckIn && minCheckIn > todayStr() ? minCheckIn : todayStr()
    return addDays(in0, 1)
  })
  // Defaults to the room category's fixed nightly price, when it has one —
  // still a plain editable field, so a one-off custom price for this
  // specific reservation is just a matter of overwriting it.
  const [price, setPrice] = useState(() => {
    const p = variantPrice(variants || [], room.type, room.capacity)
    return p != null ? String(p) : ''
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useGuardWhile(guestName.trim() !== '' || guestPhone.trim() !== '')

  const submit = async (e) => {
    e.preventDefault()
    if (!guestName.trim() || !guestPhone.trim()) { setError('أدخل اسم الضيف ورقم الهاتف'); return }
    if (!(new Date(checkIn) < new Date(checkOut))) { setError('تواريخ غير صحيحة'); return }
    if (minCheckIn && checkIn < minCheckIn) { setError('لا يمكن أن يبدأ الحجز قبل مغادرة الحجز الحالي على هذه الغرفة'); return }
    setBusy(true); setError('')
    try {
      await createBooking({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        guests: Number(guests) || 1,
        checkIn, checkOut,
        source: 'walk-in',
        status: 'confirmed',
        rooms: [{
          roomId: room.id,
          roomNumber: room.number,
          roomType: room.type,
          roomCapacity: room.capacity,
          roomNameAr: CATEGORY_LABEL_AR[room.type] || room.type,
          checkIn, checkOut,
          price: price === '' ? null : Number(price),
        }],
      })
      onCreated()
    } catch (e) {
      setError(e?.code === 'ROOM_UNAVAILABLE' ? 'الغرفة محجوزة في هذه الفترة' : 'تعذّر إنشاء الحجز: ' + (e?.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
        غرفة {room.number} · {CATEGORY_LABEL_AR[room.type] || room.type} · {room.capacity} أشخاص
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <Field label="اسم الضيف"><input className="adm-input" value={guestName} onChange={e => setGuestName(e.target.value)} required /></Field>
        <Field label="رقم الهاتف"><input className="adm-input" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required /></Field>
        <Field label="البريد الإلكتروني (اختياري)"><input type="email" className="adm-input" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /></Field>
        <Field label="عدد الأشخاص"><input type="number" min={1} className="adm-input" value={guests} onChange={e => setGuests(e.target.value)} /></Field>
        <Field label="الوصول"><input type="date" className="adm-input" value={checkIn} min={minCheckIn || undefined} onChange={e => setCheckIn(e.target.value)} /></Field>
        <Field label="المغادرة"><input type="date" className="adm-input" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} /></Field>
        <Field label="السعر (اختياري) $"><input type="number" min={0} className="adm-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" /></Field>
      </div>
      {error && <div className="adm-field-error"><FiAlertCircle size={13} /> {error}</div>}
      <Button type="submit" variant="primary" icon={<FiPlusCircle size={15} />} disabled={busy}>
        {busy ? 'جارٍ الإنشاء...' : 'إنشاء الحجز'}
      </Button>
    </form>
  )
}
