import { STATUS, PAYMENT_STATUS } from '../constants'

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.confirmed
  return <span className={`adm-badge adm-badge--${s.tone}`}>{s.label}</span>
}

export function PaymentStatusBadge({ status }) {
  const s = PAYMENT_STATUS[status] || PAYMENT_STATUS.unpaid
  return <span className={`adm-badge adm-badge--${s.tone}`}>{s.label}</span>
}

export function CountBadge({ count }) {
  if (!count) return null
  return <span className="adm-badge adm-badge--count">{count}</span>
}
