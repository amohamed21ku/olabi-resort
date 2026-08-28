import { FiCheck } from 'react-icons/fi'

// A large-target list of options used for every "choose one" step across the
// admin (choose a room, choose a room type, choose a payment method) so the
// interaction is learned once and repeated everywhere instead of each panel
// inventing its own dropdown/toggle. Falls back to an explicit empty message
// instead of an empty list when there is nothing valid to choose.
export default function Picker({ options, value, onChange, emptyText = 'لا يوجد خيارات متاحة' }) {
  if (!options.length) {
    return <p style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 4px' }}>{emptyText}</p>
  }
  return (
    <div className="adm-picker">
      {options.map(opt => (
        <button
          type="button"
          key={opt.value}
          className={`adm-picker-option ${value === opt.value ? 'is-selected' : ''}`}
          disabled={opt.disabled}
          onClick={() => onChange(opt.value)}
        >
          <div style={{ flex: 1 }}>
            <p className="adm-picker-option__title">{opt.label}</p>
            {opt.hint && <p className="adm-picker-option__hint">{opt.hint}</p>}
          </div>
          {value === opt.value && <FiCheck size={16} color="var(--terracotta-dark)" />}
        </button>
      ))}
    </div>
  )
}
