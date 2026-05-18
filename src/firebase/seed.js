import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './config'

// ─── Two-collection model ─────────────────────────────────
//
//  variants/{slug}  — what the customer sees: name, description, images,
//                     amenities, beds, price. Five docs, one per
//                     (category, capacity) listing.
//
//  rooms/{room-XXX} — inventory only: number, type, capacity, active.
//                     Used by admin to pick a specific room when assigning
//                     and to track availability per physical unit.

const AMENITIES_EN = ['WiFi', 'Air Conditioning', 'TV', 'Kitchenette', 'Bathroom', 'Living Room', 'Balcony']
const AMENITIES_AR = ['واي فاي', 'مكيف هواء', 'تلفاز', 'مطبخ صغير', 'حمام', 'صالون', 'شرفة']

const AMENITIES_2BATH_EN = ['WiFi', 'Air Conditioning', 'TV', 'Kitchenette', '2 Bathrooms', 'Living Room', 'Balcony']
const AMENITIES_2BATH_AR = ['واي فاي', 'مكيف هواء', 'تلفاز', 'مطبخ صغير', 'حمامان', 'صالون', 'شرفة']

const IMG_FAMILY = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
]
const IMG_STANDARD = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
]

export const CATEGORIES = ['superub', 'premium', 'deluxe']

// ─── Variant inventory map ────────────────────────────────
// Maps each (type, capacity) variant to its set of physical rooms.
const ROOM_DEFS = [
  // Superub
  { number: '401', floor: 4, type: 'superub', capacity: 2 },
  { number: '101', floor: 1, type: 'superub', capacity: 5 },
  { number: '201', floor: 2, type: 'superub', capacity: 5 },
  { number: '301', floor: 3, type: 'superub', capacity: 5 },
  // Premium
  { number: '402', floor: 4, type: 'premium', capacity: 4 },
  { number: '403', floor: 4, type: 'premium', capacity: 4 },
  { number: '102', floor: 1, type: 'premium', capacity: 5 },
  { number: '202', floor: 2, type: 'premium', capacity: 5 },
  { number: '203', floor: 2, type: 'premium', capacity: 5 },
  { number: '302', floor: 3, type: 'premium', capacity: 5 },
  { number: '303', floor: 3, type: 'premium', capacity: 5 },
  // Deluxe
  { number: '204', floor: 2, type: 'deluxe',  capacity: 2 },
  { number: '304', floor: 3, type: 'deluxe',  capacity: 2 },
  { number: '404', floor: 4, type: 'deluxe',  capacity: 2 },
]

const SEED_ROOMS = ROOM_DEFS.map(({ number, floor, type, capacity }) => ({
  id: `room-${number}`,
  number, floor, type, capacity,
  active: true,
}))

// Each variant gathers metadata that previously lived on individual rooms.
// Admin edits these via the Variants tab in /admin.
export const SEED_VARIANTS = [
  {
    id: 'superub-2',
    type: 'superub', capacity: 2,
    nameAr: 'شقة سوبر — لشخصين',
    nameEn: 'Superub Apartment — for 2',
    descAr: 'شقة سوبر أنيقة لشخصين بغرفة نوم وصالون وحمام، تجمع بين الفخامة والراحة في إقامة هادئة.',
    descEn: 'An elegant Superub apartment for two with one bedroom, a living room and a bathroom — refined comfort in a serene setting.',
    bedsAr: 'سرير مزدوج',
    beds:   '1 Double Bed',
    images: IMG_STANDARD,
    amenities:   AMENITIES_EN,
    amenitiesAr: AMENITIES_AR,
    price:    null,
    currency: 'USD',
    featured: true,
    active:   true,
  },
  {
    id: 'superub-5',
    type: 'superub', capacity: 5,
    nameAr: 'شقة سوبر — لـ 5 أشخاص',
    nameEn: 'Superub Apartment — for 5',
    descAr: 'شقة سوبر فسيحة بغرفتي نوم وصالون وحمام، تتسع حتى ٥ أشخاص مع سرير مزدوج وثلاثة أسرة مفردة.',
    descEn: 'A spacious Superub apartment with two bedrooms, a living room and one bathroom — fits up to 5 with one double bed and three singles.',
    bedsAr: 'سرير مزدوج + ٣ أسرة مفردة',
    beds:   '1 Double Bed + 3 Single Beds',
    images: IMG_FAMILY,
    amenities:   AMENITIES_EN,
    amenitiesAr: AMENITIES_AR,
    price:    null,
    currency: 'USD',
    featured: false,
    active:   true,
  },
  {
    id: 'premium-4',
    type: 'premium', capacity: 4,
    nameAr: 'شقة بريميوم — لـ 4 أشخاص',
    nameEn: 'Premium Apartment — for 4',
    descAr: 'شقة بريميوم مريحة لأربعة أشخاص بغرفتي نوم وصالون، تشمل سريراً مزدوجاً وسريرين مفردين.',
    descEn: 'A comfortable Premium apartment for four with two bedrooms and a living room, featuring one double bed and two single beds.',
    bedsAr: 'سرير مزدوج + سريران مفردان',
    beds:   '1 Double Bed + 2 Single Beds',
    images: IMG_FAMILY,
    amenities:   AMENITIES_2BATH_EN,
    amenitiesAr: AMENITIES_2BATH_AR,
    price:    null,
    currency: 'USD',
    featured: true,
    active:   true,
  },
  {
    id: 'premium-5',
    type: 'premium', capacity: 5,
    nameAr: 'شقة بريميوم — لـ 5 أشخاص',
    nameEn: 'Premium Apartment — for 5',
    descAr: 'شقة بريميوم عائلية فسيحة بغرفتي نوم وصالون، تتسع حتى ٥ أشخاص مع سرير مزدوج وثلاثة أسرة مفردة.',
    descEn: 'A spacious Premium family apartment with two bedrooms and a living room — fits up to 5 with one double bed and three singles.',
    bedsAr: 'سرير مزدوج + ٣ أسرة مفردة',
    beds:   '1 Double Bed + 3 Single Beds',
    images: IMG_FAMILY,
    amenities:   AMENITIES_EN,
    amenitiesAr: AMENITIES_AR,
    price:    null,
    currency: 'USD',
    featured: false,
    active:   true,
  },
  {
    id: 'deluxe-2',
    type: 'deluxe', capacity: 2,
    nameAr: 'شقة ديلوكس — لشخصين',
    nameEn: 'Deluxe Apartment — for 2',
    descAr: 'شقة ديلوكس هادئة لشخصين بغرفة نوم وصالون وحمام، مصممة لإقامة دافئة وخاصة.',
    descEn: 'A cozy Deluxe apartment for two with one bedroom, a living room and a bathroom — designed for a warm, private stay.',
    bedsAr: 'سرير مزدوج',
    beds:   '1 Double Bed',
    images: IMG_STANDARD,
    amenities:   AMENITIES_EN,
    amenitiesAr: AMENITIES_AR,
    price:    null,
    currency: 'USD',
    featured: true,
    active:   true,
  },
]

export { SEED_ROOMS }

export async function seedRooms() {
  const now = Timestamp.now()
  await Promise.all([
    ...SEED_ROOMS.map(({ id, ...data }) =>
      setDoc(doc(db, 'rooms', id), { ...data, createdAt: now, updatedAt: now })
    ),
    ...SEED_VARIANTS.map(({ id, ...data }) =>
      setDoc(doc(db, 'variants', id), { ...data, createdAt: now, updatedAt: now })
    ),
  ])
  return { rooms: SEED_ROOMS.length, variants: SEED_VARIANTS.length }
}
