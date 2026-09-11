import Button from './Button'
import { DISCOUNT_OPTIONS } from '../services'

// Four-way toggle for a booking's room discount: بلا / 10% / 25% / 50%.
// Shared by the new-booking forms and the guest bill so the choice looks and
// works the same everywhere it can be made.
export default function DiscountPicker({ value, onChange, disabled }) {
  const current = Number(value) || 0
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {DISCOUNT_OPTIONS.map(pct => (
        <Button
          key={pct}
          type="button"
          size="sm"
          variant={current === pct ? 'primary' : 'outline'}
          disabled={disabled}
          onClick={() => { if (pct !== current) onChange(pct) }}
        >
          {pct === 0 ? 'بلا' : `${pct}%`}
        </Button>
      ))}
    </div>
  )
}
