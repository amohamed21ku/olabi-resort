import { useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'

// Compact delete affordance for booking rows that live outside the room
// panel — the approval and needs-room queues, where a bad/duplicate/test
// booking otherwise has no click-through screen to reach RoomPanel's own
// "حذف الحجز" button (that one only exists once a physical room is assigned).
// Same confirm-then-delete pattern, just icon-only to fit a compact row.
export default function DeleteBookingButton({ booking, bookingActions, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const { deleting, deleteBooking } = bookingActions

  const handleDelete = async () => {
    const ok = await deleteBooking(booking)
    setConfirming(false)
    if (ok) onDeleted?.()
  }

  return (
    <>
      <Button
        variant="destructive-outline" size="sm" iconOnly
        icon={<FiTrash2 size={13} />}
        title="حذف الحجز"
        aria-label="حذف الحجز"
        onClick={() => setConfirming(true)}
      />
      <ConfirmDialog
        open={confirming}
        title="حذف الحجز"
        message={`سيتم حذف حجز ${booking.guestName} نهائياً — هل أنت متأكد؟`}
        confirmLabel="حذف الحجز"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
