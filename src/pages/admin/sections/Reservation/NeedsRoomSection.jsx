import { useMemo, useState } from 'react'
import { FiHome } from 'react-icons/fi'
import { assignRoomLine } from '../../services'
import { roomCandidatesForLine, fmtDateShort } from '../../utils/bookingHelpers'
import { getUnassignedLines } from '../../utils/roomStatus'
import { CATEGORY_LABEL_AR } from '../../constants'
import Button from '../../components/Button'
import DeleteBookingButton from '../../components/DeleteBookingButton'
import Modal from '../../components/Modal'
import Picker from '../../components/Picker'
import { useGuardWhile } from '../../hooks/useNavGuard'
import BookingDetailsModal from './BookingDetailsModal'
import QueueCard, { QueueRow } from './QueueCard'

function tsMillis(v) {
  if (!v) return 0
  if (v.toDate) return v.toDate().getTime()
  const d = new Date(v)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

const SORTS = {
  newest:  (a, b) => tsMillis(b.booking.createdAt) - tsMillis(a.booking.createdAt),
  oldest:  (a, b) => tsMillis(a.booking.createdAt) - tsMillis(b.booking.createdAt),
  checkin: (a, b) => String(a.line.checkIn).localeCompare(String(b.line.checkIn)),
}

// Already-approved bookings that just need a physical room — pending ones
// live in PendingApprovalSection instead, since those need a decision first,
// not a room. Website bookings arrive with a room TYPE but no physical room,
// so without this list they'd have no tile of their own in the grid and be
// invisible to staff. "اختيار غرفة" is the same pick-from-a-list step used
// everywhere else a room is chosen. Green tone: the "already okay" side of
// the pair, red being "not yet approved".
export default function NeedsRoomSection({ bookings, rooms, bookingActions }) {
  const [sort, setSort] = useState('newest')
  const [pickingFor, setPickingFor] = useState(null) // { booking, line }
  const [viewing, setViewing] = useState(null)
  useGuardWhile(!!pickingFor)

  const lines = useMemo(() => {
    return getUnassignedLines(bookings)
      .filter(({ booking }) => booking.status !== 'pending')
      .slice()
      .sort(SORTS[sort])
  }, [bookings, sort])

  if (!lines.length) return null

  return (
    <>
      <QueueCard
        tone="good"
        icon={<FiHome size={14} />}
        title={`${lines.length} حجوزات بحاجة لتعيين غرفة`}
        sort={sort} onSortChange={setSort}
      >
        {lines.map(({ booking, line }) => (
          <QueueRow
            key={`${booking.id}-${line.lineId}`}
            title={booking.guestName}
            onTitleClick={() => setViewing(booking)}
            subtitle={`${CATEGORY_LABEL_AR[line.roomType] || line.roomType} · ${booking.guestPhone} · ${fmtDateShort(line.checkIn)} ← ${fmtDateShort(line.checkOut)}`}
            action={
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="secondary" size="sm" onClick={() => setPickingFor({ booking, line })}>اختيار غرفة</Button>
                <DeleteBookingButton booking={booking} bookingActions={bookingActions} />
              </div>
            }
          />
        ))}
      </QueueCard>

      {pickingFor && (
        <AssignRoomModal
          booking={pickingFor.booking} line={pickingFor.line} rooms={rooms} bookings={bookings}
          bookingActions={bookingActions}
          onClose={() => setPickingFor(null)}
        />
      )}

      {viewing && (
        <BookingDetailsModal
          booking={viewing}
          bookingActions={bookingActions}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

function AssignRoomModal({ booking, line, rooms, bookings, bookingActions, onClose }) {
  const [pick, setPick] = useState('')
  const { runRooms, roomsBusy: busy } = bookingActions
  const candidates = roomCandidatesForLine(line, rooms, bookings, booking.id)
  const options = candidates.map(({ room, conflict, blocked }) => ({
    value: room.id,
    label: `غرفة ${room.number}`,
    hint: conflict ? (blocked ? 'محظورة في هذه الفترة' : 'محجوزة في هذه الفترة') : `${room.capacity} أشخاص`,
    disabled: conflict,
  }))

  const confirm = () => {
    if (!pick) return
    runRooms(() => assignRoomLine(booking.id, line.lineId, pick))
    onClose()
  }

  return (
    <Modal open title={`اختيار غرفة لـ ${booking.guestName}`} onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="primary" disabled={!pick || busy} onClick={confirm}>تأكيد الاختيار</Button>
      </>
    }>
      <Picker options={options} value={pick} onChange={setPick} emptyText="لا توجد غرف متاحة بهذه السعة في هذه الفترة" />
    </Modal>
  )
}
