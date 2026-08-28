// Shared labels/constants for the admin UI. Colors are expressed as a `tone`
// key (mapped to CSS classes in StatusBadge/PaymentStatusBadge) instead of raw
// hex, so every badge stays on the resort's palette defined in admin.css.

// Each status gets its own distinct tone (no two share a color) so the
// calendar tape-chart and status badges stay tellable apart at a glance —
// confirmed (booked but not yet arrived) is visually distinct from
// checked-in (guest physically in-house), which matters most in exactly the
// place they'd otherwise sit side by side: the calendar legend.
export const STATUS = {
  confirmed:     { label: 'مؤكد',   tone: 'info' },
  pending:       { label: 'معلق',   tone: 'warn' },
  'checked-in':  { label: 'وصل',    tone: 'good' },
  'checked-out': { label: 'غادر',   tone: 'muted' },
  cancelled:     { label: 'ملغى',   tone: 'bad' },
}

export const PAYMENT_STATUS = {
  paid:    { label: 'مدفوع بالكامل', tone: 'good' },
  partial: { label: 'مدفوع جزئياً',  tone: 'warn' },
  unpaid:  { label: 'غير مدفوع',      tone: 'bad' },
}

export const SOURCE_LABELS = {
  phone:     'هاتف',
  'walk-in': 'حضور شخصي',
  website:   'الموقع',
  referral:  'إحالة',
  other:     'أخرى',
}

export const CHARGE_CATEGORIES = [
  { value: 'restaurant',   label: 'مطعم' },
  { value: 'cafe',         label: 'كافيه' },
  { value: 'room-service', label: 'خدمة الغرف' },
  { value: 'other',        label: 'أخرى' },
]
export const CHARGE_CATEGORY_LABEL = Object.fromEntries(CHARGE_CATEGORIES.map(c => [c.value, c.label]))

export const PAYMENT_METHODS = [
  { value: 'cash',      label: 'نقد' },
  { value: 'sham-cash',  label: 'شام كاش' },
  { value: 'card',       label: 'بطاقة' },
]
export const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]))

export const CATEGORY_OPTIONS = [
  { value: 'superub', labelAr: 'سوبر' },
  { value: 'premium', labelAr: 'بريميوم' },
  { value: 'deluxe',  labelAr: 'ديلوكس' },
]
export const CATEGORY_LABEL_AR = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.labelAr]))
