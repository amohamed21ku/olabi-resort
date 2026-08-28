export default function EmptyState({ icon, text }) {
  return (
    <div className="adm-empty">
      {icon}
      <p style={{ fontSize: 13.5 }}>{text}</p>
    </div>
  )
}
