export default function InfoItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--muted)', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  )
}
