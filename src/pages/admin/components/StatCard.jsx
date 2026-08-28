export default function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-card__icon"><Icon size={19} /></div>
      <div>
        <p className="adm-stat-card__value">{value}</p>
        <p className="adm-stat-card__label">{label}</p>
        {sub && <p className="adm-stat-card__sub">{sub}</p>}
      </div>
    </div>
  )
}
