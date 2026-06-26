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

export async function createBooking(bookingData) {
  const { roomId, roomType, roomCapacity, checkIn, checkOut } = bookingData
  if (!checkIn || !checkOut) throw new Error('INVALID_BOOKING_DATA')
  if (!roomId && !(roomType && roomCapacity)) throw new Error('INVALID_BOOKING_DATA')

  const reqIn  = new Date(checkIn)
  const reqOut = new Date(checkOut)
  if (!(reqIn < reqOut)) throw new Error('INVALID_DATES')

  const bookingRef = doc(collection(db, 'bookings'))
  const bookingNumber = await getNextBookingNumber()

  // ── Specific-room booking (admin flow / legacy) ──
  if (roomId) {
    const roomRef = doc(db, 'rooms', roomId)
    await runTransaction(db, async (tx) => {
      const roomSnap = await tx.get(roomRef)
      if (!roomSnap.exists()) throw new Error('ROOM_NOT_FOUND')
      if (isRoomBlockedInRange(roomSnap.data(), reqIn, reqOut)) throw new RoomUnavailableError()

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

  // ── Variant-only booking (customer flow) ──
  // The customer picked a specific (type, capacity) variant. Validate the
  // variant still has free inventory for the window so the admin has
  // something to assign.
  const remaining = await countAvailableUnitsForVariant(roomType, roomCapacity, checkIn, checkOut)
  if (remaining <= 0) throw new RoomUnavailableError()

  await runTransaction(db, async (tx) => {
    tx.set(bookingRef, {
      ...bookingData,
      roomId:     null,
      roomNumber: null,
      bookingNumber,
      status:     'pending',
      createdAt:  Timestamp.now(),
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

  const [roomsSnap, bookingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'rooms'), where('type', '==', roomType))),
    getDocs(collection(db, 'bookings')),
  ])

  const rooms = roomsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.active !== false && Number(r.capacity) === Number(roomCapacity))

  if (rooms.length === 0) return 0

  const overlapping = bookingsSnap.docs
    .map(d => d.data())
    .filter(b => !['cancelled', 'checked-out'].includes(b.status))
    .filter(b => {
      const bIn  = b.checkIn?.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
      const bOut = b.checkOut?.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
      return bIn < reqOut && bOut > reqIn
    })

  const bookedIds = new Set(overlapping.filter(b => b.roomId).map(b => b.roomId))
  const blocked   = rooms.filter(r =>
    bookedIds.has(r.id) || isRoomBlockedInRange(r, reqIn, reqOut)
  ).length

  // Unassigned bookings for the same variant each consume one unit.
  const unassigned = overlapping.filter(b =>
    !b.roomId
    && b.roomType === roomType
    && Number(b.roomCapacity) === Number(roomCapacity)
  ).length

  return Math.max(0, rooms.length - blocked - unassigned)
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

// Extend (or shorten) an existing booking's checkOut date.
// Validates the new range against other active bookings for the same room
// inside a transaction so concurrent admin actions can't double-book.
// Returns the new { nights, totalPrice } so callers can show feedback.
export async function extendBookingStay(bookingId, newCheckOut) {
  if (!bookingId || !newCheckOut) throw new Error('INVALID_EXTEND_DATA')
  const bookingRef = doc(db, 'bookings', bookingId)

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef)
    if (!snap.exists()) throw new Error('BOOKING_NOT_FOUND')
    const b = snap.data()

    const checkInDate = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn)
    const newOut      = new Date(newCheckOut)
    if (!(checkInDate < newOut)) throw new Error('INVALID_DATES')

    const others = await getDocs(query(
      collection(db, 'bookings'),
      where('roomId', '==', b.roomId),
    ))
    const conflict = others.docs.some(d => {
      if (d.id === bookingId) return false
      const o = d.data()
      if (['cancelled', 'checked-out'].includes(o.status)) return false
      const oIn  = o.checkIn?.toDate  ? o.checkIn.toDate()  : new Date(o.checkIn)
      const oOut = o.checkOut?.toDate ? o.checkOut.toDate() : new Date(o.checkOut)
      return oIn < newOut && oOut > checkInDate
    })
    if (conflict) throw new RoomUnavailableError()

    const nights = Math.max(1, Math.ceil((newOut - checkInDate) / 86400000))
    // Price now lives on the variant. Look it up by the booking's stored
    // (type, capacity); fall back to the existing totalPrice if no variant
    // doc is found (e.g. legacy admin-created bookings without those fields).
    let newTotal = b.totalPrice ?? null
    if (b.roomType && b.roomCapacity) {
      const variantId = `${b.roomType}-${b.roomCapacity}`
      const variantSnap = await tx.get(doc(db, 'variants', variantId))
      const variantPrice = variantSnap.exists() ? variantSnap.data().price : null
      if (typeof variantPrice === 'number') newTotal = variantPrice * nights
    }

    const checkOutStr = newOut.toISOString().split('T')[0]
    tx.update(bookingRef, {
      checkOut:   checkOutStr,
      nights,
      totalPrice: newTotal,
      updatedAt:  Timestamp.now(),
    })

    return { nights, totalPrice: newTotal, checkOut: checkOutStr }
  })
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

// Admin assigns a concrete room (e.g. 102) to an unassigned type-based
// booking. Validates that the chosen room has no overlapping booking for the
// stay window inside a transaction so two admins can't race-assign the same
// room to different guests.
export async function assignRoomToBooking(bookingId, roomId) {
  if (!bookingId || !roomId) throw new Error('INVALID_ASSIGN_DATA')
  const bookingRef = doc(db, 'bookings', bookingId)
  const roomRef    = doc(db, 'rooms', roomId)

  return await runTransaction(db, async (tx) => {
    const [bookingSnap, roomSnap] = await Promise.all([tx.get(bookingRef), tx.get(roomRef)])
    if (!bookingSnap.exists()) throw new Error('BOOKING_NOT_FOUND')
    if (!roomSnap.exists())    throw new Error('ROOM_NOT_FOUND')

    const b    = bookingSnap.data()
    const room = roomSnap.data()
    if (b.roomType && room.type && b.roomType !== room.type) throw new Error('TYPE_MISMATCH')
    if (b.roomCapacity && room.capacity && Number(b.roomCapacity) !== Number(room.capacity)) {
      throw new Error('CAPACITY_MISMATCH')
    }

    const bIn  = b.checkIn?.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
    const bOut = b.checkOut?.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
    if (isRoomBlockedInRange(room, bIn, bOut)) throw new RoomUnavailableError()

    // Rooms no longer carry display names — pull from the matching variant
    // so the bookings table and WhatsApp message render a friendly label.
    const variantId = `${room.type}-${room.capacity}`
    const variantSnap = await tx.get(doc(db, 'variants', variantId))
    const variant = variantSnap.exists() ? variantSnap.data() : null

    const others = await getDocs(query(
      collection(db, 'bookings'),
      where('roomId', '==', roomId),
    ))
    const conflict = others.docs.some(d => {
      if (d.id === bookingId) return false
      const o = d.data()
      if (['cancelled', 'checked-out'].includes(o.status)) return false
      const oIn  = o.checkIn?.toDate  ? o.checkIn.toDate()  : new Date(o.checkIn)
      const oOut = o.checkOut?.toDate ? o.checkOut.toDate() : new Date(o.checkOut)
      return oIn < bOut && oOut > bIn
    })
    if (conflict) throw new RoomUnavailableError()

    tx.update(bookingRef, {
      roomId,
      roomNumber: room.number ?? null,
      roomNameAr: variant?.nameAr ?? b.roomNameAr ?? null,
      roomNameEn: variant?.nameEn ?? b.roomNameEn ?? null,
      updatedAt:  Timestamp.now(),
    })
  })
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

  // Customer flow stores roomType + roomCapacity + null roomId; show the
  // variant instead of a specific room number.
  const TYPE_AR = { superub: 'سوبر', premium: 'بريميوم', deluxe: 'ديلوكس' }
  const TYPE_EN = { superub: 'Superub', premium: 'Premium', deluxe: 'Deluxe' }
  const variantAr = booking.roomType
    ? `${TYPE_AR[booking.roomType] || booking.roomType}${booking.roomCapacity ? ` — لـ ${booking.roomCapacity} أشخاص` : ''}`
    : ''
  const variantEn = booking.roomType
    ? `${TYPE_EN[booking.roomType] || booking.roomType}${booking.roomCapacity ? ` — for ${booking.roomCapacity} persons` : ''}`
    : ''
  const roomLineAr = booking.roomNumber
    ? `${booking.roomNameAr || ''} (${booking.roomNumber})`
    : `${booking.roomNameAr || variantAr}${variantAr && booking.roomNameAr && !booking.roomNameAr.includes(variantAr) ? ` — ${variantAr}` : ''}`
  const roomLineEn = booking.roomNumber
    ? `${booking.roomNameEn || ''} (${booking.roomNumber})`
    : `${booking.roomNameEn || variantEn}${variantEn && booking.roomNameEn && !booking.roomNameEn.includes(variantEn) ? ` — ${variantEn}` : ''}`

  let message
  if (language === 'ar') {
    message =
      `*طلب حجز جديد - منتجع العلبي* 🏨\n\n` +
      `رقم الحجز: ${bookingRef}\n` +
      `الغرفة: ${roomLineAr}\n` +
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
      `Room: ${roomLineEn}\n` +
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

// Read the highest existing applicationNumber and return the next one.
async function getNextHikeApplicationNumber() {
  const snap = await getDocs(collection(db, 'hikeApplications'))
  let max = 0
  snap.docs.forEach(d => {
    const n = d.data().applicationNumber
    if (typeof n === 'number' && n > max) max = n
  })
  return max + 1
}

export async function createHikeApplication(data) {
  if (!data?.name || !data?.phone) throw new Error('INVALID_APPLICATION_DATA')
  const applicationNumber = await getNextHikeApplicationNumber()
  const ref = await addDoc(collection(db, 'hikeApplications'), {
    name:      data.name.trim(),
    phone:     data.phone.trim(),
    email:     data.email?.trim() || '',
    partySize: Number(data.partySize) || 1,
    isResident: !!data.isResident,
    eventDate: data.eventDate || '',
    notes:     data.notes?.trim() || '',
    applicationNumber,
    status:    'pending',
    createdAt: Timestamp.now(),
  })
  return { id: ref.id, applicationNumber }
}

export function buildHikeWhatsAppUrl(application, language = 'ar') {
  const ref = application.applicationNumber != null
    ? `#${formatBookingNumber(application.applicationNumber)}`
    : ''
  const dateStr = application.eventDate
    ? new Date(application.eventDate).toLocaleDateString(
        language === 'ar' ? 'ar-SY' : 'en-GB',
        { year: 'numeric', month: 'long', day: 'numeric' })
    : (language === 'ar' ? 'لم يُحدد' : 'Not selected')

  let message
  if (language === 'ar') {
    message =
      `*طلب انضمام — مسار العم سيفاك (هايكنغ)* 🥾\n\n` +
      `رقم الطلب: ${ref}\n` +
      `الاسم: ${application.name}\n` +
      `الهاتف: ${application.phone}\n` +
      `البريد: ${application.email || 'لم يُذكر'}\n` +
      `عدد الأشخاص: ${application.partySize}\n` +
      `${application.isResident ? 'نزيل في المنتجع: نعم' : 'من خارج الفندق'}\n` +
      `تاريخ الرحلة: ${dateStr}\n` +
      `${application.notes ? `ملاحظات: ${application.notes}\n` : ''}` +
      `\nيرجى تأكيد المشاركة.`
  } else {
    message =
      `*Hiking Application — Uncle Sevak's Trail* 🥾\n\n` +
      `Application: ${ref}\n` +
      `Name: ${application.name}\n` +
      `Phone: ${application.phone}\n` +
      `Email: ${application.email || 'Not provided'}\n` +
      `Party size: ${application.partySize}\n` +
      `${application.isResident ? 'Resort guest: Yes' : 'From outside the hotel'}\n` +
      `Trip date: ${dateStr}\n` +
      `${application.notes ? `Notes: ${application.notes}\n` : ''}` +
      `\nPlease confirm participation.`
  }
  return `https://wa.me/${HOTEL_WHATSAPP}?text=${encodeURIComponent(message)}`
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

// Build a WhatsApp URL targeting the customer with a booking-confirmation
// message from the resort. Used by admin to confirm bookings with guests.
export function buildCustomerWhatsAppUrl(booking, language = 'ar') {
  const phone = normalizeCustomerPhone(booking.guestPhone)
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
  const priceStrAr = booking.totalPrice != null ? `$${booking.totalPrice}` : 'سيُحدد لاحقاً'
  const priceStrEn = booking.totalPrice != null ? `$${booking.totalPrice}` : 'To be confirmed'
  const ref = booking.bookingNumber != null
    ? `#${formatBookingNumber(booking.bookingNumber)}`
    : (booking.id || booking.bookingId || '')

  let message
  if (language === 'ar') {
    message =
      `*منتجع العلبي* 🏨\n\n` +
      `مرحباً ${booking.guestName || ''}،\n` +
      `تم تأكيد حجزك. تفاصيل إقامتك:\n\n` +
      `رقم الحجز: ${ref}\n` +
      `الغرفة: ${booking.roomNameAr} (${booking.roomNumber})\n` +
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
      `Room: ${booking.roomNameEn || booking.roomNameAr} (${booking.roomNumber})\n` +
      `Check-in: ${checkInStr}\n` +
      `Check-out: ${checkOutStr}\n` +
      `Nights: ${nights}\n` +
      `Total: ${priceStrEn}\n\n` +
      `We look forward to welcoming you. Reply to this message for any questions.`
  }

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}
