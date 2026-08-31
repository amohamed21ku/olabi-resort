const TONE_KEYS = ['good', 'warn', 'bad', 'muted', 'info']

// Resolves the actual --adm-tone-*-{bg,text,border} colors from the page's
// stylesheet (rather than hardcoding hex) so a print/PDF export — a
// brand-new document opened in its own tab with none of our stylesheets —
// still renders the same status-badge colors used everywhere in the admin.
// Shared by every PDF export button (CalendarSection, ReservationsReportPage)
// so they can never drift out of sync with each other or with StatusBadge.
export function readToneColors() {
  if (typeof document === 'undefined') return {}
  const cs = getComputedStyle(document.documentElement)
  return Object.fromEntries(TONE_KEYS.map(t => [t, {
    bg: cs.getPropertyValue(`--adm-tone-${t}-bg`).trim(),
    text: cs.getPropertyValue(`--adm-tone-${t}-text`).trim(),
    border: cs.getPropertyValue(`--adm-tone-${t}-border`).trim(),
  }]))
}
