// Room-first status resolution. Every function here is pure and reuses the
// exact per-line-covers-a-day logic already proven in CalendarSection.jsx —
// no new business logic, just reframed around "what is this room doing"
// instead of "what is this booking doing".
import { getBookingRooms, isRoomBlockedInRange } from '../services'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked-in']

function toStr(d) {
  const dt = d?.toDate ? d.toDate() : (d ? new Date(d) : null)
  return dt && !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : ''
}

// Every non-cancelled, non-checked-out room-line for a given room, each
// carrying its parent booking for convenience.
function activeLinesForRoom(room, bookings) {
  const out = []
  for (const b of bookings) {
    if (['cancelled', 'checked-out'].includes(b.status)) continue
    for (const line of getBookingRooms(b)) {
      if (line.roomId === room.id) out.push({ booking: b, line })
    }
  }
  return out
}

// One of: 'vacant' | 'occupied' | 'arriving-today' | 'blocked'.
// 'occupied' + a same-day checkout is flagged separately via `departingToday`
// so a tile can show both the base tone and a small "leaving today" badge.
export function computeRoomStatus(room, bookings, todayStr = toStr(new Date())) {
  const entries = activeLinesForRoom(room, bookings)
  const todays = entries.find(({ line }) => toStr(line.checkIn) <= todayStr && toStr(line.checkOut) > todayStr)

  if (todays) {
    const checkedIn = todays.booking.status === 'checked-in'
    return {
      status: checkedIn ? 'occupied' : 'arriving-today',
      departingToday: toStr(todays.line.checkOut) === todayStr,
      booking: todays.booking,
      line: todays.line,
    }
  }

  if (isRoomBlockedInRange(room, new Date(todayStr), new Date(new Date(todayStr).getTime() + 86400000))) {
    return { status: 'blocked', departingToday: false, booking: null, line: null }
  }

  return { status: 'vacant', departingToday: false, booking: null, line: null }
}

// What the room panel should focus on: the booking currently occupying the
// room, or (if vacant right now) the soonest upcoming one, or none.
export function getRoomFocusBooking(room, bookings, todayStr = toStr(new Date())) {
  const entries = activeLinesForRoom(room, bookings)

  const current = entries.find(({ line }) => toStr(line.checkIn) <= todayStr && toStr(line.checkOut) > todayStr)
  if (current) return { kind: 'current', booking: current.booking, line: current.line }

  const upcoming = entries
    .filter(({ line }) => toStr(line.checkIn) > todayStr)
    .sort((a, b) => toStr(a.line.checkIn).localeCompare(toStr(b.line.checkIn)))[0]
  if (upcoming) return { kind: 'upcoming', booking: upcoming.booking, line: upcoming.line }

  return { kind: 'none', booking: null, line: null }
}

// Active room-lines with no physical room assigned yet — website bookings
// waiting on staff to pick a room. These have no tile of their own, so the
// grid surfaces them in a separate queue instead of losing them from view.
export function getUnassignedLines(bookings) {
  const out = []
  for (const b of bookings) {
    if (!ACTIVE_STATUSES.includes(b.status)) continue
    for (const line of getBookingRooms(b)) {
      if (!line.roomId) out.push({ booking: b, line })
    }
  }
  return out.sort((a, b) => toStr(a.line.checkIn).localeCompare(toStr(b.line.checkIn)))
}
