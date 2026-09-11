export function Card({ children, className = '', style }) {
  return <div className={`adm-card ${className}`} style={style}>{children}</div>
}

// `action` (optional) sits at the far end of the header — a small button
// like "تعديل" for cards that are read-only until the operator asks to edit.
export function CardHeader({ icon, children, action }) {
  return (
    <div className="adm-card-header">
      {icon}
      <span>{children}</span>
      {action && <div style={{ marginInlineStart: 'auto' }}>{action}</div>}
    </div>
  )
}

export function CardBody({ children, style }) {
  return <div className="adm-card-body" style={style}>{children}</div>
}
