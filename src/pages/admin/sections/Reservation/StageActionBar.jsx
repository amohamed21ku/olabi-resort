import { useState } from 'react'
import { FiCheck, FiLogIn, FiLogOut, FiAlertCircle } from 'react-icons/fi'
import Button from '../../components/Button'
import { StatusBadge } from '../../components/StatusBadge'
import { getBookingRooms } from '../../services'
import { nowLocalStr } from '../../utils/bookingHelpers'

// Shows the guest's current stage in the stay lifecycle and the one obvious
// next action for the receptionist. Buttons go through the shared Button
// component; the checkout balance warning is a ConfirmDialog owned by the
// parent (RoomPanel), not a window.confirm() here.
export default function StageActionBar({ booking: b, fin, busy, error, onConfirm, onCheckIn, onRequestCheckOut }) {
  const status = b.status || 'confirmed'
  const [departAt, setDepartAt] = useState(nowLocalStr())
  const hasAnyRoom = getBookingRooms(b).some(l => l.roomId)

  let tone = 'muted', message = null, action = null

  if (status === 'cancelled') {
    tone = 'bad'
    message = 'هذا الحجز ملغى.'
  } else if (status === 'checked-out') {
    tone = 'good'
    message = fin.balance > 0 ? `غادر الضيف — لكن يوجد مبلغ متبقٍّ ${fin.balance}.` : 'غادر الضيف. الحساب مسدَّد بالكامل. ✓'
  } else if (status === 'checked-in') {
    tone = 'good'
    message = fin.balance > 0
      ? `الضيف داخل المنتجع. المتبقّي على الحساب: ${fin.balance}.`
      : 'الضيف داخل المنتجع. الحساب مسدَّد.'
    action = (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="adm-field">
          {/* Not the booking's booked checkout date (shown further down in
              the room/pricing section) — this is when departure is actually
              being registered right now, defaulting to this instant. Named
              accordingly so the two dates are never mistaken for each other. */}
          <label className="form-lbl">وقت تسجيل المغادرة الآن</label>
          <input type="datetime-local" className="adm-input" value={departAt} onChange={e => setDepartAt(e.target.value)} style={{ width: 210 }} />
        </div>
        <Button variant="primary" icon={<FiLogOut size={16} />} disabled={busy} onClick={() => onRequestCheckOut(departAt)}>
          {busy ? 'جارٍ...' : 'تسجيل المغادرة'}
        </Button>
      </div>
    )
  } else {
    if (!hasAnyRoom) {
      tone = 'warn'
      message = 'قبل تسجيل الوصول، اختر غرفة للحجز من الأسفل.'
    } else {
      tone = 'good'
      message = status === 'pending' ? 'حجز غير مؤكد — أكّده ثم سجّل وصول الضيف.' : 'جاهز لتسجيل وصول الضيف.'
    }
    action = (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {status === 'pending' && (
          <Button variant="secondary" icon={<FiCheck size={16} />} disabled={busy} onClick={onConfirm}>تأكيد الحجز</Button>
        )}
        <Button variant="primary" icon={<FiLogIn size={16} />} disabled={busy || !hasAnyRoom} onClick={onCheckIn}>
          {busy ? 'جارٍ...' : 'تسجيل الوصول'}
        </Button>
      </div>
    )
  }

  return (
    <div className="adm-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderRight: `4px solid var(--adm-tone-${tone}-border)`, background: `var(--adm-tone-${tone}-bg)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusBadge status={status} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--charcoal)' }}>{message}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {error && <span className="adm-field-error"><FiAlertCircle size={13} /> {error}</span>}
        {action}
      </div>
    </div>
  )
}
