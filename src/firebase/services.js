import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── WhatsApp config ──────────────────────────────────────
// Replace with the hotel's WhatsApp number (international format, no + or spaces)
const HOTEL_WHATSAPP = '963XXXXXXXXX'

// ─── Bookings ─────────────────────────────────────────────

export async function createBooking(bookingData) {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    status: 'confirmed',
    createdAt: Timestamp.now(),
  })
  return docRef.id
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

export function sendWhatsAppNotification(booking, language = 'ar') {
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

  let message
  if (language === 'ar') {
    message =
      `🏨 *طلب حجز جديد - منتجع العلبي*\n\n` +
      `🔖 رقم الحجز: ${booking.bookingId}\n` +
      `🛏 الغرفة: ${booking.roomNameAr} (${booking.roomNumber})\n` +
      `📅 الوصول: ${checkInStr}\n` +
      `📅 المغادرة: ${checkOutStr}\n` +
      `🌙 عدد الليالي: ${nights}\n` +
      `👤 الضيوف: ${booking.guests}\n\n` +
      `👨‍💼 *معلومات الضيف*\n` +
      `الاسم: ${booking.guestName}\n` +
      `الهاتف: ${booking.guestPhone}\n` +
      `البريد: ${booking.guestEmail || 'لم يُذكر'}\n\n` +
      `💰 الإجمالي: ${priceStr}\n\n` +
      `${booking.notes ? `📝 ملاحظات: ${booking.notes}\n\n` : ''}` +
      `يرجى تأكيد الحجز.`
  } else {
    message =
      `🏨 *New Booking Request - Olabi Resort*\n\n` +
      `🔖 Booking ID: ${booking.bookingId}\n` +
      `🛏 Room: ${booking.roomNameEn} (${booking.roomNumber})\n` +
      `📅 Check-in: ${checkInStr}\n` +
      `📅 Check-out: ${checkOutStr}\n` +
      `🌙 Nights: ${nights}\n` +
      `👤 Guests: ${booking.guests}\n\n` +
      `👨‍💼 *Guest Info*\n` +
      `Name: ${booking.guestName}\n` +
      `Phone: ${booking.guestPhone}\n` +
      `Email: ${booking.guestEmail || 'Not provided'}\n\n` +
      `💰 Total: ${priceStrEn}\n\n` +
      `${booking.notes ? `📝 Notes: ${booking.notes}\n\n` : ''}` +
      `Please confirm this booking.`
  }

  const url = `https://wa.me/${HOTEL_WHATSAPP}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
