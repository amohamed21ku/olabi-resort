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

// `onTitleClick` is optional — when passed, the whole title+subtitle block
// becomes a button that opens whatever detail view the caller wants (e.g. a
// booking-details modal) instead of just the title text being clickable, so
// the click target is the full row width, not one narrow word.
export function QueueRow({ title, subtitle, action, onTitleClick }) {
  const info = (
    <>
      <p className="adm-queue-card__row-title">{title}</p>
      <p className="adm-queue-card__row-sub">{subtitle}</p>
    </>
  )
  return (
    <div className="adm-queue-card__row">
      {onTitleClick ? (
        <button
          type="button"
          onClick={onTitleClick}
          style={{ flex: 1, minWidth: 120, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'inherit', fontFamily: 'inherit' }}
        >
          {info}
        </button>
      ) : (
        <div style={{ flex: 1, minWidth: 120 }}>{info}</div>
      )}
      {action}
    </div>
  )
}
