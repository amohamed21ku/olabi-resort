import Modal from './Modal'
import Button from './Button'
import { FiAlertTriangle, FiAlertCircle } from 'react-icons/fi'

// The single confirmation pattern for every destructive/hard-to-undo action in
// the admin (delete booking, remove a room/charge/payment, etc.) — replaces
// every old window.confirm()/alert(). Cancel is always the visually safer,
// left-most default; the destructive action is a clearly labeled red button.
// `error` (optional) renders inside the dialog itself, next to the action
// that produced it, instead of leaking out to whatever screen sits behind it.
export default function ConfirmDialog({
  open, title = 'تأكيد الإجراء', message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء',
  destructive = true, busy = false, error = '', onConfirm, onCancel,
}) {
  if (!open) return null
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'جارٍ...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {destructive && <FiAlertTriangle size={22} color="var(--adm-danger)" style={{ flexShrink: 0, marginTop: 2 }} />}
        <p style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.7 }}>{message}</p>
      </div>
      {error && (
        <div className="adm-field-error" style={{ marginTop: 12 }}>
          <FiAlertCircle size={13} /> {error}
        </div>
      )}
    </Modal>
  )
}
