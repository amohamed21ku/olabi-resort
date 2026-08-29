import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, runTransaction,
} from 'firebase/firestore'
import { db } from './config'

export class RoomUnavailableError extends Error {
  constructor(message = 'ROOM_UNAVAILABLE') {
    super(message)
    this.name = 'RoomUnavailableError'
    this.code = 'ROOM_UNAVAILABLE'
  }
}

// A room's `blockedUntil` field (YYYY-MM-DD) marks the LAST night the room is
// unavailable. The block starts today and ends inclusive of that date. Stale
// blocks (past today) are treated as not-blocked so we don't have to sweep.
export function isRoomBlockedInRange(room, checkIn, checkOut) {
  if (!room?.blockedUntil) return false
  const blockEnd = new Date(room.blockedUntil)
  if (isNaN(blockEnd.getTime())) return false
  blockEnd.setDate(blockEnd.getDate() + 1)
  const today = new Date(new Date().toISOString().split('T')[0])
  const reqIn  = checkIn  instanceof Date ? checkIn  : new Date(checkIn)
  const reqOut = checkOut instanceof Date ? checkOut : new Date(checkOut)
  return today < reqOut && blockEnd > reqIn
}

export async function setRoomBlock(roomId, blockedUntil) {
  if (!roomId || !blockedUntil) throw new Error('INVALID_BLOCK_DATA')
  await updateDoc(doc(db, 'rooms', roomId), {
    blockedUntil,
    updatedAt: Timestamp.now(),
  })
}

export async function clearRoomBlock(roomId) {
  if (!roomId) throw new Error('INVALID_CLEAR_DATA')
  await updateDoc(doc(db, 'rooms', roomId), {
    blockedUntil: null,
    updatedAt: Timestamp.now(),
  })
}

// ─── WhatsApp config ──────────────────────────────────────
// Hotel's WhatsApp number (international format, no + or spaces)
const HOTEL_WHATSAPP = '963956883006'

// ─── Bookings ─────────────────────────────────────────────

// Format an integer booking number as a 4-digit string: 1 → "0001".
export function formatBookingNumber(n) {
  if (n == null) return ''
  return String(n).padStart(4, '0')
}

// Read the highest existing bookingNumber and return the next one.
// Concurrent calls may collide (rare for low-volume); doc IDs stay unique.
export async function getNextBookingNumber() {
  const snap = await getDocs(collection(db, 'bookings'))
  let max = 0
  snap.docs.forEach(d => {
    const n = d.data().bookingNumber
    if (typeof n === 'number' && n > max) max = n
  })
  return max + 1
}

// ─── Multi-room model ─────────────────────────────────────
// A booking holds a `rooms[]` array of room-lines. Booking-level checkIn/
// checkOut/totalPrice are DERIVED envelopes kept for existing lists & queries.
// `getBookingRooms` returns the array — synthesizing a single line from the old
// flat fields for legacy single-room bookings, so nothing needs migrating.

function roomLineId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function toDateStr(v) {
  const d = v?.toDate ? v.toDate() : (v ? new Date(v) : null)
  if (!d || isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

function nightsBetween(ci, co) {
  const a = new Date(ci), b = new Date(co)
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1
  return Math.max(1, Math.ceil((b - a) / 86400000))
}

function normalizeLine(r, booking, i) {
  const ci = toDateStr(r.checkIn ?? booking?.checkIn)
  const co = toDateStr(r.checkOut ?? booking?.checkOut)
  return {
    lineId:       r.lineId || `L${i}`,
    roomId:       r.roomId ?? null,
    roomNumber:   r.roomNumber ?? null,
    roomType:     r.roomType ?? null,
    roomCapacity: r.roomCapacity != null ? Number(r.roomCapacity) : null,
    roomNameAr:   r.roomNameAr ?? null,
    roomNameEn:   r.roomNameEn ?? null,
    checkIn:      ci,
    checkOut:     co,
    nights:       r.nights || nightsBetween(ci, co),
    price:        typeof r.price === 'number' ? r.price : null,
  }
}

export function getBookingRooms(booking) {
  if (!booking) return []
  if (Array.isArray(booking.rooms) && booking.rooms.length) {
    return booking.rooms.map((r, i) => normalizeLine(r, booking, i))
  }
  // Legacy single-room booking → one synthesized line.
  return [normalizeLine({
    lineId: 'legacy',
    roomId: booking.roomId ?? null,
    roomNumber: booking.roomNumber ?? null,
    roomType: booking.roomType ?? null,
    roomCapacity: booking.roomCapacity ?? null,
    roomNameAr: booking.roomNameAr ?? null,
    roomNameEn: booking.roomNameEn ?? null,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    price: booking.totalPrice ?? null,
  }, booking, 0)]
}

// Envelope fields recomputed from the room-lines on every write.
export function recomputeBookingAggregates(rooms) {
  const lines = (rooms || []).filter(Boolean)
  if (!lines.length) return { checkIn: null, checkOut: null, nights: 0, totalPrice: null }
  let minIn = null, maxOut = null, total = 0, hasPrice = false
  for (const r of lines) {
    const ci = toDateStr(r.checkIn), co = toDateStr(r.checkOut)
    if (ci && (!minIn  || ci < minIn))  minIn  = ci
    if (co && (!maxOut || co > maxOut)) maxOut = co
    if (typeof r.price === 'number') { total += r.price; hasPrice = true }
  }
  return {
    checkIn:   minIn,
    checkOut:  maxOut,
    nights:    minIn && maxOut ? nightsBetween(minIn, maxOut) : 0,
    totalPrice: hasPrice ? total : null,
  }
}

// True if `roomId` is occupied across [ci,co) by any active booking's room-line,
// excluding a specific (bookingId,lineId) line when reassigning/editing it.
export function roomLineConflict(allBookings, roomId, ci, co, excludeBookingId = null, excludeLineId = null) {
  const reqIn = new Date(ci), reqOut = new Date(co)
  return (allBookings || []).some(b => {
    if (['cancelled', 'checked-out'].includes(b.status)) return false
    return getBookingRooms(b).some(line => {
      if (line.roomId !== roomId) return false
      if (b.id === excludeBookingId && line.lineId === excludeLineId) return false
      const lIn = new Date(line.checkIn), lOut = new Date(line.checkOut)
      return lIn < reqOut && lOut > reqIn
    })
  })
}

async function fetchAllBookings() {
  const snap = await getDocs(collection(db, 'bookings'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Read a booking, transform its room-lines, write back array + recomputed
// envelope. `transform(rooms, booking, tx)` may do additional tx.get reads
// (all before the single write) and returns the new rooms array.
async function mutateBookingRooms(bookingId, transform) {
  if (!bookingId) throw new Error('INVALID_BOOKING_DATA')
  const bookingRef = doc(db, 'bookings', bookingId)
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists()) throw new Error('BOOKING_NOT_FOUND')
    const booking = { id: snap.id, ...snap.data() }
    const rooms = getBookingRooms(booking)
    const newRooms = await transform(rooms, booking, tx)
    const agg = recomputeBookingAggregates(newRooms)
    tx.update(bookingRef, {
      rooms:      newRooms,
      checkIn:    agg.checkIn,
      checkOut:   agg.checkOut,
      nights:     agg.nights,
      totalPrice: agg.totalPrice,
      // Clear the legacy flat room pointer — the array is now the source of truth.
      roomId:     null,
      roomNumber: null,
      updatedAt:  Timestamp.now(),
    })
    return newRooms
  })
}

// Create a booking carrying a `rooms[]` array. Each line may be assigned
// (roomId set) or variant-only (roomId null, to be assigned later). Validates
// availability per line for its own window.
export async function createBooking(bookingData) {
  const { checkIn, checkOut } = bookingData
  let rooms = Array.isArray(bookingData.rooms) && bookingData.rooms.length
    ? bookingData.rooms
    : getBookingRooms(bookingData)   // accept legacy single-room payloads too

  rooms = rooms.map((r, i) => normalizeLine(r, bookingData, i)).map(r => ({ ...r, lineId: r.lineId && r.lineId !== 'legacy' ? r.lineId : roomLineId() }))
  if (!rooms.length) throw new Error('INVALID_BOOKING_DATA')
  for (const r of rooms) {
    if (!(new Date(r.checkIn) < new Date(r.checkOut))) throw new Error('INVALID_DATES')
    if (!r.roomId && !(r.roomType && r.roomCapacity)) throw new Error('INVALID_BOOKING_DATA')
  }

  const all = await fetchAllBookings()
  // Assigned lines: check the concrete room is free. Unassigned lines: check the
  // variant still has inventory for that window — accounting for earlier lines in
  // THIS payload that ask for the same variant+window (so N identical rooms need
  // N units free).
  for (let idx = 0; idx < rooms.length; idx++) {
    const r = rooms[idx]
    if (r.roomId) {
      if (roomLineConflict(all, r.roomId, r.checkIn, r.checkOut)) throw new RoomUnavailableError()
    } else {
      const remaining = await countAvailableUnitsForVariant(r.roomType, r.roomCapacity, r.checkIn, r.checkOut)
      const priorSame = rooms.slice(0, idx).filter(x =>
        !x.roomId && x.roomType === r.roomType && Number(x.roomCapacity) === Number(r.roomCapacity)
        && x.checkIn === r.checkIn && x.checkOut === r.checkOut).length
      if (remaining - priorSame <= 0) throw new RoomUnavailableError()
    }
  }

  const agg = recomputeBookingAggregates(rooms)
  const bookingRef = doc(collection(db, 'bookings'))
  const bookingNumber = await getNextBookingNumber()
  const { rooms: _drop, roomId: _r, roomNumber: _n, roomType: _t, roomCapacity: _c, ...rest } = bookingData

  await runTransaction(db, async (tx) => {
    tx.set(bookingRef, {
      ...rest,
      rooms,
      checkIn:    agg.checkIn ?? checkIn,
      checkOut:   agg.checkOut ?? checkOut,
      nights:     agg.nights,
      totalPrice: agg.totalPrice,
      bookingNumber,
      status: bookingData.status || 'pending',
      createdAt: Timestamp.now(),
    })
  })
  return { id: bookingRef.id, bookingNumber }
}

// Returns how many rooms matching the exact (type, capacity) variant are
// still free across the requested window. Used by the customer booking UI
// and by createBooking to guard the write. Capacity must match exactly —
// a Superub-5 booking cannot be filled by a Superub-2 room.
export async function countAvailableUnitsForVariant(roomType, roomCapacity, checkIn, checkOut) {
  if (!roomType || !roomCapacity || !checkIn || !checkOut) return 0
  const reqIn  = new Date(checkIn)
  const reqOut = new Date(checkOut)
  if (!(reqIn < reqOut)) return 0

  const [roomsSnap, bookings] = await Promise.all([
    getDocs(query(collection(db, 'rooms'), where('type', '==', roomType))),
    fetchAllBookings(),
  ])

  const rooms = roomsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.active !== false && Number(r.capacity) === Number(roomCapacity))

  if (rooms.length === 0) return 0

  // Every active room-line overlapping the window (across all bookings).
  const lines = []
  for (const b of bookings) {
    if (['cancelled', 'checked-out'].includes(b.status)) continue
    for (const line of getBookingRooms(b)) {
      const lIn = new Date(line.checkIn), lOut = new Date(line.checkOut)
      if (lIn < reqOut && lOut > reqIn) lines.push(line)
    }
  }

  const bookedIds = new Set(lines.filter(l => l.roomId).map(l => l.roomId))
  const blocked   = rooms.filter(r =>
    bookedIds.has(r.id) || isRoomBlockedInRange(r, reqIn, reqOut)
  ).length

  // Unassigned lines for the same variant each consume one unit.
  const unassigned = lines.filter(l =>
    !l.roomId
    && l.roomType === roomType
    && Number(l.roomCapacity) === Number(roomCapacity)
  ).length

  return Math.max(0, rooms.length - blocked - unassigned)
}

// ─── Folio: payments & extra charges ──────────────────────
// A booking carries two optional arrays: `payments` (money received) and
// `charges` (extra bills added to the room, e.g. the restaurant). The room
// cost stays in `totalPrice`. Everything below is DERIVED — never stored —
// so it can never drift out of sync with the arrays.
//
// Money is tracked as TWO separate ledgers so paying for the room is kept
// distinct from paying for extras (restaurant, café…):
//   • room   — pays down the room price (deposits, the rest on arrival,
//              extra nights when a stay is extended). Payments with no
//              `ledger` field are treated as room payments (legacy/deposit).
//   • extras — pays down the `charges` (the restaurant bill, etc.).
export function computeBookingFinance(booking) {
  const roomTotal = Number(booking?.totalPrice) || 0
  const charges   = Array.isArray(booking?.charges)  ? booking.charges  : []
  const payments  = Array.isArray(booking?.payments) ? booking.payments : []
  const chargesTotal = charges.reduce((s, c) => s + (Number(c?.amount) || 0), 0)

  const roomPaid   = payments
    .filter(p => (p?.ledger || 'room') === 'room')
    .reduce((s, p) => s + (Number(p?.amount) || 0), 0)
  const extrasPaid = payments
    .filter(p => p?.ledger === 'extras')
    .reduce((s, p) => s + (Number(p?.amount) || 0), 0)

  const paidTotal     = roomPaid + extrasPaid
  const grandTotal    = roomTotal + chargesTotal
  const roomBalance   = roomTotal - roomPaid
  const extrasBalance = chargesTotal - extrasPaid
  const balance       = grandTotal - paidTotal

  let paymentStatus = 'unpaid'
  if (grandTotal > 0 && paidTotal >= grandTotal) paymentStatus = 'paid'
  else if (paidTotal > 0) paymentStatus = 'partial'

  return {
    roomTotal, chargesTotal, grandTotal,
    roomPaid, extrasPaid, paidTotal,
    roomBalance, extrasBalance, balance,
    paymentStatus,
  }
}

// Set (or clear, when price is '' / null) the room price on a booking.
export async function updateBookingRoomPrice(bookingId, price) {
  if (!bookingId) throw new Error('INVALID_FOLIO_DATA')
  const val = (price === '' || price == null) ? null : Number(price)
  if (val != null && !(val >= 0)) throw new Error('INVALID_AMOUNT')
  await updateDoc(doc(db, 'bookings', bookingId), { totalPrice: val, updatedAt: Timestamp.now() })
}

// Short, collision-resistant id for a folio line (client-generated).
function folioLineId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Append a folio line to `field` ('charges' | 'payments') inside a transaction
// so two staff adding at once can't clobber each other's array.
async function appendFolioLine(bookingId, field, line) {
  if (!bookingId) throw new Error('INVALID_FOLIO_DATA')
  if (!(Number(line?.amount) > 0)) throw new Error('INVALID_AMOUNT')
  const bookingRef = doc(db, 'bookings', bookingId)
  const entry = { ...line, id: folioLineId(), amount: Number(line.amount), at: Timestamp.now() }
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists()) throw new Error('BOOKING_NOT_FOUND')
    const existing = Array.isArray(snap.data()[field]) ? snap.data()[field] : []
    tx.update(bookingRef, { [field]: [...existing, entry], updatedAt: Timestamp.now() })
    return entry
  })
}

async function removeFolioLine(bookingId, field, lineId) {
  if (!bookingId || !lineId) throw new Error('INVALID_FOLIO_DATA')
  const bookingRef = doc(db, 'bookings', bookingId)
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists()) throw new Error('BOOKING_NOT_FOUND')
    const existing = Array.isArray(snap.data()[field]) ? snap.data()[field] : []
    tx.update(bookingRef, { [field]: existing.filter(l => l.id !== lineId), updatedAt: Timestamp.now() })
  })
}

export function addBookingCharge(bookingId, { label, amount, category }) {
  return appendFolioLine(bookingId, 'charges', {
    label: (label || '').trim() || 'رسم',
    amount,
    category: category || 'other',
  })
}

export function removeBookingCharge(bookingId, chargeId) {
  return removeFolioLine(bookingId, 'charges', chargeId)
}

export function addBookingPayment(bookingId, { amount, method, note, ledger }) {
  return appendFolioLine(bookingId, 'payments', {
    amount,
    method: method || 'cash',
    note: (note || '').trim(),
    ledger: ledger === 'extras' ? 'extras' : 'room',
  })
}

export function removeBookingPayment(bookingId, paymentId) {
  return removeFolioLine(bookingId, 'payments', paymentId)
}

export async function getBookingById(bookingId) {
  const snap = await getDoc(doc(db, 'bookings', bookingId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Guest-contact-level fields — separate from the room-line editing in
// mutateBookingRooms/updateBookingRoomLine, since these don't touch rooms[]
// or the derived checkIn/checkOut/nights/totalPrice aggregates at all.
export async function updateBookingGuestInfo(bookingId, { guestName, guestPhone, guestEmail, guests, notes }) {
  if (!bookingId) throw new Error('INVALID_BOOKING_DATA')
  const data = { updatedAt: Timestamp.now() }
  if (guestName != null)  data.guestName  = guestName.trim()
  if (guestPhone != null) data.guestPhone = guestPhone.trim()
  if (guestEmail != null) data.guestEmail = guestEmail.trim()
  if (guests != null)     data.guests     = Number(guests) || 1
  if (notes != null)      data.notes      = notes.trim()
  await updateDoc(doc(db, 'bookings', bookingId), data)
}

export async function getBookingsForRoom(roomId) {
  const bookings = await fetchAllBookings()
  return bookings.filter(b =>
    !['cancelled', 'checked-out'].includes(b.status)
    && getBookingRooms(b).some(r => r.roomId === roomId)
  )
}

export async function getAllBookings() {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, 'bookings', bookingId), { status })
}

// ─── Front-desk: check-in / check-out ─────────────────────
// Mark a guest as arrived. Requires a concrete room to be assigned first
// (you can't hand over a key to an unassigned booking). Stamps checkedInAt.
export async function checkInBooking(bookingId) {
  if (!bookingId) throw new Error('INVALID_BOOKING_DATA')
  const bookingRef = doc(db, 'bookings', bookingId)
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists()) throw new Error('BOOKING_NOT_FOUND')
    const b = { id: snap.id, ...snap.data() }
    if (!getBookingRooms(b).some(r => r.roomId)) throw new Error('NO_ROOM_ASSIGNED')
    tx.update(bookingRef, {
      status: 'checked-in',
      checkedInAt: b.checkedInAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  })
}

// Mark a guest as departed. The balance guard lives in the UI (the receptionist
// is warned about any outstanding amount before confirming); here we just record
// the departure and free the room for the next stay. `checkedOutAt` may be an
// explicit departure time (Date or parseable string); defaults to now.
export async function checkOutBooking(bookingId, checkedOutAt = null) {
  if (!bookingId) throw new Error('INVALID_BOOKING_DATA')
  let ts = Timestamp.now()
  if (checkedOutAt) {
    const d = new Date(checkedOutAt)
    if (!isNaN(d.getTime())) ts = Timestamp.fromDate(d)
  }
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'checked-out',
    checkedOutAt: ts,
    updatedAt: Timestamp.now(),
  })
}

// ─── Room-line mutators (multi-room) ──────────────────────

// Add a room-line to a booking (assigned or variant-only). Defaults dates to
// the booking's envelope when not given.
export async function addBookingRoomLine(bookingId, data = {}) {
  return mutateBookingRooms(bookingId, (rooms, booking) => {
    const ci = toDateStr(data.checkIn ?? booking.checkIn)
    const co = toDateStr(data.checkOut ?? booking.checkOut)
    if (!(new Date(ci) < new Date(co))) throw new Error('INVALID_DATES')
    return [...rooms, {
      lineId:       roomLineId(),
      roomId:       data.roomId ?? null,
      roomNumber:   data.roomNumber ?? null,
      roomType:     data.roomType ?? null,
      roomCapacity: data.roomCapacity != null ? Number(data.roomCapacity) : null,
      roomNameAr:   data.roomNameAr ?? null,
      roomNameEn:   data.roomNameEn ?? null,
      checkIn:      ci,
      checkOut:     co,
      nights:       nightsBetween(ci, co),
      price:        data.price == null || data.price === '' ? null : Number(data.price),
    }]
  })
}

// Remove a room-line. A booking must keep at least one room (delete the whole
// booking instead of emptying it).
export async function removeBookingRoomLine(bookingId, lineId) {
  return mutateBookingRooms(bookingId, (rooms) => {
    if (rooms.length <= 1) throw new Error('LAST_ROOM')
    if (!rooms.some(r => r.lineId === lineId)) throw new Error('LINE_NOT_FOUND')
    return rooms.filter(r => r.lineId !== lineId)
  })
}

// Assign a concrete room to a room-line. Validates type/capacity match and that
// the room is free across that line's own window (excluding this line).
export async function assignRoomLine(bookingId, lineId, roomId) {
  if (!bookingId || !lineId || !roomId) throw new Error('INVALID_ASSIGN_DATA')
  const all = await fetchAllBookings()
  return mutateBookingRooms(bookingId, async (rooms, booking, tx) => {
    const idx = rooms.findIndex(r => r.lineId === lineId)
    if (idx < 0) throw new Error('LINE_NOT_FOUND')
    const line = rooms[idx]
    const roomSnap = await tx.get(doc(db, 'rooms', roomId))
    if (!roomSnap.exists()) throw new Error('ROOM_NOT_FOUND')
    const room = roomSnap.data()
    if (line.roomType && room.type && line.roomType !== room.type) throw new Error('TYPE_MISMATCH')
    if (line.roomCapacity && room.capacity && Number(line.roomCapacity) !== Number(room.capacity)) throw new Error('CAPACITY_MISMATCH')
    if (isRoomBlockedInRange(room, new Date(line.checkIn), new Date(line.checkOut))) throw new RoomUnavailableError()
    if (roomLineConflict(all, roomId, line.checkIn, line.checkOut, bookingId, lineId)) throw new RoomUnavailableError()
    const variantSnap = await tx.get(doc(db, 'variants', `${room.type}-${room.capacity}`))
    const variant = variantSnap.exists() ? variantSnap.data() : null
    const copy = rooms.slice()
    copy[idx] = {
      ...line,
      roomId,
      roomNumber: room.number ?? null,
      roomType:   room.type ?? line.roomType,
      roomCapacity: room.capacity != null ? Number(room.capacity) : line.roomCapacity,
      roomNameAr: variant?.nameAr ?? line.roomNameAr ?? null,
      roomNameEn: variant?.nameEn ?? line.roomNameEn ?? null,
    }
    return copy
  })
}

// Free the concrete room from a line, keeping its variant so it can be re-assigned.
export async function unassignRoomLine(bookingId, lineId) {
  return mutateBookingRooms(bookingId, (rooms) => {
    const idx = rooms.findIndex(r => r.lineId === lineId)
    if (idx < 0) throw new Error('LINE_NOT_FOUND')
    const copy = rooms.slice()
    copy[idx] = { ...copy[idx], roomId: null, roomNumber: null }
    return copy
  })
}

// Edit a room-line's dates, price, and/or room type. When dates change on an
// assigned line, re-checks the room is free; recomputes nights, and (unless
// an explicit price is given) re-prices from the variant × new nights.
// Changing the type clears any assigned physical room (roomId/roomNumber/
// roomNameAr/roomNameEn/roomCapacity) — a room booked under the old category
// doesn't necessarily fit the new one, so the line goes back to needing a
// room picked for it, same as if it had never been assigned (no conflict
// check needed here; that only happens when a *specific* room is chosen).
export async function updateBookingRoomLine(bookingId, lineId, patch = {}) {
  const all = await fetchAllBookings()
  return mutateBookingRooms(bookingId, async (rooms, booking, tx) => {
    const idx = rooms.findIndex(r => r.lineId === lineId)
    if (idx < 0) throw new Error('LINE_NOT_FOUND')
    const line = rooms[idx]
    const ci = patch.checkIn  != null ? toDateStr(patch.checkIn)  : line.checkIn
    const co = patch.checkOut != null ? toDateStr(patch.checkOut) : line.checkOut
    if (!(new Date(ci) < new Date(co))) throw new Error('INVALID_DATES')
    const datesChanged = ci !== line.checkIn || co !== line.checkOut
    if (line.roomId && datesChanged && roomLineConflict(all, line.roomId, ci, co, bookingId, lineId)) {
      throw new RoomUnavailableError()
    }
    const nights = nightsBetween(ci, co)
    const typeChanged = patch.roomType != null && patch.roomType !== line.roomType
    let price = line.price
    if (patch.price !== undefined) {
      price = patch.price === '' || patch.price == null ? null : Number(patch.price)
    } else if (datesChanged && !typeChanged && line.roomType && line.roomCapacity) {
      const vSnap = await tx.get(doc(db, 'variants', `${line.roomType}-${line.roomCapacity}`))
      const vp = vSnap.exists() ? vSnap.data().price : null
      if (typeof vp === 'number') price = vp * nights
    }
    const copy = rooms.slice()
    copy[idx] = {
      ...line, checkIn: ci, checkOut: co, nights, price,
      ...(typeChanged ? {
        roomType: patch.roomType, roomCapacity: null,
        roomId: null, roomNumber: null, roomNameAr: null, roomNameEn: null,
      } : {}),
    }
    return copy
  })
}

// Convenience: set the same check-in/check-out on every room-line.
export async function setBookingDatesAllRooms(bookingId, checkIn, checkOut) {
  const ci = toDateStr(checkIn), co = toDateStr(checkOut)
  if (!(new Date(ci) < new Date(co))) throw new Error('INVALID_DATES')
  const all = await fetchAllBookings()
  return mutateBookingRooms(bookingId, async (rooms, booking, tx) => {
    const out = []
    for (const line of rooms) {
      if (line.roomId && roomLineConflict(all, line.roomId, ci, co, bookingId, line.lineId)) {
        throw new RoomUnavailableError()
      }
      const nights = nightsBetween(ci, co)
      let price = line.price
      if (line.roomType && line.roomCapacity) {
        const vSnap = await tx.get(doc(db, 'variants', `${line.roomType}-${line.roomCapacity}`))
        const vp = vSnap.exists() ? vSnap.data().price : null
        if (typeof vp === 'number') price = vp * nights
      }
      out.push({ ...line, checkIn: ci, checkOut: co, nights, price })
    }
    return out
  })
}

// ─── Rooms (admin) ────────────────────────────────────────

export async function firestoreGetRooms() {
  const snap = await getDocs(collection(db, 'rooms'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number))
}

export async function firestoreGetRoomById(roomId) {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function firestoreSetRoom(id, data) {
  await setDoc(doc(db, 'rooms', id), data, { merge: true })
}

export async function firestoreUpdateRoom(id, data) {
  await updateDoc(doc(db, 'rooms', id), { ...data, updatedAt: Timestamp.now() })
}

export async function firestoreDeleteRoom(id) {
  await deleteDoc(doc(db, 'rooms', id))
}

// ─── Variants (admin) ─────────────────────────────────────

export async function firestoreGetVariants() {
  const snap = await getDocs(collection(db, 'variants'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function firestoreSetVariant(id, data) {
  await setDoc(doc(db, 'variants', id), { ...data, updatedAt: Timestamp.now() }, { merge: true })
}

export async function firestoreUpdateVariant(id, data) {
  await updateDoc(doc(db, 'variants', id), { ...data, updatedAt: Timestamp.now() })
}

// ─── WhatsApp notification ─────────────────────────────────

// Human-readable one-line-per-room summary for messages.
function roomLinesText(booking, language = 'ar') {
  const TYPE_AR = { superub: 'سوبر', premium: 'بريميوم', deluxe: 'ديلوكس' }
  const TYPE_EN = { superub: 'Superub', premium: 'Premium', deluxe: 'Deluxe' }
  const lines = getBookingRooms(booking)
  return lines.map(r => {
    const name = language === 'ar'
      ? (r.roomNameAr || TYPE_AR[r.roomType] || r.roomType || 'غرفة')
      : (r.roomNameEn || r.roomNameAr || TYPE_EN[r.roomType] || r.roomType || 'Room')
    const num = r.roomNumber ? ` (${r.roomNumber})` : (language === 'ar' ? ' — غير معيّنة' : ' — unassigned')
    return `• ${name}${num}`
  }).join('\n')
}

export function buildWhatsAppUrl(booking, language = 'ar') {
  const checkInStr  = new Date(booking.checkIn).toLocaleDateString(
    language === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
  const checkOutStr = new Date(booking.checkOut).toLocaleDateString(
    language === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  )
  const priceStr = booking.totalPrice != null ? `${booking.totalPrice}` : 'سيُحدد لاحقاً'
  const priceStrEn = booking.totalPrice != null ? `${booking.totalPrice}` : 'To be confirmed'

  const bookingRef = booking.bookingNumber != null
    ? `#${formatBookingNumber(booking.bookingNumber)}`
    : booking.bookingId

  const roomsAr = roomLinesText(booking, 'ar')
  const roomsEn = roomLinesText(booking, 'en')
  const roomCount = getBookingRooms(booking).length

  let message
  if (language === 'ar') {
    message =
      `*طلب حجز جديد - منتجع العلبي* 🏨\n\n` +
      `رقم الحجز: ${bookingRef}\n` +
      `${roomCount > 1 ? `الغرف (${roomCount}):` : 'الغرفة:'}\n${roomsAr}\n` +
      `الوصول: ${checkInStr}\n` +
      `المغادرة: ${checkOutStr}\n` +
      `عدد الليالي: ${nights}\n` +
      `الضيوف: ${booking.guests}\n\n` +
      `*معلومات الضيف*\n` +
      `الاسم: ${booking.guestName}\n` +
      `الهاتف: ${booking.guestPhone}\n` +
      `البريد: ${booking.guestEmail || 'لم يُذكر'}\n\n` +
      `الإجمالي: ${priceStr}\n\n` +
      `${booking.notes ? `ملاحظات: ${booking.notes}\n\n` : ''}` +
      `يرجى تأكيد الحجز.`
  } else {
    message =
      `*New Booking Request - Olabi Resort* 🏨\n\n` +
      `Booking ID: ${bookingRef}\n` +
      `${roomCount > 1 ? `Rooms (${roomCount}):` : 'Room:'}\n${roomsEn}\n` +
      `Check-in: ${checkInStr}\n` +
      `Check-out: ${checkOutStr}\n` +
      `Nights: ${nights}\n` +
      `Guests: ${booking.guests}\n\n` +
      `*Guest Info*\n` +
      `Name: ${booking.guestName}\n` +
      `Phone: ${booking.guestPhone}\n` +
      `Email: ${booking.guestEmail || 'Not provided'}\n\n` +
      `Total: ${priceStrEn}\n\n` +
      `${booking.notes ? `Notes: ${booking.notes}\n\n` : ''}` +
      `Please confirm this booking.`
  }

  return `https://wa.me/${HOTEL_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export function sendWhatsAppNotification(booking, language = 'ar') {
  const url = buildWhatsAppUrl(booking, language)
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─── Hiking event (مسار العم سيفاك) ───────────────────────
// All editable content lives in a single Firestore doc: siteContent/hike.
// This default is the seed/fallback used before an admin saves anything, and
// it ships the bundled hero/gallery photos so the page looks good out of the box.
export const HIKE_DOC = { col: 'siteContent', id: 'hike' }

export const DEFAULT_HIKE_CONTENT = {
  active: true,
  logoUrl: '/static/images/assets/hike/hike-logo.png',
  titleAr: 'مسار العم سيفاك',
  titleEn: "Uncle Sevak's Trail",
  taglineAr: 'طبيعة خلّابة على ارتفاعٍ شاهق',
  taglineEn: 'Breathtaking nature at soaring heights',
  introAr:
    'فكرته الأساسية الهروب من زحمة المدينة والضجة والغبرة واللجوء إلى الطبيعة. ' +
    'إحساس نقطة البداية والانطلاق من منتجع العلبي السياحي، ثم مغامرةٌ تصل إلى حدّ الريف.',
  introEn:
    'The idea is simple: escape the noise, crowds and dust of the city and return to nature. ' +
    'You set off from Olabi Resort, then an adventure carries you all the way to the countryside.',
  routeAr:
    'تبدأ الرحلة من منتجع العلبي السياحي مروراً بضيعة الغزالة، وصولاً إلى جبل النسر ' +
    'الذي يطلّ على ثلاث إطلالاتٍ ساحرة: جبل الأقرع، وضيعة تركية، والبحر.',
  routeEn:
    'The trail begins at Olabi Resort, passes through Al-Ghazala hamlet, and climbs to Eagle ' +
    'Mountain — which overlooks three enchanting views: Mount Aqra, a Turkish village, and the sea.',
  morningAr:
    'الرحلة الصباحية أجواء أكشن وغموض وصيد، واستخدام تركتور فلكلوري يقوده العم سيفاك بنفسه.',
  morningEn:
    'The morning trip is full of action, mystery and foraging — riding a folkloric tractor driven by Uncle Sevak himself.',
  eveningAr:
    'وفي المساء أضواء وهدوء ورحلةٌ تثقيفية على الارتفاع الشاهق، بين المناظر الجميلة والورود على طول الطريق.',
  eveningEn:
    'In the evening: lights, calm and an educational journey at high altitude, among beautiful scenery and wildflowers along the way.',
  highlights: [
    { ar: 'جبل الأقرع', en: 'Mount Aqra' },
    { ar: 'ضيعة تركية', en: 'A Turkish village' },
    { ar: 'إطلالة على البحر', en: 'A view of the sea' },
    { ar: 'مصوّر مرافق للرحلة', en: 'A photographer accompanies the trip' },
    { ar: 'تركتور فلكلوري', en: 'A folkloric tractor ride' },
  ],
  images: [
    '/static/images/assets/hike/hike-1.jpg',
    '/static/images/assets/hike/hike-2.jpg',
    '/static/images/assets/hike/hike-3.jpg',
    '/static/images/assets/hike/hike-4.jpg',
    '/static/images/assets/hike/hike-5.jpg',
    '/static/images/assets/hike/hike-6.jpg',
  ],
  residentsFree: true,
  priceExternal: null,
  priceCurrency: 'USD',
  priceNoteAr: 'دخول نزلاء المنتجع تلقائي ومجاني. للراغبين بالانضمام من خارج الفندق تكون المشاركة مدفوعة.',
  priceNoteEn: 'Resort guests join automatically and for free. Visitors from outside the hotel pay to take part.',
  upcoming: [],
}

export async function getHikeContent() {
  const snap = await getDoc(doc(db, HIKE_DOC.col, HIKE_DOC.id))
  if (!snap.exists()) return { ...DEFAULT_HIKE_CONTENT }
  return { ...DEFAULT_HIKE_CONTENT, ...snap.data() }
}

export async function saveHikeContent(data) {
  await setDoc(doc(db, HIKE_DOC.col, HIKE_DOC.id), {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true })
}

// A single lightweight write — no pre-read of the collection (which would be
// slow and, under our rules, denied for the public visitor submitting). The
// caller can fire this without awaiting; the persistent cache queues the write
// and syncs it in the background, so the form feels instant on slow networks.
export async function createHikeApplication(data) {
  if (!data?.name || !data?.phone) throw new Error('INVALID_APPLICATION_DATA')
  const ref = await addDoc(collection(db, 'hikeApplications'), {
    name:      data.name.trim(),
    phone:     data.phone.trim(),
    email:     data.email?.trim() || '',
    partySize: Number(data.partySize) || 1,
    isResident: !!data.isResident,
    eventDate: data.eventDate || '',
    notes:     data.notes?.trim() || '',
    status:    'pending',
    createdAt: Timestamp.now(),
  })
  return { id: ref.id }
}

// WhatsApp the applicant back to confirm their hike participation.
export function buildHikeCustomerWhatsAppUrl(application, content, language = 'ar') {
  const phone = normalizeCustomerPhone(application.phone)
  const title = language === 'ar'
    ? (content?.titleAr || 'مسار العم سيفاك')
    : (content?.titleEn || "Uncle Sevak's Trail")
  const dateStr = application.eventDate
    ? new Date(application.eventDate).toLocaleDateString(
        language === 'ar' ? 'ar-SY' : 'en-GB',
        { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  let message
  if (language === 'ar') {
    message =
      `*منتجع العلبي — ${title}* 🥾\n\n` +
      `مرحباً ${application.name || ''}،\n` +
      `تم تأكيد مشاركتك في الرحلة.\n` +
      `${dateStr ? `الموعد: ${dateStr}\n` : ''}` +
      `عدد الأشخاص: ${application.partySize}\n\n` +
      `نتطلع لاستقبالك. لأي استفسار يرجى الرد على هذه الرسالة.`
  } else {
    message =
      `*Olabi Resort — ${title}* 🥾\n\n` +
      `Hello ${application.name || ''},\n` +
      `Your participation is confirmed.\n` +
      `${dateStr ? `Date: ${dateStr}\n` : ''}` +
      `Party size: ${application.partySize}\n\n` +
      `We look forward to welcoming you. Reply to this message for any questions.`
  }
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}

// Normalize phone to wa.me format: digits only, with country code.
// Heuristic: assume Syrian (+963) when the user enters a local 09xxx number,
// since the resort's customer base is Syria-first ([[project-olabi-audience]]).
export function normalizeCustomerPhone(raw) {
  if (!raw) return ''
  let digits = String(raw).replace(/[^\d]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10 && digits[1] === '9') {
    digits = '963' + digits.slice(1)
  }
  return digits
}

// The editable text of the booking-confirmation WhatsApp message — split out
// from buildCustomerWhatsAppUrl so the admin can show it in a textarea for
// the operator to tweak before it's sent, instead of only ever being able to
// fire off the canned message as-is.
export function buildCustomerConfirmMessage(booking, language = 'ar') {
  const checkInStr  = new Date(booking.checkIn?.toDate ? booking.checkIn.toDate() : booking.checkIn).toLocaleDateString(
    language === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
  const checkOutStr = new Date(booking.checkOut?.toDate ? booking.checkOut.toDate() : booking.checkOut).toLocaleDateString(
    language === 'ar' ? 'ar-SY' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
  const nights = booking.nights || Math.max(1, Math.ceil(
    ((booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut))
   - (booking.checkIn?.toDate  ? booking.checkIn.toDate()  : new Date(booking.checkIn))) / 86400000
  ))
  const priceStrAr = booking.totalPrice != null ? `${booking.totalPrice}` : 'سيُحدد لاحقاً'
  const priceStrEn = booking.totalPrice != null ? `${booking.totalPrice}` : 'To be confirmed'
  const ref = booking.bookingNumber != null
    ? `#${formatBookingNumber(booking.bookingNumber)}`
    : (booking.id || booking.bookingId || '')
  const roomsAr = roomLinesText(booking, 'ar')
  const roomsEn = roomLinesText(booking, 'en')
  const roomCount = getBookingRooms(booking).length

  let message
  if (language === 'ar') {
    message =
      `*منتجع العلبي* 🏨\n\n` +
      `مرحباً ${booking.guestName || ''}،\n` +
      `تم تأكيد حجزك. تفاصيل إقامتك:\n\n` +
      `رقم الحجز: ${ref}\n` +
      `${roomCount > 1 ? `الغرف (${roomCount}):` : 'الغرفة:'}\n${roomsAr}\n` +
      `الوصول: ${checkInStr}\n` +
      `المغادرة: ${checkOutStr}\n` +
      `عدد الليالي: ${nights}\n` +
      `الإجمالي: ${priceStrAr}\n\n` +
      `نتطلع لاستقبالك. لأي استفسار يرجى الرد على هذه الرسالة.`
  } else {
    message =
      `*Olabi Resort* 🏨\n\n` +
      `Hello ${booking.guestName || ''},\n` +
      `Your booking is confirmed. Stay details:\n\n` +
      `Booking ID: ${ref}\n` +
      `${roomCount > 1 ? `Rooms (${roomCount}):` : 'Room:'}\n${roomsEn}\n` +
      `Check-in: ${checkInStr}\n` +
      `Check-out: ${checkOutStr}\n` +
      `Nights: ${nights}\n` +
      `Total: ${priceStrEn}\n\n` +
      `We look forward to welcoming you. Reply to this message for any questions.`
  }

  return message
}

// Build a WhatsApp URL targeting the customer with a booking-confirmation
// message from the resort. Used by admin to confirm bookings with guests.
export function buildCustomerWhatsAppUrl(booking, language = 'ar') {
  const phone = normalizeCustomerPhone(booking.guestPhone)
  const message = buildCustomerConfirmMessage(booking, language)
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}

// Build a wa.me URL for arbitrary (already-edited) message text — used when
// the operator has customized the canned confirmation message before sending.
export function buildWhatsAppUrlForText(phone, text) {
  const normalized = normalizeCustomerPhone(phone)
  return normalized
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`
}
