// Pure helper functions for reading a booking's room-lines uniformly.
// Extracted verbatim from the old AdminPage.jsx (no behavior change).
import { getBookingRooms, isRoomBlockedInRange } from '../services'

export function bookingRoomsInfo(b) {
  const lines = getBookingRooms(b)
  return {
    lines,
    count: lines.length,
    numbers: lines.filter(l => l.roomId).map(l => l.roomNumber),
    anyUnassigned: lines.some(l => !l.roomId),
    hasAnyRoom: lines.some(l => l.roomId),
  }
}

export function roomsLabel(b) {
  const { lines, numbers, anyUnassigned } = bookingRoomsInfo(b)
  if (lines.length === 1) {
    const l = lines[0]
    return l.roomId ? `${l.roomNameAr || ''}${l.roomNumber ? ` #${l.roomNumber}` : ''}`.trim() : 'غير معيّنة'
  }
  const nums = numbers.join('، ')
  return `${lines.length} غرف${nums ? ` · ${nums}` : ''}${anyUnassigned ? ' · بعضها غير معيّن' : ''}`
}

export function bookingOccupiesRoom(b, roomId) {
  return getBookingRooms(b).some(l => l.roomId === roomId)
}

export function occupiedRoomIdSet(bookings) {
  const s = new Set()
  for (const b of bookings) {
    if (['cancelled', 'checked-out'].includes(b.status)) continue
    for (const l of getBookingRooms(b)) if (l.roomId) s.add(l.roomId)
  }
  return s
}

export function bookingMatchesRoomSearch(b, search) {
  if (!search) return true
  const q = search.toLowerCase()
  if (b.guestName?.toLowerCase().includes(q) || b.guestPhone?.includes(search)) return true
  return getBookingRooms(b).some(l =>
    String(l.roomNumber || '').includes(search)
    || (l.roomNameAr || '').includes(search)
    || (l.roomType || '').toLowerCase().includes(q)
  )
}

// Candidate concrete rooms for a room-line: same (type, capacity), flagged if
// blocked/occupied for the LINE's own window, and if it's the current room.
export function roomCandidatesForLine(line, rooms, bookings, bookingId) {
  const reqCap = Number(line.roomCapacity) || null
  const lIn = new Date(line.checkIn), lOut = new Date(line.checkOut)
  return rooms
    .filter(r => r.active !== false && r.type === line.roomType && (reqCap == null || Number(r.capacity) === reqCap))
    .map(r => {
      const isCurrent = r.id === line.roomId
      const conflict = bookings.some(o => {
        if (['cancelled', 'checked-out'].includes(o.status)) return false
        return getBookingRooms(o).some(ol => {
          if (ol.roomId !== r.id) return false
          if (o.id === bookingId && ol.lineId === line.lineId) return false
          return new Date(ol.checkIn) < lOut && new Date(ol.checkOut) > lIn
        })
      })
      const blocked = isRoomBlockedInRange(r, lIn, lOut)
      return { room: r, isCurrent, conflict: conflict || blocked, blocked }
    })
    .sort((a, b) => +a.room.number - +b.room.number)
}

// Current local date-time as a value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
export function nowLocalStr() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function fmtDateShort(d) {
  try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' }) }
  catch { return '—' }
}

export function fmtDateFull(d) {
  try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleDateString('ar-SY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '—' }
}

export function fmtDateTime(d) {
  try { return (d?.toDate ? d.toDate() : new Date(d)).toLocaleString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}
