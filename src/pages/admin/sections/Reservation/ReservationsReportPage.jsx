import { useMemo, useRef, useState } from 'react'
import { FiChevronRight, FiChevronLeft, FiPrinter, FiFileText } from 'react-icons/fi'
import { formatBookingNumber } from '../../services'
import { roomsLabel } from '../../utils/bookingHelpers'
import { readToneColors } from '../../utils/printColors'
import { STATUS } from '../../constants'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'

const toStr = (d) => d.toISOString().split('T')[0]
const fmtCell = (d) => new Date(d).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })
const todayStr = () => toStr(new Date())

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfNextMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 1) }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1) }
function startOfNextYear(d) { return new Date(d.getFullYear() + 1, 0, 1) }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }
function addYears(d, n) { return new Date(d.getFullYear() + n, 0, 1) }

const PERIOD_TYPES = [
  { value: 'week', label: 'أسبوعي' },
  { value: 'month', label: 'شهري' },
  { value: 'year', label: 'سنوي' },
  { value: 'custom', label: 'مخصص' },
]

// A flat, printable list of reservations for a chosen period — deliberately
// different from CalendarSection's PDF export, which prints the room×day
// occupancy grid. This one is for records/reporting: every field a manager
// would want in a spreadsheet-like list, not a visual room chart. Reuses the
// exact same zero-dependency print mechanism (a blank tab + self-contained
// HTML + window.print()) that CalendarSection already proved out — the
// browser's own "Save as PDF" does the actual file, no PDF library needed.
export default function ReservationsReportPage({ bookings }) {
  const [periodType, setPeriodType] = useState('week')
  const [anchor, setAnchor] = useState(() => new Date(todayStr()))
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(toStr(addDays(new Date(todayStr()), 7)))
  const tableRef = useRef(null)

  // Resolved to concrete color strings (not left as .adm-badge / var(...))
  // because this table's outerHTML gets cloned straight into the exported
  // PDF tab, which has none of the app's stylesheets — same reasoning as
  // CalendarSection's own badge coloring.
  const toneColors = useMemo(readToneColors, [])

  // Range is always treated as half-open [start, end) — matches how a
  // checkOut date already works everywhere else in this app (the checkout
  // day itself isn't an occupied night), so "extends after" below only
  // flags a stay that runs past the period's end, not one ending exactly on it.
  const { rangeStart, rangeEnd, label } = useMemo(() => {
    if (periodType === 'week') {
      const start = new Date(anchor)
      const end = addDays(start, 7)
      return { rangeStart: start, rangeEnd: end, label: `${fmtCell(start)} – ${fmtCell(addDays(end, -1))}` }
    }
    if (periodType === 'month') {
      const start = startOfMonth(anchor)
      const end = startOfNextMonth(anchor)
      return { rangeStart: start, rangeEnd: end, label: anchor.toLocaleDateString('ar-SY', { month: 'long', year: 'numeric' }) }
    }
    if (periodType === 'year') {
      const start = startOfYear(anchor)
      const end = startOfNextYear(anchor)
      return { rangeStart: start, rangeEnd: end, label: anchor.toLocaleDateString('ar-SY', { year: 'numeric' }) }
    }
    // custom
    const start = new Date(customFrom)
    const end = addDays(new Date(customTo), 1) // customTo is entered inclusively
    return { rangeStart: start, rangeEnd: end, label: `${fmtCell(start)} – ${fmtCell(customTo)}` }
  }, [periodType, anchor, customFrom, customTo])

  const rows = useMemo(() => {
    const rs = toStr(rangeStart), re = toStr(rangeEnd)
    return bookings
      .filter(b => b.checkIn && b.checkOut)
      .filter(b => {
        const ci = b.checkIn?.toDate ? toStr(b.checkIn.toDate()) : String(b.checkIn).slice(0, 10)
        const co = b.checkOut?.toDate ? toStr(b.checkOut.toDate()) : String(b.checkOut).slice(0, 10)
        return ci < re && co > rs
      })
      .map(b => {
        const ci = b.checkIn?.toDate ? toStr(b.checkIn.toDate()) : String(b.checkIn).slice(0, 10)
        const co = b.checkOut?.toDate ? toStr(b.checkOut.toDate()) : String(b.checkOut).slice(0, 10)
        return {
          booking: b,
          ci, co,
          extendsBefore: ci < rs,
          extendsAfter: co > re,
        }
      })
      .sort((a, b) => a.ci.localeCompare(b.ci))
  }, [bookings, rangeStart, rangeEnd])

  const shift = (n) => setAnchor(a =>
    periodType === 'week' ? addDays(a, n * 7)
    : periodType === 'month' ? addMonths(a, n)
    : addYears(a, n)
  )

  const exportPdf = () => {
    const html = tableRef.current?.outerHTML || ''
    const w = window.open('', '_blank')
    if (!w) { window.alert('يرجى السماح بالنوافذ المنبثقة لتصدير PDF'); return }
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير الحجوزات — ${label}</title>
      <style>
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; font-family:'Cairo','Segoe UI',Arial,sans-serif; }
        body{ margin:18px; color:#1C1C14; }
        h1{ font-size:17px; margin:0 0 3px; }
        p.sub{ color:#7A7860; font-size:12px; margin:0 0 14px; }
        table{ width:100%; border-collapse:collapse; }
        th,td{ border:1px solid #DDD0B8; padding:6px 8px; font-size:11px; text-align:center; vertical-align:middle; }
        th{ background:#F5EBD9; }
        @page{ size:portrait; margin:15mm; }
      </style></head><body>
      <h1>منتجع العلبي — تقرير الحجوزات</h1>
      <p class="sub">${label} · ${rows.length} حجزاً</p>
      ${html}
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 350)
  }

  return (
    <div>
      <div className="adm-section-header">
        <div>
          <h2>تقرير الحجوزات</h2>
          <p>قائمة كاملة بالحجوزات لفترة أسبوعية أو شهرية أو سنوية أو مخصصة، جاهزة للطباعة أو الحفظ كملف PDF.</p>
        </div>
      </div>

      <div className="adm-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_TYPES.map(p => (
            <Button
              key={p.value}
              variant={periodType === p.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriodType(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {periodType === 'custom' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" className="adm-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: 150 }} />
            <span style={{ color: 'var(--muted)' }}>—</span>
            <input type="date" className="adm-input" min={customFrom} value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ width: 150 }} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Button variant="outline" size="sm" iconOnly title="السابق" aria-label="السابق" icon={<FiChevronRight size={16} />} onClick={() => shift(-1)} />
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date(todayStr()))}>الحالي</Button>
            <Button variant="outline" size="sm" iconOnly title="التالي" aria-label="التالي" icon={<FiChevronLeft size={16} />} onClick={() => shift(1)} />
          </div>
        )}

        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{label}</span>

        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{rows.length} حجزاً في هذه الفترة</span>
          <Button variant="outline" size="sm" icon={<FiPrinter size={14} />} onClick={exportPdf} disabled={rows.length === 0}>
            تصدير PDF
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<FiFileText size={28} />} text="لا توجد حجوزات في هذه الفترة." />
      ) : (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table ref={tableRef} style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'الضيف', 'الهاتف', 'الغرفة', 'الوصول', 'المغادرة', 'الليالي', 'الضيوف', 'الحالة', 'الإجمالي'].map(h => (
                    <th key={h} style={{ border: '1px solid var(--border)', padding: '8px 6px', fontSize: 11.5, background: 'var(--linen)', color: 'var(--charcoal)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ booking: b, ci, co, extendsBefore, extendsAfter }) => {
                  const st = STATUS[b.status] || STATUS.confirmed
                  const c = toneColors[st.tone] || {}
                  const ref = b.bookingNumber != null ? formatBookingNumber(b.bookingNumber) : b.id?.slice(0, 6).toUpperCase()
                  const nights = b.nights || Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / 86400000))
                  return (
                    <tr key={b.id}>
                      <td style={cellStyle}><code style={{ fontSize: 11 }}>#{ref}</code></td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{b.guestName}</td>
                      <td style={cellStyle}>{b.guestPhone}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{roomsLabel(b)}</td>
                      <td style={cellStyle}>
                        {fmtCell(ci)}
                        {extendsBefore && <span style={badgeStyle(toneColors.warn)}>يمتد قبل الفترة</span>}
                      </td>
                      <td style={cellStyle}>
                        {fmtCell(co)}
                        {extendsAfter && <span style={badgeStyle(toneColors.warn)}>يمتد بعد الفترة</span>}
                      </td>
                      <td style={cellStyle}>{nights}</td>
                      <td style={cellStyle}>{b.guests}</td>
                      <td style={cellStyle}>
                        <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={cellStyle}>{b.totalPrice != null ? b.totalPrice : 'عند الطلب'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const cellStyle = { border: '1px solid var(--border)', padding: '7px 6px', fontSize: 12, textAlign: 'center' }
// Takes a resolved tone-color object (not a CSS var reference) for the same
// reason the status badge above does — this table's HTML gets cloned into
// the print tab, which has no app stylesheet to resolve var(--adm-tone-*) with.
const badgeStyle = (c = {}) => ({
  display: 'block', fontSize: 9.5, fontWeight: 700, color: c.text,
  background: c.bg, borderRadius: 4, padding: '1px 5px', marginTop: 3,
})
