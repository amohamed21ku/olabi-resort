export function Card({ children, className = '', style }) {
  return <div className={`adm-card ${className}`} style={style}>{children}</div>
}

export function CardHeader({ icon, children }) {
  return (
    <div className="adm-card-header">
      {icon}
      <span>{children}</span>
    </div>
  )
}

export function CardBody({ children, style }) {
  return <div className="adm-card-body" style={style}>{children}</div>
}
