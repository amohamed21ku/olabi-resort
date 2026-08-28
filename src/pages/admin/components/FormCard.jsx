import { Card, CardHeader, CardBody } from './Card'

// Wraps a labeled section of a longer form (used by Room/Variant forms) so
// every multi-step form in the admin shares the same "titled card" rhythm.
export function FormCard({ icon, title, children }) {
  return (
    <Card>
      <CardHeader icon={icon}>{title}</CardHeader>
      <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</CardBody>
    </Card>
  )
}

export function FormRow({ children, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 14 }}>
      {children}
    </div>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <div className="adm-field">
      <label className="form-lbl">{label}</label>
      {children}
      {hint && !error && <span className="adm-field-hint">{hint}</span>}
      {error && <span className="adm-field-error">{error}</span>}
    </div>
  )
}

// A single labeled on/off toggle for form-level flags (featured, active,
// visible...). Colors switch between the muted and "good" tone tokens so a
// checked flag reads clearly without inventing a new visual language.
export function CheckboxChip({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13,
        padding: '9px 14px', borderRadius: 8, width: 'fit-content', fontFamily: 'var(--font-ar)',
        border: `1px solid ${checked ? 'var(--adm-tone-good-border)' : 'var(--border)'}`,
        background: checked ? 'var(--adm-tone-good-bg)' : 'var(--linen)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--terracotta)', width: 14, height: 14 }} />
      <span style={{ fontWeight: checked ? 700 : 400, color: checked ? 'var(--adm-tone-good-text)' : 'var(--charcoal)' }}>{label}</span>
    </label>
  )
}
