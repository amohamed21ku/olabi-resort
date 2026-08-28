// Pure aggregation helpers for the Statistics page's trend charts. No React,
// no Firestore access — just array-in, chart-data-out, operating on the same
// `bookings` array already loaded by useAdminData().
import { getBookingRooms } from '../services'
import { STATUS, CATEGORY_LABEL_AR } from '../constants'

const AR_MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']

function toDate(d) {
  if (!d) return null
  const date = d?.toDate ? d.toDate() : new Date(d)
  return isNaN(date.getTime()) ? null : date
}

// Revenue grouped by the month the stay happens (checkIn), not the month it
// was booked — that's what shows seasonality/occupancy trends, which is what
// a resort manager actually wants from a "revenue over time" chart.
export function monthlyRevenue(bookings) {
  const buckets = new Map() // 'YYYY-MM' -> { label, value, sortKey }
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const date = toDate(b.checkIn) || toDate(b.createdAt)
    if (!date) continue
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const label = `${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`
    const entry = buckets.get(key) || { label, value: 0, sortKey: date.getFullYear() * 12 + date.getMonth() }
    entry.value += Number(b.totalPrice) || 0
    buckets.set(key, entry)
  }
  return [...buckets.values()].sort((a, b) => a.sortKey - b.sortKey).map(({ label, value }) => ({ label, value }))
}

// Count of bookings per status, in the canonical order/labels/colors already
// used for status badges everywhere else in the admin (src/pages/admin/constants.js).
export function statusBreakdown(bookings) {
  const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, 0]))
  for (const b of bookings) if (counts[b.status] != null) counts[b.status] += 1
  return Object.entries(STATUS)
    .map(([key, { label, tone }]) => ({ label, tone, value: counts[key] }))
    .filter(entry => entry.value > 0)
}

// Revenue and line-count per room category (superub/premium/deluxe), summed
// across each booking's individual room-lines (a booking can span more than
// one room, possibly in different categories).
export function revenueByCategory(bookings) {
  const totals = new Map() // roomType -> { value, count }
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    for (const line of getBookingRooms(b)) {
      if (!line.roomType) continue
      const entry = totals.get(line.roomType) || { value: 0, count: 0 }
      entry.value += Number(line.price) || 0
      entry.count += 1
      totals.set(line.roomType, entry)
    }
  }
  return [...totals.entries()]
    .map(([type, { value, count }]) => ({ label: CATEGORY_LABEL_AR[type] || type, value, count }))
    .filter(entry => entry.value > 0 || entry.count > 0)
}
