import { useState } from 'react'
import { FiCheck, FiMessageCircle } from 'react-icons/fi'
import { buildCustomerConfirmMessage, buildWhatsAppUrlForText } from '../../services'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { Field } from '../../components/FormCard'

// Shown when the operator confirms a pending booking — lets them tweak the
// canned WhatsApp confirmation message before it goes to the guest, instead
// of only ever being able to fire the message off unedited (or not notify
// the guest at all, which was the previous behavior: confirming just flipped
// the status with no message sent).
export default function ConfirmBookingModal({ booking, bookingActions, onClose }) {
  const [message, setMessage] = useState(() => buildCustomerConfirmMessage(booking, 'ar'))
  const [busy, setBusy] = useState(false)

  const confirmAndSend = async () => {
    setBusy(true)
    await bookingActions.changeStatus(booking.id, 'confirmed')
    setBusy(false)
    const url = buildWhatsAppUrlForText(booking.guestPhone, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <Modal
      open
      title={`تأكيد حجز ${booking.guestName}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button variant="primary" icon={<FiMessageCircle size={15} />} onClick={confirmAndSend} disabled={busy}>
            {busy ? 'جارٍ التأكيد...' : 'تأكيد وإرسال على واتساب'}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FiCheck size={13} /> سيتم تأكيد الحجز، ثم فتح واتساب لإرسال هذه الرسالة إلى {booking.guestPhone}. يمكنك تعديل نصها أولاً.
      </p>
      <Field label="نص الرسالة">
        <textarea
          className="adm-input"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={10}
          style={{ resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-ar)' }}
        />
      </Field>
    </Modal>
  )
}
