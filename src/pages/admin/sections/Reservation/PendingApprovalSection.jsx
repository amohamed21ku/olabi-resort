import { useMemo, useState } from 'react'
import { FiClock, FiCheck } from 'react-icons/fi'
import { roomsLabel, fmtDateShort } from '../../utils/bookingHelpers'
import Button from '../../components/Button'
import DeleteBookingButton from '../../components/DeleteBookingButton'
import QueueCard, { QueueRow } from './QueueCard'

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
          subtitle={`${roomsLabel(b)} · ${fmtDateShort(b.checkIn)} ← ${fmtDateShort(b.checkOut)}`}
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="secondary" size="sm" icon={<FiCheck size={13} />}
                disabled={bookingActions.updating}
                onClick={() => bookingActions.changeStatus(b.id, 'confirmed')}
              >
                تأكيد
              </Button>
              <DeleteBookingButton booking={b} bookingActions={bookingActions} />
            </div>
          }
        />
      ))}
    </QueueCard>
  )
}
