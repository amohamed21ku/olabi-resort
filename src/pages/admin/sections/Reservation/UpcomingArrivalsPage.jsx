import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogIn, FiSearch, FiDollarSign } from 'react-icons/fi'
import { bookingRoomsInfo, roomsLabel, fmtDateShort, bookingMatchesRoomSearch } from '../../utils/bookingHelpers'
import { getBookingRooms } from '../../services'
import Button from '../../components/Button'
import DeleteBookingButton from '../../components/DeleteBookingButton'
import EmptyState from '../../components/EmptyState'
import QueueCard, { QueueRow } from './QueueCard'
import BackToReservationsButton from './BackToReservationsButton'

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

// Its own page (reached from "الوصول القادم" nested under "الحجوزات" in the
// sidebar) rather than a card squeezed onto the Reservation landing page —
// same move already made for the room directory ("الغرف"). Bookings here are
// fully done — approved AND roomed — but the guest hasn't physically arrived
// yet, so neither the pending-approval nor needs-room queue ever shows them.
// Without this list, a walk-in booking created directly on a room
// (NewBookingForm — already confirmed + roomed from the moment it's created)
// had no presence anywhere except by browsing into the room grid room-by-room.
// A search box exists here (and not on the landing-page queues) because this
// list has no natural upper bound — it accumulates every booking that was
// never checked in, including ones whose stay window already passed.
export default function UpcomingArrivalsPage({ bookings, bookingActions }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('checkin')
  const [search, setSearch] = useState('')

  // Kept separate from the search-filtered list below so the price notice
  // always reflects the whole page, not whatever's currently searched for.
  const allConfirmed = useMemo(
    () => bookings.filter(b => b.status === 'confirmed' && !bookingRoomsInfo(b).anyUnassigned),
    [bookings]
  )
  const unpricedCount = useMemo(() => allConfirmed.filter(b => b.totalPrice == null).length, [allConfirmed])

  const upcoming = useMemo(
    () => allConfirmed
      .filter(b => bookingMatchesRoomSearch(b, search))
      .slice()
      .sort(SORTS[sort]),
    [allConfirmed, sort, search]
  )

  return (
    <div>
      <BackToReservationsButton />
      <div className="adm-section-header">
        <div>
          <h2>الوصول القادم</h2>
          <p>حجوزات مؤكدة وبها غرفة، بانتظار وصول الضيف وتسجيله.</p>
        </div>
      </div>

      {unpricedCount > 0 && (
        <div className="adm-notice-banner adm-notice-banner--warn" style={{ cursor: 'default' }}>
          <FiDollarSign size={16} />
          <span>{unpricedCount} من هذه الحجوزات بلا سعر محدد</span>
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
        <FiSearch size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input className="adm-input adm-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو رقم الغرفة..." />
      </div>

      {upcoming.length === 0 ? (
        <EmptyState icon={<FiLogIn size={26} />} text={search ? 'لا توجد نتائج مطابقة' : 'لا توجد حجوزات بانتظار الوصول'} />
      ) : (
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
              onTitleClick={() => navigate(`/admin/reservation/${getBookingRooms(b)[0]?.roomId}?bookingId=${b.id}`)}
              subtitle={`${roomsLabel(b)} · ${b.guestPhone} · ${fmtDateShort(b.checkIn)} ← ${fmtDateShort(b.checkOut)}`}
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
      )}
    </div>
  )
}
