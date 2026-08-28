// Hand-rolled SVG bar chart — no charting library. Reused for both the
// revenue-trend and revenue-by-category breakdowns on the Statistics page,
// since they're both just an array of {label, value} rendered as bars.
//
// The viewBox keeps a fixed aspect ratio and relies on the default
// `preserveAspectRatio` (uniform scaling) so text labels never get stretched
// — the matching CSS `aspect-ratio` on .adm-bar-chart keeps the rendered
// box in that same ratio, so "uniform scaling" and "fill the container"
// end up meaning the same thing.
const VIEW_W = 600
const VIEW_H = 220
const BAR_MAX_H = 140
const BASE_Y = 160

export default function BarChart({ data, formatValue = (v) => v.toLocaleString(), barColor = 'var(--olive)' }) {
  if (!data || data.length === 0) {
    return <p className="adm-chart-empty">لا توجد بيانات كافية بعد</p>
  }

  const max = Math.max(...data.map(d => d.value), 1)
  const slot = VIEW_W / data.length

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="adm-bar-chart"
      role="img"
      aria-label="مخطط بياني"
    >
      <line x1="0" y1={BASE_Y} x2={VIEW_W} y2={BASE_Y} className="adm-bar-chart__axis" />
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max((d.value / max) * BAR_MAX_H, 3) : 0
        const barW = Math.min(slot * 0.5, 56)
        const barX = i * slot + (slot - barW) / 2
        const y = BASE_Y - h
        return (
          <g key={d.label}>
            <rect x={barX} y={y} width={barW} height={h} rx="4" fill={barColor} className="adm-bar-chart__bar">
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
            <text x={barX + barW / 2} y={y - 8} textAnchor="middle" className="adm-bar-chart__value">
              {formatValue(d.value)}
            </text>
            <text x={barX + barW / 2} y={BASE_Y + 22} textAnchor="middle" className="adm-bar-chart__label">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
