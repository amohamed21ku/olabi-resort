import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './config'

const ar = (s) => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])

const AMENITIES_EN = ['WiFi', 'Air Conditioning', 'TV', 'Kitchenette', 'Bathroom', 'Living Room', 'Balcony']
const AMENITIES_AR = ['واي فاي', 'مكيف هواء', 'تلفاز', 'مطبخ صغير', 'حمام', 'صالون', 'شرفة']

const AMENITIES_2BATH_EN = ['WiFi', 'Air Conditioning', 'TV', 'Kitchenette', '2 Bathrooms', 'Living Room', 'Balcony']
const AMENITIES_2BATH_AR = ['واي فاي', 'مكيف هواء', 'تلفاز', 'مطبخ صغير', 'حمامان', 'صالون', 'شرفة']

// Placeholder images (admin will replace with real photos)
const IMG_FAMILY = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
]
const IMG_STANDARD = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
]

// ─── 5-person rooms: 101,102,201,202,203,301,302,303 ──────
const ROOMS_5P = [
  { number: '101', floor: 1, featured: true },
  { number: '102', floor: 1, featured: false },
  { number: '201', floor: 2, featured: false },
  { number: '202', floor: 2, featured: false },
  { number: '203', floor: 2, featured: false },
  { number: '301', floor: 3, featured: false },
  { number: '302', floor: 3, featured: false },
  { number: '303', floor: 3, featured: false },
].map(({ number, floor, featured }) => ({
  id: `room-${number}`,
  number,
  floor,
  type: 'family',
  nameAr: `شقة ${ar(number)}`,
  nameEn: `Apartment ${number}`,
  descAr: 'شقة عائلية واسعة تضم غرفتين نوم وصالوناً وحماماً. تستوعب حتى ٥ أشخاص مع سرير مزدوج وثلاثة أسرة مفردة.',
  descEn: 'Spacious family apartment with two bedrooms, a living room, and one bathroom. Sleeps up to 5 guests with one double bed and three single beds.',
  price: null,
  currency: 'USD',
  capacity: 5,
  size: null,
  bedsAr: 'سرير مزدوج + ٣ أسرة مفردة',
  beds: '1 Double Bed + 3 Single Beds',
  images: IMG_FAMILY,
  amenities: AMENITIES_EN,
  amenitiesAr: AMENITIES_AR,
  featured,
  active: true,
}))

// ─── 4-person room 402: 2 bathrooms ──────────────────────
const ROOM_402 = {
  id: 'room-402',
  number: '402',
  floor: 4,
  type: 'family',
  nameAr: `شقة ${ar('402')}`,
  nameEn: 'Apartment 402',
  descAr: 'شقة عائلية مريحة لأربعة أشخاص تضم غرفتين نوم وصالوناً وحمامين. سرير مزدوج وسريرين مفردين.',
  descEn: 'Comfortable family apartment for four with two bedrooms, a living room, and two bathrooms. One double bed and two single beds.',
  price: null,
  currency: 'USD',
  capacity: 4,
  size: null,
  bedsAr: 'سرير مزدوج + سريران مفردان',
  beds: '1 Double Bed + 2 Single Beds',
  images: IMG_FAMILY,
  amenities: AMENITIES_2BATH_EN,
  amenitiesAr: AMENITIES_2BATH_AR,
  featured: true,
  active: true,
}

// ─── 4-person room 403: 1 bathroom ───────────────────────
const ROOM_403 = {
  id: 'room-403',
  number: '403',
  floor: 4,
  type: 'family',
  nameAr: `شقة ${ar('403')}`,
  nameEn: 'Apartment 403',
  descAr: 'شقة عائلية مريحة لأربعة أشخاص تضم غرفتين نوم وصالوناً وحماماً. سرير مزدوج وسريرين مفردين.',
  descEn: 'Comfortable family apartment for four with two bedrooms, a living room, and one bathroom. One double bed and two single beds.',
  price: null,
  currency: 'USD',
  capacity: 4,
  size: null,
  bedsAr: 'سرير مزدوج + سريران مفردان',
  beds: '1 Double Bed + 2 Single Beds',
  images: IMG_FAMILY,
  amenities: AMENITIES_EN,
  amenitiesAr: AMENITIES_AR,
  featured: false,
  active: true,
}

// ─── 2-person rooms: 204,304,401,404 ─────────────────────
const ROOMS_2P = [
  { number: '204', floor: 2 },
  { number: '304', floor: 3 },
  { number: '401', floor: 4 },
  { number: '404', floor: 4 },
].map(({ number, floor }) => ({
  id: `room-${number}`,
  number,
  floor,
  type: 'standard',
  nameAr: `شقة ${ar(number)}`,
  nameEn: `Apartment ${number}`,
  descAr: 'شقة مريحة لشخصين تضم غرفة نوم وصالوناً وحماماً. سرير مزدوج مريح لقضاء إقامة هادئة.',
  descEn: 'Cozy apartment for two with one bedroom, a living room, and a bathroom. Comfortable double bed for a peaceful stay.',
  price: null,
  currency: 'USD',
  capacity: 2,
  size: null,
  bedsAr: 'سرير مزدوج',
  beds: '1 Double Bed',
  images: IMG_STANDARD,
  amenities: AMENITIES_EN,
  amenitiesAr: AMENITIES_AR,
  featured: false,
  active: true,
}))

export const SEED_ROOMS = [...ROOMS_5P, ROOM_402, ROOM_403, ...ROOMS_2P]

export async function seedRooms() {
  const now = Timestamp.now()
  await Promise.all(
    SEED_ROOMS.map(({ id, ...data }) =>
      setDoc(doc(db, 'rooms', id), { ...data, createdAt: now, updatedAt: now })
    )
  )
  return SEED_ROOMS.length
}
