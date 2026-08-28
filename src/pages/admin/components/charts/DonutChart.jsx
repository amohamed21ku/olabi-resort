// Hand-rolled SVG donut chart (stacked <circle> segments via stroke-dasharray
// — the standard no-library technique, avoids arc-path math). Segment colors
// reuse the same --adm-tone-*-text variables the status badges already use
// elsewhere in the admin, so a "confirmed" slice is the same blue as a
// "confirmed" badge on the room board.
const SIZE = 160
const RADIUS = 60
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="adm-chart-empty">لا توجد بيانات كافية بعد</p>
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  let offset = 0

  return (
    <div className="adm-donut-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="adm-donut-chart__svg" role="img" aria-label="توزيع الحجوزات حسب الحالة">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--linen)" strokeWidth={STROKE} />
        {data.map(d => {
          const fraction = total > 0 ? d.value / total : 0
          const dash = fraction * CIRCUMFERENCE
          const circle = (
            <circle
              key={d.label}
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
              stroke={`var(--adm-tone-${d.tone}-text)`}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          )
          offset += dash
          return circle
        })}
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="adm-donut-chart__total-value">{total}</text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" className="adm-donut-chart__total-label">حجز</text>
      </svg>
      <ul className="adm-donut-chart__legend">
        {data.map(d => (
          <li key={d.label}>
            <span className="adm-donut-chart__dot" style={{ background: `var(--adm-tone-${d.tone}-text)` }} />
            <span className="adm-donut-chart__legend-label">{d.label}</span>
            <span className="adm-donut-chart__legend-value">
              {d.value} · {total > 0 ? Math.round((d.value / total) * 100) : 0}٪
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
