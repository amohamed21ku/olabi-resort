import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiChevronLeft, FiPrinter, FiGrid } from 'react-icons/fi'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { STATUS, CATEGORY_LABEL_AR } from '../constants'
import { getBookingRooms } from '../services'
import { readToneColors } from '../utils/printColors'

const CAL_DAYS = 7

// A day x room "tape chart": days run down the rows, rooms across the
// columns, and each booking is a bar spanning its nights down its room's
// column, colored by status. Both the week and month views share that one
// layout — a month's worth of days could never sit as columns without
// horizontal scrolling, and matching the week to it keeps a single grid to
// read and a single table to print.
export default function CalendarSection({ bookings, rooms }) {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(() => new Date(new Date().toISOString().split('T')[0]))
  const [view, setView] = useState('week') // 'week' | 'month'
  const gridRef = useRef(null)

  const toneColors = useMemo(readToneColors, [])
  const statusColors = useMemo(() => Object.fromEntries(
    Object.entries(STATUS).map(([k, v]) => [k, toneColors[v.tone] || toneColors.muted])
  ), [toneColors])

  const toStr = d => d.toISOString().split('T')[0]
  const todayStr = toStr(new Date())
  const dayStr = v => {
    const dt = v?.toDate ? v.toDate() : (v ? new Date(v) : null)
    return dt && !isNaN(dt.getTime()) ? toStr(dt) : ''
  }

  // Week view: CAL_DAYS consecutive days from the anchor, as before. Month
  // view: every day of the anchor's calendar month. Both build each day by
  // cloning a Date and stepping it with setDate/getDate (local-time
  // arithmetic) rather than the new Date(y, m, day) constructor — the
  // constructor builds local midnight directly, which toISOString() (used
  // by toStr below) can then roll back to the previous UTC day under any
  // positive UTC offset, silently duplicating a date string and throwing
  // off every range comparison against booking check-in/check-out strings.
  // setDate/getDate instead preserve whatever local hour the anchor already
  // has across every step, so the UTC conversion at the end is consistent.
  const days = view === 'month'
    ? (() => {
        const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
        const first = new Date(anchor)
        first.setDate(1)
        return Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(first); d.setDate(d.getDate() + i); return d
        })
      })()
    : Array.from({ length: CAL_DAYS }, (_, i) => {
        const d = new Date(anchor); d.setDate(d.getDate() + i); return d
      })
  const dayStrs = days.map(toStr)
  // A month of rows has to stay dense enough to print on one page; a week
  // of seven rows can afford full-size type and taller cells.
  const compact = view === 'month'

  const sortedRooms = rooms.slice().sort((a, b) => (+a.number || 0) - (+b.number || 0))

  // Each cell is driven by a room-LINE (a booking may occupy several rooms).
  const roomEntries = (roomId) => {
    const out = []
    for (const b of bookings) {
      if (b.status === 'cancelled') continue
      for (const line of getBookingRooms(b)) {
        if (line.roomId === roomId) out.push({ booking: b, line })
      }
    }
    return out
  }
  const covering = (entries, ds) => entries.find(({ line }) => {
    const ci = dayStr(line.checkIn), co = dayStr(line.checkOut)
    return ci && co && ds >= ci && ds < co
  })

  // Contiguous runs of the same booking-line across `days`, as plain data
  // (start index + length) rather than JSX — what lets a booking span
  // rowSpan rows down its room's column.
  const computeSegments = (entries) => {
    const segs = []
    let i = 0
    while (i < days.length) {
      const entry = covering(entries, dayStrs[i])
      if (entry) {
        let len = 1
        while (i + len < days.length
          && covering(entries, dayStrs[i + len])?.line.lineId === entry.line.lineId
          && covering(entries, dayStrs[i + len])?.booking.id === entry.booking.id) len++
        segs.push({ startIdx: i, len, booking: entry.booking, line: entry.line })
        i += len
      } else {
        i++
      }
    }
    return segs
  }

  const shift = n => setAnchor(a => {
    const d = new Date(a)
    if (view === 'month') d.setMonth(d.getMonth() + n)
    else d.setDate(d.getDate() + n * CAL_DAYS)
    return d
  })
  const rangeLabel = view === 'month'
    ? anchor.toLocaleDateString('ar-SY', { month: 'long', year: 'numeric' })
    : `${days[0].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' })} — ${days[days.length - 1].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const exportPdf = () => {
    const html = gridRef.current?.outerHTML || ''
    const w = window.open('', '_blank')
    if (!w) { window.alert('يرجى السماح بالنوافذ المنبثقة لتصدير PDF'); return }
    const legend = Object.entries(STATUS)
      .filter(([k]) => k !== 'cancelled')
      .map(([k, s]) => {
        const c = statusColors[k] || toneColors.muted
        return `<span style="display:inline-flex;align-items:center;gap:5px;margin-left:14px;font-size:11px"><span style="width:11px;height:11px;border-radius:3px;background:${c.bg};border:1px solid ${c.border}"></span>${s.label}</span>`
      })
      .join('')
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقويم الحجوزات — ${rangeLabel}</title>
      <style>
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; font-family:'Cairo','Segoe UI',Arial,sans-serif; }
        body{ margin:22px; color:#1C1C14; }
        h1{ font-size:17px; margin:0 0 3px; }
        p.sub{ color:#7A7860; font-size:12px; margin:0 0 10px; }
        .legend{ margin:0 0 14px; }
        table{ width:100%; border-collapse:collapse; table-layout:fixed; }
        th,td{ border:1px solid #DDD0B8; padding:5px 6px; font-size:11px; text-align:center; vertical-align:middle; }
        @page{ size:landscape; margin:12mm; }
      </style></head><body>
      <h1>منتجع العلبي — تقويم الحجوزات</h1>
      <p class="sub">${rangeLabel}</p>
      <div class="legend">${legend}</div>
      ${html}
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 350)
  }

  // Both views lay days out as rows and rooms as columns. A booking spans
  // rowSpan rows down its room's column; `skip[roomIdx]` tracks how many
  // upcoming rows are still covered by an earlier row's rowSpan for that
  // column, so this row skips emitting a <td> there entirely and the browser
  // slots the remaining cells correctly. The week view just gets roomier
  // typography than the month view, having only seven rows to fill.
  const renderBody = () => {
    const segmentsByRoom = sortedRooms.map(room => computeSegments(roomEntries(room.id)))
    const skip = new Array(sortedRooms.length).fill(0)
    const rows = []
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const d = days[dayIdx]
      const ds = dayStrs[dayIdx]
      const isToday = ds === todayStr
      const cells = []
      for (let r = 0; r < sortedRooms.length; r++) {
        if (skip[r] > 0) { skip[r]--; continue }
        const seg = segmentsByRoom[r].find(s => s.startIdx === dayIdx)
        if (seg) {
          skip[r] = seg.len - 1
          const b = seg.booking
          const c = statusColors[b.status] || statusColors.confirmed
          const s = STATUS[b.status] || STATUS.confirmed
          cells.push(
            <td key={sortedRooms[r].id} rowSpan={seg.len} onClick={() => navigate(`/admin/reservation/${sortedRooms[r].id}?bookingId=${b.id}`, { state: { from: '/admin/calendar' } })}
              style={{ border: '1px solid var(--border)', padding: 2, cursor: 'pointer', verticalAlign: 'middle', background: '#fff' }}>
              <div title={`${b.guestName} · ${s.label}`}
                style={{ background: c.bg, border: `1px solid ${c.border}`, borderTop: `3px solid ${c.text}`, borderRadius: 4, padding: compact ? '3px 4px' : '6px 8px', overflow: 'hidden' }}>
                <div style={{ fontSize: compact ? 9 : 12.5, fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.guestName}</div>
                {!compact && <div style={{ fontSize: 10, color: c.text, opacity: 0.8 }}>{s.label}</div>}
              </div>
            </td>
          )
        } else {
          cells.push(<td key={sortedRooms[r].id} style={{ border: '1px solid var(--border)', background: isToday ? 'var(--adm-tone-good-bg)' : '#fff' }} />)
        }
      }
      rows.push(
        <tr key={ds} style={compact ? undefined : { height: 54 }}>
          <th scope="row" style={{ border: '1px solid var(--border)', padding: '3px 4px', textAlign: 'center', whiteSpace: 'nowrap', background: isToday ? 'var(--adm-tone-good-bg)' : 'var(--cream)', color: isToday ? 'var(--adm-tone-good-text)' : 'var(--ink)' }}>
            <div style={{ fontSize: compact ? 8.5 : 11, fontWeight: 600, color: isToday ? 'var(--adm-tone-good-text)' : 'var(--muted)' }}>{d.toLocaleDateString('ar-SY', { weekday: 'short' })}</div>
            <div style={{ fontSize: compact ? 11 : 15, fontWeight: 800 }}>{d.getDate()}</div>
            {!compact && <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{d.toLocaleDateString('ar-SY', { month: 'short' })}</div>}
          </th>
          {cells}
        </tr>
      )
    }
    return rows
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div className="adm-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant={view === 'week' ? 'primary' : 'outline'} size="sm" onClick={() => setView('week')}>أسبوعي</Button>
          <Button variant={view === 'month' ? 'primary' : 'outline'} size="sm" onClick={() => setView('month')}>شهري</Button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="outline" size="sm" iconOnly title={view === 'month' ? 'الشهر السابق' : 'الأسبوع السابق'} aria-label={view === 'month' ? 'الشهر السابق' : 'الأسبوع السابق'}
            icon={<FiChevronRight size={16} />} onClick={() => shift(-1)} />
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date(todayStr))}>اليوم</Button>
          <Button variant="outline" size="sm" iconOnly title={view === 'month' ? 'الشهر التالي' : 'الأسبوع التالي'} aria-label={view === 'month' ? 'الشهر التالي' : 'الأسبوع التالي'}
            icon={<FiChevronLeft size={16} />} onClick={() => shift(1)} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{rangeLabel}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginInlineStart: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.entries(STATUS).filter(([k]) => k !== 'cancelled').map(([k, s]) => {
              const c = statusColors[k] || toneColors.muted
              return (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)' }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: c.bg, border: `1px solid ${c.border}` }} />{s.label}
                </span>
              )
            })}
          </div>
          <Button variant="outline" size="sm" icon={<FiPrinter size={14} />} onClick={exportPdf}>تصدير PDF</Button>
        </div>
      </div>

      {sortedRooms.length === 0 ? (
        <EmptyState icon={<FiGrid size={28} />} text="لا توجد غرف لعرضها." />
      ) : (
        // Days run down the rows and rooms across the columns in both views:
        // a month has far too many days to sit as columns without horizontal
        // scrolling, and keeping the week identical means one layout to learn
        // (and one table to print) rather than two mirrored ones.
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table ref={gridRef} style={{ width: '100%', minWidth: compact ? undefined : 90 + sortedRooms.length * 104, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: compact ? 46 : 76 }} />
                {sortedRooms.map((r, i) => <col key={i} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ border: '1px solid var(--border)', padding: '4px 2px', background: 'var(--cream)' }} />
                  {sortedRooms.map(room => (
                    <th key={room.id} style={{ border: '1px solid var(--border)', padding: compact ? '3px 2px' : '6px 4px', textAlign: 'center', background: 'var(--cream)', color: 'var(--ink)' }}>
                      <div style={{ fontSize: compact ? 10.5 : 13, fontWeight: 800 }}>{room.number}</div>
                      <div style={{ fontSize: compact ? 7.5 : 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {CATEGORY_LABEL_AR[room.type] || room.type}{compact ? '' : ` · ${room.capacity}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderBody()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
