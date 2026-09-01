import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiChevronLeft, FiPrinter, FiGrid } from 'react-icons/fi'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { STATUS, CATEGORY_LABEL_AR } from '../constants'
import { getBookingRooms } from '../services'
import { readToneColors } from '../utils/printColors'

const CAL_DAYS = 7

// Ported from the old CalendarTab — a room x day "tape chart". Rooms are
// rows, days are columns, and each booking is a bar spanning its nights,
// colored by status. Week navigation and the PDF export popup are kept
// exactly as before; only the surrounding chrome now uses Button/.adm-card.
export default function CalendarSection({ bookings, rooms }) {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(() => new Date(new Date().toISOString().split('T')[0]))
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

  const days = Array.from({ length: CAL_DAYS }, (_, i) => {
    const d = new Date(anchor); d.setDate(d.getDate() + i); return d
  })
  const dayStrs = days.map(toStr)

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

  const shift = n => setAnchor(a => { const d = new Date(a); d.setDate(d.getDate() + n); return d })
  const rangeLabel = `${days[0].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' })} — ${days[CAL_DAYS - 1].toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })}`

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

  const renderRow = (entries, roomId) => {
    const cells = []
    let i = 0
    while (i < CAL_DAYS) {
      const ds = dayStrs[i]
      const entry = covering(entries, ds)
      if (entry) {
        const b = entry.booking
        let span = 1
        while (i + span < CAL_DAYS
          && covering(entries, dayStrs[i + span])?.line.lineId === entry.line.lineId
          && covering(entries, dayStrs[i + span])?.booking.id === b.id) span++
        const c = statusColors[b.status] || statusColors.confirmed
        const s = STATUS[b.status] || STATUS.confirmed
        cells.push(
          <td key={ds} colSpan={span} onClick={() => navigate(`/admin/reservation/${roomId}?bookingId=${b.id}`)}
            style={{ border: '1px solid var(--border)', padding: 3, cursor: 'pointer', background: '#fff' }}>
            <div title={`${b.guestName} · ${s.label}`}
              style={{ background: c.bg, border: `1px solid ${c.border}`, borderRight: `3px solid ${c.text}`, borderRadius: 6, padding: '5px 8px', textAlign: 'right', overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.guestName}</span>
              <span style={{ fontSize: 10, color: c.text, opacity: 0.8 }}>{s.label}</span>
            </div>
          </td>
        )
        i += span
      } else {
        cells.push(<td key={ds} style={{ border: '1px solid var(--border)', background: ds === todayStr ? 'var(--adm-tone-good-bg)' : '#fff' }} />)
        i++
      }
    }
    return cells
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div className="adm-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="outline" size="sm" iconOnly title="الأسبوع السابق" aria-label="الأسبوع السابق"
            icon={<FiChevronRight size={16} />} onClick={() => shift(-CAL_DAYS)} />
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date(todayStr))}>اليوم</Button>
          <Button variant="outline" size="sm" iconOnly title="الأسبوع التالي" aria-label="الأسبوع التالي"
            icon={<FiChevronLeft size={16} />} onClick={() => shift(CAL_DAYS)} />
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
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table ref={gridRef} style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 120 }} />
                {days.map((d, i) => <col key={i} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ border: '1px solid var(--border)', padding: '6px 4px', textAlign: 'right', position: 'sticky', right: 0, background: 'var(--cream)', zIndex: 2, whiteSpace: 'nowrap' }}>الغرفة</th>
                  {days.map(d => {
                    const isToday = toStr(d) === todayStr
                    return (
                      <th key={toStr(d)} style={{ border: '1px solid var(--border)', padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap', background: isToday ? 'var(--adm-tone-good-bg)' : 'var(--cream)', color: isToday ? 'var(--adm-tone-good-text)' : 'var(--muted)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 600 }}>{d.toLocaleDateString('ar-SY', { weekday: 'short' })}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? 'var(--adm-tone-good-text)' : 'var(--ink)' }}>{d.getDate()}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{d.toLocaleDateString('ar-SY', { month: 'short' })}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRooms.map(room => (
                  <tr key={room.id}>
                    <td style={{ border: '1px solid var(--border)', padding: '8px 10px', textAlign: 'right', background: '#fff', whiteSpace: 'nowrap', position: 'sticky', right: 0, zIndex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>غرفة {room.number}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{CATEGORY_LABEL_AR[room.type] || room.type} · {room.capacity}</div>
                    </td>
                    {renderRow(roomEntries(room.id), room.id)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
