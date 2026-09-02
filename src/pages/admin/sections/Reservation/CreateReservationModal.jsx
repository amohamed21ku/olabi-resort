import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2, FiAlertCircle, FiPlusCircle } from 'react-icons/fi'
import { createBooking } from '../../services'
import { CATEGORY_OPTIONS, CATEGORY_LABEL_AR } from '../../constants'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Picker from '../../components/Picker'
import { Field } from '../../components/FormCard'
import { roomCandidatesForLine, fmtDateShort, variantPrice } from '../../utils/bookingHelpers'
import { useGuardWhile } from '../../hooks/useNavGuard'

function todayStr() { return new Date().toISOString().split('T')[0] }
function tomorrowStr() { return new Date(Date.now() + 86400000).toISOString().split('T')[0] }

// A brand-new reservation, built from scratch: guest info once, then any
// number of rooms added one at a time (each its own type → availability →
// pick-room → price steps, same shape as "إضافة غرفة أخرى لهذا الحجز" on an
// existing booking in RoomsPanel.jsx) — accumulated locally and submitted as
// a single createBooking call carrying the whole `rooms[]` array, instead of
// creating one single-room booking per room the way the room-grid's own
// "new booking" form does.
export default function CreateReservationModal({ rooms, bookings, variants, onClose, onCreated }) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guests, setGuests] = useState('1')
  const [lines, setLines] = useState([]) // [{ _key, roomId, roomNumber, roomType, roomCapacity, roomNameAr, checkIn, checkOut, price }]
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useGuardWhile(guestName.trim() !== '' || guestPhone.trim() !== '' || lines.length > 0)

  const addLine = (line) => { setLines(ls => [...ls, { ...line, _key: `${Date.now()}-${ls.length}` }]); setAddOpen(false) }
  const removeLine = (key) => setLines(ls => ls.filter(l => l._key !== key))

  const submit = async () => {
    if (!guestName.trim() || !guestPhone.trim()) { setError('أدخل اسم الضيف ورقم الهاتف'); return }
    if (!lines.length) { setError('أضف غرفة واحدة على الأقل'); return }
    setBusy(true); setError('')
    try {
      await createBooking({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        guests: Number(guests) || 1,
        source: 'walk-in',
        status: 'confirmed',
        rooms: lines.map(l => ({
          roomId: l.roomId, roomNumber: l.roomNumber, roomType: l.roomType, roomCapacity: l.roomCapacity,
          roomNameAr: l.roomNameAr, checkIn: l.checkIn, checkOut: l.checkOut, price: l.price,
        })),
      })
      onCreated()
    } catch (e) {
      setError(e?.code === 'ROOM_UNAVAILABLE' ? 'إحدى الغرف لم تعد متاحة في هذه الفترة — أعد اختيارها' : 'تعذّر إنشاء الحجز: ' + (e?.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal open wide title="إنشاء حجز جديد" onClose={onClose} footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" icon={<FiPlusCircle size={15} />} disabled={busy} onClick={submit}>
            {busy ? 'جارٍ الإنشاء...' : 'إنشاء الحجز'}
          </Button>
        </>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="اسم الضيف"><input className="adm-input" value={guestName} onChange={e => setGuestName(e.target.value)} required /></Field>
            <Field label="رقم الهاتف"><input className="adm-input" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required /></Field>
            <Field label="البريد الإلكتروني (اختياري)"><input type="email" className="adm-input" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /></Field>
            <Field label="عدد الأشخاص"><input type="number" min={1} className="adm-input" value={guests} onChange={e => setGuests(e.target.value)} /></Field>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>الغرف ({lines.length})</p>
              <Button variant="secondary" size="sm" icon={<FiPlus size={14} />} onClick={() => setAddOpen(true)}>إضافة غرفة</Button>
            </div>
            {lines.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>لم تُضَف أي غرفة بعد.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map(l => (
                  <div key={l._key} className="adm-list-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>غرفة {l.roomNumber} — {CATEGORY_LABEL_AR[l.roomType] || l.roomType}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        {fmtDateShort(l.checkIn)} ← {fmtDateShort(l.checkOut)}{l.price != null ? ` · $${l.price}` : ''}
                      </p>
                    </div>
                    <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={13} />} title="حذف هذه الغرفة" onClick={() => removeLine(l._key)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="adm-field-error"><FiAlertCircle size={13} /> {error}</div>}
        </div>
      </Modal>

      {addOpen && (
        <AddRoomStep
          rooms={rooms}
          bookings={bookings}
          variants={variants}
          existingLines={lines}
          onAdd={addLine}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  )
}

// Step one of adding a room: type + dates. Mirrors AddRoomModal in
// RoomsPanel.jsx (same two-box shape), adapted for a booking that doesn't
// exist yet — there's no bookingId to exclude from conflict checks.
function AddRoomStep({ rooms, bookings, variants, existingLines, onAdd, onClose }) {
  const [ci, setCi] = useState(todayStr())
  const [co, setCo] = useState(tomorrowStr())
  const [choosingType, setChoosingType] = useState(null)

  return (
    <>
      <Modal open title="إضافة غرفة" onClose={onClose} footer={
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="نوع الغرفة">
            <Picker
              options={CATEGORY_OPTIONS.map(o => ({ value: o.value, label: o.labelAr }))}
              value={choosingType || ''}
              onChange={setChoosingType}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Field label="الوصول"><input type="date" className="adm-input" value={ci} onChange={e => setCi(e.target.value)} style={{ width: 150 }} /></Field>
            <Field label="المغادرة"><input type="date" className="adm-input" value={co} min={ci} onChange={e => setCo(e.target.value)} style={{ width: 150 }} /></Field>
          </div>
        </div>
      </Modal>

      {choosingType && (
        <ChooseAvailableRoomStep
          rooms={rooms} bookings={bookings} variants={variants} existingLines={existingLines}
          roomType={choosingType} ci={ci} co={co}
          onCancel={() => setChoosingType(null)}
          onConfirm={(room, price) => onAdd({
            roomId: room.id,
            roomNumber: room.number,
            roomType: room.type,
            roomCapacity: room.capacity,
            roomNameAr: CATEGORY_LABEL_AR[room.type] || room.type,
            checkIn: ci, checkOut: co,
            price: price === '' ? null : Number(price),
          })}
        />
      )}
    </>
  )
}

// Step two: only rooms of the chosen type/dates that are actually free —
// both against real bookings (roomCandidatesForLine) and against whatever
// rooms were already added earlier in this same not-yet-saved reservation
// (createBooking only checks new lines against existing bookings, not
// against each other, so a room picked twice for overlapping dates within
// one submission would otherwise slip through uncaught).
function ChooseAvailableRoomStep({ rooms, bookings, variants, existingLines, roomType, ci, co, onCancel, onConfirm }) {
  const [pick, setPick] = useState('')
  const [price, setPrice] = useState('')

  // Defaults to the picked room's category price (candidates can span more
  // than one capacity within the same type, so the lookup runs off the
  // specific room chosen, not just `roomType`) — still freely editable
  // before confirming, for a one-off custom price.
  useEffect(() => {
    if (!pick) return
    const room = rooms.find(r => r.id === pick)
    if (!room) return
    const p = variantPrice(variants || [], room.type, room.capacity)
    setPrice(p != null ? String(p) : '')
  }, [pick, rooms, variants])

  const candidates = roomCandidatesForLine({ roomType, roomCapacity: null, roomId: null, checkIn: ci, checkOut: co }, rooms, bookings, null)
  const usedByThisBooking = new Set(
    existingLines
      .filter(l => new Date(l.checkIn) < new Date(co) && new Date(l.checkOut) > new Date(ci))
      .map(l => l.roomId)
  )
  const decorated = candidates.map(c => ({ ...c, conflict: c.conflict || usedByThisBooking.has(c.room.id) }))
  const available = decorated.filter(c => !c.conflict)
  const noRoomsOfType = decorated.length === 0
  const noneAvailable = decorated.length > 0 && available.length === 0

  const options = decorated.map(({ room, conflict, blocked }) => ({
    value: room.id,
    label: `غرفة ${room.number}`,
    hint: conflict ? (blocked ? 'محظورة في هذه الفترة' : 'محجوزة أو مُختارة بالفعل') : `${room.capacity} أشخاص`,
    disabled: conflict,
  }))

  return (
    <Modal open title={`اختر غرفة — ${CATEGORY_LABEL_AR[roomType] || roomType}`} onClose={onCancel} footer={
      <>
        <Button variant="ghost" onClick={onCancel}>رجوع</Button>
        <Button variant="primary" disabled={!pick} onClick={() => { const room = rooms.find(r => r.id === pick); if (room) onConfirm(room, price) }}>
          إضافة هذه الغرفة
        </Button>
      </>
    }>
      {noRoomsOfType ? (
        <div className="adm-field-error"><FiAlertCircle size={13} /> لا توجد غرف من هذه الفئة في المنتجع — ارجع واختر فئة أخرى</div>
      ) : noneAvailable ? (
        <div className="adm-field-error"><FiAlertCircle size={13} /> كل غرف هذه الفئة محجوزة في هذه الفترة — ارجع واختر فئة أخرى أو غيّر التواريخ</div>
      ) : (
        <>
          <Picker options={options} value={pick} onChange={setPick} />
          <div style={{ marginTop: 14 }}>
            <Field label="السعر (اختياري) $"><input type="number" min={0} className="adm-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={{ width: 140 }} /></Field>
          </div>
        </>
      )}
    </Modal>
  )
}
