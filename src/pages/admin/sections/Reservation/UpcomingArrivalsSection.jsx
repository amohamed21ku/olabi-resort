import { useMemo, useState } from 'react'
import { FiLogIn } from 'react-icons/fi'
import { bookingRoomsInfo, roomsLabel, fmtDateShort } from '../../utils/bookingHelpers'
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

// Bookings that are fully done — approved AND roomed — but the guest hasn't
// physically arrived yet, so neither PendingApprovalSection nor
// NeedsRoomSection ever shows them. Without this list, a walk-in booking
// created directly on a room (NewBookingForm — already confirmed + roomed
// from the moment it's created) had no presence at all on this landing page;
// it only ever showed up by browsing into the room grid. Default sort is by
// nearest check-in so an overdue arrival naturally floats to the top.
export default function UpcomingArrivalsSection({ bookings, bookingActions }) {
  const [sort, setSort] = useState('checkin')
  const upcoming = useMemo(
    () => bookings
      .filter(b => b.status === 'confirmed' && !bookingRoomsInfo(b).anyUnassigned)
      .slice()
      .sort(SORTS[sort]),
    [bookings, sort]
  )

  if (!upcoming.length) return null

  return (
    <QueueCard
      tone="info"
      icon={<FiLogIn size={14} />}
      title={`${upcoming.length} حجوزات بانتظار الوصول`}
      sort={sort} onSortChange={setSort}
    >
      {upcoming.map(b => (
        <QueueRow
          key={b.id}
          title={b.guestName}
          subtitle={`${roomsLabel(b)} · ${fmtDateShort(b.checkIn)} ← ${fmtDateShort(b.checkOut)}`}
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="secondary" size="sm" icon={<FiLogIn size={13} />}
                disabled={bookingActions.stageBusy}
                onClick={() => bookingActions.checkIn(b)}
              >
                تسجيل الوصول
              </Button>
              <DeleteBookingButton booking={b} bookingActions={bookingActions} />
            </div>
          }
        />
      ))}
    </QueueCard>
  )
}
