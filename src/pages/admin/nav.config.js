import { FiHome, FiGrid, FiSettings, FiStar, FiLayers, FiCompass, FiBarChart2, FiLogIn } from 'react-icons/fi'

// Four top-level sections, each a real route. No persistent "new booking"
// CTA — a booking always starts from a specific room in the Reservation grid.
// Statistics is its own section (not folded into the room board) so the
// daily room-first workflow stays uncluttered while the aggregate numbers
// staff still want are one click away, not scrolled past on every visit.
export const NAV_ITEMS = [
  {
    id: 'reservation', label: 'الحجوزات', Icon: FiHome, path: '/admin/reservation',
    children: [
      { id: 'reservation-rooms',    label: 'الغرف',         Icon: FiLayers, path: '/admin/reservation/rooms' },
      { id: 'reservation-upcoming', label: 'الوصول القادم', Icon: FiLogIn,  path: '/admin/reservation/upcoming' },
    ],
  },
  { id: 'calendar', label: 'التقويم',     Icon: FiGrid,      path: '/admin/calendar' },
  { id: 'stats',    label: 'الإحصائيات', Icon: FiBarChart2, path: '/admin/stats' },
  { id: 'settings', label: 'الإعدادات',   Icon: FiSettings,  path: '/admin/settings' },
]

// Tiles inside the Settings hub — rarely-touched setup/config areas kept
// reachable but visually separated from the daily room board. Availability
// is intentionally not here: Calendar covers future-date checks, and
// blocking a room is now an action inside that room's own panel.
export const SETTINGS_TILES = [
  { id: 'categories', label: 'فئات الغرف',       desc: 'صور، مرافق، وأسعار فئات الغرف المعروضة للعملاء', Icon: FiStar,    path: '/admin/settings/categories' },
  { id: 'rooms',       label: 'الغرف',            desc: 'إدارة قائمة الغرف الفعلية في المنتجع',            Icon: FiLayers,  path: '/admin/settings/rooms' },
  { id: 'hike',        label: 'فعالية العم سيفاك', desc: 'محتوى صفحة الفعالية وطلبات المشاركة',            Icon: FiCompass, path: '/admin/settings/hike' },
]
