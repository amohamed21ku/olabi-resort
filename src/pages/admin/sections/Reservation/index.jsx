import { useNavigate } from 'react-router-dom'
import { FiBell, FiChevronLeft } from 'react-icons/fi'
import { occupiedRoomIdSet, bookingRoomsInfo } from '../../utils/bookingHelpers'
import PendingApprovalSection from './PendingApprovalSection'
import NeedsRoomSection from './NeedsRoomSection'

// Shared shell for every alert atop this landing page — same clickable,
// full-width block, just colored by `tone` (an --adm-tone-* pair already
// used for status badges elsewhere, so a new banner never needs a new color).
function NoticeBanner({ tone, icon, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`adm-notice-banner adm-notice-banner--${tone}`}>
      {icon}
      <span>{text}</span>
      <FiChevronLeft size={16} />
    </button>
  )
}

// A confirmed, fully-roomed guest due today or tomorrow — or overdue,
// having already passed their check-in date without being checked in —
// who hasn't arrived yet. The one thing on this landing page that's
// genuinely time-sensitive, so it gets a banner above everything else
// instead of waiting to be noticed inside "الوصول القادم" (which has no
// date cutoff and can run to dozens of rows, per UpcomingArrivalsPage).
// Overdue counts too, not just the two-day window, since in practice a
// booking that slips past its check-in date without a check-in click is
// exactly the kind of thing this banner exists to surface. Clicking it
// goes straight to that list to confirm/check the guest in.
function DueSoonBanner({ bookings, tomorrowStr }) {
  const navigate = useNavigate()
  const dayStr = v => {
    const dt = v?.toDate ? v.toDate() : (v ? new Date(v) : null)
    return dt && !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : ''
  }
  const dueSoon = bookings.filter(b =>
    b.status === 'confirmed'
    && !bookingRoomsInfo(b).anyUnassigned
    && dayStr(b.checkIn) <= tomorrowStr
  )

  if (!dueSoon.length) return null

  return (
    <NoticeBanner
      tone="info"
      icon={<FiBell size={16} />}
      text={`${dueSoon.length} حجوزات بانتظار تسجيل الوصول (اليوم أو متأخرة) — اضغط للتأكيد وتسجيل الوصول`}
      onClick={() => navigate('/admin/reservation/upcoming')}
    />
  )
}

// The same four front-desk numbers the old dashboard led with, kept — just
// as one compact line instead of four big cards, since they're a quick
// glance while the two queues below are where the actual work happens.
function MiniStats({ rooms, bookings, todayStr }) {
  const dayStr = v => {
    const dt = v?.toDate ? v.toDate() : (v ? new Date(v) : null)
    return dt && !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : ''
  }
  const active = b => !['cancelled', 'checked-out'].includes(b.status)

  const arrivals = bookings.filter(b => active(b) && b.status !== 'checked-in'
    && dayStr(b.checkIn) <= todayStr && dayStr(b.checkOut) > todayStr).length
  const inHouse = bookings.filter(b => b.status === 'checked-in')
  const departures = bookings.filter(b => b.status === 'checked-in' && dayStr(b.checkOut) <= todayStr).length
  const activeRooms = rooms.filter(r => r.active !== false).length
  const occupied = occupiedRoomIdSet(inHouse).size

  const items = [
    ['وصول اليوم', arrivals],
    ['داخل المنتجع', inHouse.length],
    ['مغادرة اليوم', departures],
    ['الإشغال', `${occupied}/${activeRooms}`],
  ]

  return (
    <div className="adm-mini-stats">
      {items.map(([label, value]) => (
        <div key={label} className="adm-mini-stats__item">
          <span className="adm-mini-stats__value">{value}</span>
          <span className="adm-mini-stats__label">{label}</span>
        </div>
      ))}
    </div>
  )
}

// The Reservation landing page: the two approval queues — what needs doing
// right now. Both the room directory ("الغرف") and the upcoming-arrivals
// list ("الوصول القادم") live on their own pages/routes, nested under this
// section in the main sidebar, instead of being squeezed onto this landing
// page — the arrivals list in particular has no natural upper bound (it
// accumulates every confirmed+roomed booking that hasn't been checked in
// yet), so it needs its own page with a search box, not a card here.
export default function ReservationSection({ rooms, bookings, bookingActions }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>لوحة الحجوزات</h2>
          <p>{new Date().toLocaleDateString('ar-SY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <DueSoonBanner bookings={bookings} tomorrowStr={tomorrowStr} />

      <MiniStats rooms={rooms} bookings={bookings} todayStr={todayStr} />

      <div className="adm-approval-grid">
        <PendingApprovalSection bookings={bookings} bookingActions={bookingActions} />
        <NeedsRoomSection bookings={bookings} rooms={rooms} bookingActions={bookingActions} />
      </div>
    </div>
  )
}
