// Shared chrome for the two approval-queue cards (pending / needs-room): a
// count + icon, a sort dropdown, and a compact row list as children. No
// collapsing and no internal scroll — each card just grows with its content
// and the page scrolls, keeping both cards visually and behaviorally
// identical so learning one teaches the other.
export default function QueueCard({ tone, icon, title, sort, onSortChange, children }) {
  return (
    <div className="adm-queue-card" style={{ borderColor: `var(--adm-tone-${tone}-border)`, background: `var(--adm-tone-${tone}-bg)` }}>
      <div className="adm-queue-card__head">
        <div className="adm-queue-card__title" style={{ color: `var(--adm-tone-${tone}-text)` }}>
          {icon}
          <strong>{title}</strong>
        </div>
        <select className="adm-input adm-queue-card__sort" value={sort} onChange={e => onSortChange(e.target.value)}>
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="checkin">تاريخ الوصول الأقرب</option>
        </select>
      </div>
      <div className="adm-queue-card__list">{children}</div>
    </div>
  )
}

export function QueueRow({ title, subtitle, action }) {
  return (
    <div className="adm-queue-card__row">
      <div style={{ flex: 1, minWidth: 120 }}>
        <p className="adm-queue-card__row-title">{title}</p>
        <p className="adm-queue-card__row-sub">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
