import { useMemo, useState } from 'react'
import { FiClock, FiCheck } from 'react-icons/fi'
import { fmtDateShort } from '../../utils/bookingHelpers'
import { getBookingRooms } from '../../services'
import { CATEGORY_LABEL_AR } from '../../constants'
import Button from '../../components/Button'
import DeleteBookingButton from '../../components/DeleteBookingButton'
import ConfirmBookingModal from './ConfirmBookingModal'
import BookingDetailsModal from './BookingDetailsModal'
import QueueCard, { QueueRow } from './QueueCard'

// The room type(s) the customer picked at booking time — worth showing here
// even though no physical room exists yet, since it's most of what a
// reviewer needs to judge the request (along with who's asking and when).
function roomTypeLabel(b) {
  const types = [...new Set(getBookingRooms(b).map(l => CATEGORY_LABEL_AR[l.roomType] || l.roomType).filter(Boolean))]
  return types.join('، ') || 'غير محدد'
}

function tsMillis(v) {
  if (!v) return 0
  if (v.toDate) return v.toDate().getTime()
  const d = new Date(v)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

const SORTS = {
  newest:  (a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt),
  oldest:  (a, b) => tsMillis(a.createdAt) - tsMillis(b.createdAt),
  checkin: (a, b) => String(a.checkIn).localeCompare(String(b.checkIn)),
}

// Bookings still waiting on staff review — nothing here has a physical room
// promised to it yet, whether or not one happens to already be picked, since
// the reservation itself isn't confirmed. Approving moves a booking straight
// into NeedsRoomSection (if still unassigned) or off both lists entirely (if
// a room was already chosen) — both are just live filters over the same
// bookings array, so nothing has to be manually "transferred". Red tone: this
// is the "not yet okay" side of the pair, green being "already approved".
export default function PendingApprovalSection({ bookings, bookingActions }) {
  const [sort, setSort] = useState('newest')
  const [confirming, setConfirming] = useState(null)
  const [viewing, setViewing] = useState(null)
  const pending = useMemo(
    () => bookings.filter(b => b.status === 'pending').slice().sort(SORTS[sort]),
    [bookings, sort]
  )

  if (!pending.length) return null

  return (
    <QueueCard
      tone="bad"
      icon={<FiClock size={14} />}
      title={`${pending.length} حجوزات بانتظار الموافقة`}
      sort={sort} onSortChange={setSort}
    >
      {pending.map(b => (
        <QueueRow
          key={b.id}
          title={b.guestName}
          onTitleClick={() => setViewing(b)}
          subtitle={`${roomTypeLabel(b)} · ${b.guestPhone} · ${fmtDateShort(b.checkIn)} ← ${fmtDateShort(b.checkOut)}`}
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="secondary" size="sm" icon={<FiCheck size={13} />}
                disabled={bookingActions.updating}
                onClick={() => setConfirming(b)}
              >
                تأكيد
              </Button>
              <DeleteBookingButton booking={b} bookingActions={bookingActions} />
            </div>
          }
        />
      ))}

      {confirming && (
        <ConfirmBookingModal
          booking={confirming}
          bookingActions={bookingActions}
          onClose={() => setConfirming(null)}
        />
      )}

      {viewing && (
        <BookingDetailsModal
          booking={viewing}
          bookingActions={bookingActions}
          onClose={() => setViewing(null)}
        />
      )}
    </QueueCard>
  )
}
