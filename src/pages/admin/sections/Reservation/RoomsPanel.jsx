import { useState } from 'react'
import { FiHome, FiPlus, FiTrash2, FiCalendar, FiAlertCircle, FiCheck } from 'react-icons/fi'
import {
  getBookingRooms, assignRoomLine, unassignRoomLine,
  addBookingRoomLine, removeBookingRoomLine, updateBookingRoomLine, setBookingDatesAllRooms,
} from '../../services'
import { roomCandidatesForLine } from '../../utils/bookingHelpers'
import { CATEGORY_OPTIONS, CATEGORY_LABEL_AR } from '../../constants'
import { Card, CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Picker from '../../components/Picker'
import { Field } from '../../components/FormCard'
import { useGuardWhile } from '../../hooks/useNavGuard'

// Lists every room-line of a booking so a multi-room reservation can be
// managed from any one of its rooms: adding, choosing, changing and removing
// a room is built around what a front-desk clerk is actually deciding — not
// the underlying data model. Every step is one big labeled button → one
// simple picker/modal → (for removal) one plain confirmation. The old
// "assign/unassign" toggle concept never reaches the UI; the same
// services.js calls run underneath, unchanged.
export default function RoomsPanel({ booking, rooms, bookings, bookingActions }) {
  const { runRooms, roomsBusy: busy, roomsErr: error } = bookingActions
  const lines = getBookingRooms(booking)
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [chooseFor, setChooseFor] = useState(null) // lineId currently picking a room for
  const [removeTarget, setRemoveTarget] = useState(null) // line pending removal confirmation
  useGuardWhile(addOpen || bulkOpen || !!chooseFor || !!removeTarget)

  const handleRemove = () => {
    if (!removeTarget) return
    runRooms(() => removeBookingRoomLine(booking.id, removeTarget.lineId))
    setRemoveTarget(null)
  }

  return (
    <Card>
      <CardHeader icon={<FiHome size={15} color="var(--muted)" />}>الغرف ({lines.length})</CardHeader>
      <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" icon={<FiPlus size={15} />} onClick={() => setAddOpen(true)}>
            إضافة غرفة أخرى لهذا الحجز
          </Button>
          {lines.length > 1 && (
            <Button variant="outline" size="sm" icon={<FiCalendar size={13} />} onClick={() => setBulkOpen(true)}>
              توحيد تواريخ كل الغرف
            </Button>
          )}
        </div>

        {lines.map(line => (
          <RoomLineCard
            key={line.lineId}
            line={line} rooms={rooms} busy={busy}
            canRemove={lines.length > 1}
            onChooseRoom={() => setChooseFor(line.lineId)}
            onUpdate={(patch) => runRooms(() => updateBookingRoomLine(booking.id, line.lineId, patch))}
            onRequestRemove={() => setRemoveTarget(line)}
          />
        ))}

        {error && <div className="adm-field-error"><FiAlertCircle size={13} /> {error}</div>}
      </CardBody>

      {addOpen && (
        <AddRoomModal
          booking={booking}
          rooms={rooms}
          bookings={bookings}
          busy={busy}
          onAdd={(data) => { runRooms(() => addBookingRoomLine(booking.id, data)); setAddOpen(false) }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {bulkOpen && (
        <BulkDatesModal
          lines={lines}
          busy={busy}
          onApply={(ci, co) => { runRooms(() => setBookingDatesAllRooms(booking.id, ci, co)); setBulkOpen(false) }}
          onClose={() => setBulkOpen(false)}
        />
      )}

      {chooseFor && (
        <ChooseRoomModal
          booking={booking} rooms={rooms} bookings={bookings} busy={busy}
          line={lines.find(l => l.lineId === chooseFor)}
          onChoose={(roomId) => { runRooms(() => assignRoomLine(booking.id, chooseFor, roomId)); setChooseFor(null) }}
          onUnassign={() => { runRooms(() => unassignRoomLine(booking.id, chooseFor)); setChooseFor(null) }}
          onClose={() => setChooseFor(null)}
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="حذف غرفة من الحجز"
        message="سيتم حذف هذه الغرفة من الحجز نهائياً — هل أنت متأكد؟"
        confirmLabel="حذف الغرفة"
        busy={busy}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </Card>
  )
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function RoomLineCard({ line, rooms, busy, canRemove, onChooseRoom, onUpdate, onRequestRemove }) {
  const [ci, setCi] = useState(line.checkIn)
  const [co, setCo] = useState(line.checkOut)
  const [roomType, setRoomType] = useState(line.roomType || '')
  const [price, setPrice] = useState(line.price != null ? String(line.price) : '')
  const assigned = !!line.roomId
  const label = CATEGORY_LABEL_AR[line.roomType] || line.roomType || '—'
  // The line's own roomNumber/roomNameAr are denormalized at assignment time
  // for display speed, but a couple of write paths have historically skipped
  // them (fixed now, but past bookings can still carry roomId with no
  // matching roomNumber) — fall back to looking the room up live instead of
  // ever rendering a literal "null" where a room number should be.
  const liveRoom = assigned ? rooms.find(r => r.id === line.roomId) : null
  const roomNumber = line.roomNumber ?? liveRoom?.number ?? '؟'
  const roomNameAr = line.roomNameAr || (liveRoom ? CATEGORY_LABEL_AR[liveRoom.type] || liveRoom.type : null)
  const nights = Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / 86400000))
  const datesChanged = ci !== line.checkIn || co !== line.checkOut
  const priceChanged = (price === '' ? null : Number(price)) !== line.price
  const typeChanged = roomType !== (line.roomType || '')

  const setNights = (n) => setCo(addDays(ci, Math.max(1, Number(n) || 1)))

  return (
    <div className="adm-list-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, background: assigned ? 'var(--olive-light)' : 'var(--adm-tone-warn-bg)',
          color: assigned ? 'var(--terracotta-dark)' : 'var(--adm-tone-warn-text)',
        }}>
          {assigned ? roomNumber : '—'}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{assigned ? (roomNameAr || `غرفة ${roomNumber}`) : 'غرفة غير مُختارة بعد'}</p>
          <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}{line.roomCapacity ? ` · ${line.roomCapacity} أشخاص` : ''}</p>
        </div>
        <Button variant={assigned ? 'outline' : 'secondary'} size="sm" onClick={onChooseRoom}>
          {assigned ? 'تغيير الغرفة' : 'اختيار الغرفة'}
        </Button>
        {canRemove && (
          <Button variant="destructive-outline" size="sm" iconOnly icon={<FiTrash2 size={13} />} title="حذف هذه الغرفة من الحجز" onClick={onRequestRemove} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <Field label="نوع الغرفة">
          <select className="adm-input" value={roomType} onChange={e => setRoomType(e.target.value)} style={{ width: 130 }}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.labelAr}</option>)}
          </select>
        </Field>
        <Field label="الوصول"><input type="date" className="adm-input" value={ci} onChange={e => setCi(e.target.value)} style={{ width: 150 }} /></Field>
        <Field label="المغادرة"><input type="date" className="adm-input" value={co} min={ci} onChange={e => setCo(e.target.value)} style={{ width: 150 }} /></Field>
        <Field label="عدد الليالي"><input type="number" min={1} className="adm-input" value={nights} onChange={e => setNights(e.target.value)} style={{ width: 80 }} /></Field>
        <Field label="السعر $"><input type="number" min={0} className="adm-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={{ width: 100 }} /></Field>
        <Button
          variant="ghost" size="sm" icon={<FiCheck size={13} />}
          disabled={busy || (!datesChanged && !priceChanged && !typeChanged)}
          onClick={() => onUpdate({
            checkIn: ci, checkOut: co,
            ...(priceChanged ? { price: price === '' ? null : Number(price) } : {}),
            ...(typeChanged ? { roomType } : {}),
          })}
        >
          حفظ
        </Button>
      </div>
      {typeChanged && assigned && (
        <div className="adm-field-error" style={{ marginTop: 8, background: 'var(--adm-tone-warn-bg)', color: 'var(--adm-tone-warn-text)' }}>
          <FiAlertCircle size={12} /> سيتم إلغاء تعيين الغرفة الحالية عند تغيير النوع
        </div>
      )}
    </div>
  )
}

// Adding a room is two steps, each its own box: pick a type + dates here,
// which immediately opens a second box on top to pick the actual free room
// — "cancel" on that second box drops back to this one instead of closing
// everything, so changing type/dates and trying again doesn't mean starting
// over. No manual capacity typing either way — the chosen room's own
// capacity is used.
function AddRoomModal({ booking, rooms, bookings, busy, onAdd, onClose }) {
  const bIn  = getBookingRooms(booking)[0]?.checkIn  || new Date().toISOString().split('T')[0]
  const bOut = getBookingRooms(booking)[0]?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [ci, setCi] = useState(bIn)
  const [co, setCo] = useState(bOut)
  const [choosingType, setChoosingType] = useState(null) // set → opens the room-choice box

  const submit = (room) => {
    onAdd({
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      roomCapacity: room.capacity,
      roomNameAr: CATEGORY_LABEL_AR[room.type] || room.type,
      checkIn: ci, checkOut: co,
    })
  }

  return (
    <>
      <Modal open title="إضافة غرفة أخرى لهذا الحجز" onClose={onClose} footer={
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
        <ChooseAvailableRoomModal
          booking={booking} rooms={rooms} bookings={bookings} busy={busy}
          roomType={choosingType} ci={ci} co={co}
          onCancel={() => setChoosingType(null)}
          onConfirm={submit}
        />
      )}
    </>
  )
}

// The second box: shows only what's free for the chosen type + dates. This
// is deliberately a separate modal (not an inline section of the first) so
// "cancel" reads unambiguously as "go back and pick a different type" rather
// than a fold-out that's easy to miss.
function ChooseAvailableRoomModal({ booking, rooms, bookings, busy, roomType, ci, co, onCancel, onConfirm }) {
  const [pick, setPick] = useState('')

  const candidates = roomCandidatesForLine({ roomType, roomCapacity: null, roomId: null, checkIn: ci, checkOut: co }, rooms, bookings, booking.id)
  const available = candidates.filter(c => !c.conflict)
  const noRoomsOfType = candidates.length === 0
  const noneAvailable = candidates.length > 0 && available.length === 0

  const options = candidates.map(({ room, conflict, blocked }) => ({
    value: room.id,
    label: `غرفة ${room.number}`,
    hint: conflict ? (blocked ? 'محظورة في هذه الفترة' : 'محجوزة في هذه الفترة') : `${room.capacity} أشخاص`,
    disabled: conflict,
  }))

  return (
    <Modal open title={`اختر غرفة — ${CATEGORY_LABEL_AR[roomType] || roomType}`} onClose={onCancel} footer={
      <>
        <Button variant="ghost" onClick={onCancel}>رجوع</Button>
        <Button variant="primary" disabled={!pick || busy} onClick={() => { const room = rooms.find(r => r.id === pick); if (room) onConfirm(room) }}>
          تأكيد الاختيار
        </Button>
      </>
    }>
      {noRoomsOfType ? (
        <div className="adm-field-error"><FiAlertCircle size={13} /> لا توجد غرف من هذه الفئة في المنتجع — ارجع واختر فئة أخرى</div>
      ) : noneAvailable ? (
        <div className="adm-field-error"><FiAlertCircle size={13} /> كل غرف هذه الفئة محجوزة في هذه الفترة — ارجع واختر فئة أخرى أو غيّر التواريخ</div>
      ) : (
        <Picker options={options} value={pick} onChange={setPick} />
      )}
    </Modal>
  )
}

// Step for choosing/changing the concrete room on a line — replaces the old
// assign/unassign concept with a single "pick from the list" step.
function ChooseRoomModal({ booking, line, rooms, bookings, busy, onChoose, onUnassign, onClose }) {
  const [pick, setPick] = useState(line.roomId || '')
  const candidates = roomCandidatesForLine(line, rooms, bookings, booking.id)
  const options = candidates.map(({ room, isCurrent, conflict, blocked }) => ({
    value: room.id,
    label: `غرفة ${room.number}`,
    hint: isCurrent ? 'الغرفة الحالية لهذا الحجز' : conflict ? (blocked ? 'محظورة في هذه الفترة' : 'محجوزة في هذه الفترة') : `${room.capacity} أشخاص`,
    disabled: isCurrent || conflict,
  }))

  return (
    <Modal open title={line.roomId ? 'تغيير الغرفة' : 'اختيار الغرفة'} onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="primary" disabled={!pick || busy} onClick={() => onChoose(pick)}>تأكيد الاختيار</Button>
      </>
    }>
      <Picker options={options} value={pick} onChange={setPick} emptyText="لا توجد غرف متاحة بهذه السعة في هذه الفترة" />
      {line.roomId && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sand)' }}>
          <Button variant="ghost" size="sm" onClick={onUnassign} disabled={busy}>
            إزالة الغرفة والإبقاء على هذا السطر بلا غرفة محددة
          </Button>
        </div>
      )}
    </Modal>
  )
}

function BulkDatesModal({ lines, busy, onApply, onClose }) {
  const [ci, setCi] = useState(lines[0]?.checkIn || new Date().toISOString().split('T')[0])
  const [co, setCo] = useState(lines[0]?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0])
  return (
    <Modal open title="توحيد تواريخ كل الغرف" onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="primary" disabled={busy} onClick={() => onApply(ci, co)}>تطبيق على كل الغرف</Button>
      </>
    }>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>سيتم ضبط تاريخ الوصول والمغادرة نفسه على كل غرف هذا الحجز.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Field label="الوصول"><input type="date" className="adm-input" value={ci} onChange={e => setCi(e.target.value)} style={{ width: 160 }} /></Field>
        <Field label="المغادرة"><input type="date" className="adm-input" value={co} min={ci} onChange={e => setCo(e.target.value)} style={{ width: 160 }} /></Field>
      </div>
    </Modal>
  )
}
