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

export async function createBooking(bookingData) {
  const { roomId, checkIn, checkOut } = bookingData
  if (!roomId || !checkIn || !checkOut) throw new Error('INVALID_BOOKING_DATA')

  const reqIn  = new Date(checkIn)
  const reqOut = new Date(checkOut)
  if (!(reqIn < reqOut)) throw new Error('INVALID_DATES')

  const roomRef    = doc(db, 'rooms', roomId)
  const bookingRef = doc(collection(db, 'bookings'))
  const bookingNumber = await getNextBookingNumber()

  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef)
    if (!roomSnap.exists()) throw new Error('ROOM_NOT_FOUND')

    const snap = await getDocs(query(
      collection(db, 'bookings'),
      where('roomId', '==', roomId),
    ))
    const conflict = snap.docs.some(d => {
      const b = d.data()
      if (['cancelled', 'checked-out'].includes(b.status)) return false
      const bIn  = b.checkIn.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
      const bOut = b.checkOut.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
      return bIn < reqOut && bOut > reqIn
    })
    if (conflict) throw new RoomUnavailableError()

    tx.set(bookingRef, {
      ...bookingData,
      bookingNumber,
      status: 'pending',
      createdAt: Timestamp.now(),
    })
  })

  return { id: bookingRef.id, bookingNumber }
}

export async function getBookingById(bookingId) {
  const snap = await getDoc(doc(db, 'bookings', bookingId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getBookingsForRoom(roomId) {
  const q = query(
    collection(db, 'bookings'),
    where('roomId', '==', roomId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(b => !['cancelled', 'checked-out'].includes(b.status))
}

export async function getAllBookings() {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, 'bookings', bookingId), { status })
}

// Returns true if the room is available for the given date range
export async function checkAvailability(roomId, checkIn, checkOut) {
  const bookings = await getBookingsForRoom(roomId)
  const reqIn  = new Date(checkIn)
  const reqOut = new Date(checkOut)

  for (const b of bookings) {
    const bIn  = b.checkIn.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
    const bOut = b.checkOut.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
    if (bIn < reqOut && bOut > reqIn) return false
  }
  return true
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

// ─── WhatsApp notification ─────────────────────────────────

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
  const priceStr = booking.totalPrice != null ? `$${booking.totalPrice}` : 'سيُحدد لاحقاً'
  const priceStrEn = booking.totalPrice != null ? `$${booking.totalPrice}` : 'To be confirmed'

  const bookingRef = booking.bookingNumber != null
    ? `#${formatBookingNumber(booking.bookingNumber)}`
    : booking.bookingId

  let message
  if (language === 'ar') {
    message =
      `*طلب حجز جديد - منتجع العلبي* 🏨\n\n` +
      `رقم الحجز: ${bookingRef}\n` +
      `الغرفة: ${booking.roomNameAr} (${booking.roomNumber})\n` +
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
      `Room: ${booking.roomNameEn} (${booking.roomNumber})\n` +
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
