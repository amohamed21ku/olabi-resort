import { useState } from 'react'
import {
  doc, updateDoc, deleteDoc, db,
  checkInBooking, checkOutBooking, computeBookingFinance,
} from '../services'

// Shared booking-action handlers (status change, delete, check-in/out, and
// the one busy/error pair for room-line edits), used by both the Home screen
// and Booking Detail so there's one implementation instead of duplicating it.
//
// Destructive/hard-to-undo actions (delete, checkout-with-balance) no longer
// confirm with window.confirm() themselves — the calling screen shows a
// ConfirmDialog first and only calls these once the user has confirmed.
export function useBookingActions() {
  const [updating,  setUpdating]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [stageBusy, setStageBusy] = useState(false)
  const [stageErr,  setStageErr]  = useState('')
  const [roomsBusy, setRoomsBusy] = useState(false)
  const [roomsErr,  setRoomsErr]  = useState('')

  const changeStatus = async (id, status) => {
    setUpdating(true)
    try { await updateDoc(doc(db, 'bookings', id), { status }) }
    catch { setStageErr('فشل التحديث') }
    finally { setUpdating(false) }
  }

  const mapRoomErr = (e) => {
    if (e?.code === 'ROOM_UNAVAILABLE')     return 'الغرفة محجوزة في هذه الفترة'
    if (e?.message === 'TYPE_MISMATCH')     return 'نوع الغرفة لا يطابق فئة الحجز'
    if (e?.message === 'CAPACITY_MISMATCH') return 'سعة الغرفة لا تطابق سعة الحجز'
    if (e?.message === 'LAST_ROOM')         return 'لا يمكن حذف آخر غرفة — احذف الحجز بدلاً من ذلك'
    if (e?.message === 'INVALID_DATES')     return 'تواريخ غير صحيحة'
    return 'تعذّر الحفظ: ' + (e?.message || '')
  }

  const runRooms = async (fn) => {
    setRoomsBusy(true); setRoomsErr('')
    try { await fn() }
    catch (e) { setRoomsErr(mapRoomErr(e)) }
    finally { setRoomsBusy(false) }
  }

  // Caller is responsible for confirming with the user first (ConfirmDialog).
  const deleteBooking = async (b) => {
    setDeleting(true)
    try { await deleteDoc(doc(db, 'bookings', b.id)); return true }
    catch { setStageErr('فشل الحذف'); return false }
    finally { setDeleting(false) }
  }

  const checkIn = async (b) => {
    setStageBusy(true); setStageErr('')
    try { await checkInBooking(b.id) }
    catch (e) { setStageErr(e?.message === 'NO_ROOM_ASSIGNED' ? 'يجب اختيار غرفة للحجز أولاً' : 'فشل تسجيل الوصول: ' + (e?.message || '')) }
    finally { setStageBusy(false) }
  }

  // Caller checks computeBookingFinance(b).balance and confirms with the user
  // first when there's an outstanding balance; this just performs the checkout.
  const checkOut = async (b, when = null) => {
    setStageBusy(true); setStageErr('')
    try { await checkOutBooking(b.id, when) }
    catch (e) { setStageErr('فشل تسجيل المغادرة: ' + (e?.message || '')) }
    finally { setStageBusy(false) }
  }

  return {
    updating, deleting, stageBusy, stageErr, roomsBusy, roomsErr,
    changeStatus, deleteBooking, checkIn, checkOut, runRooms, mapRoomErr,
    computeBookingFinance,
  }
}
