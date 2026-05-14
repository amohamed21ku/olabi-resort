import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

// Subscribes to bookings and returns the set of room IDs whose active booking
// covers today. Used to swap currently-occupied rooms out of the featured list.
export function useCurrentlyBookedRoomIds() {
  const [bookedIds, setBookedIds] = useState(() => new Set())

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        const now = new Date()
        const ids = new Set()
        snap.docs.forEach(d => {
          const b = d.data()
          if (['cancelled', 'checked-out'].includes(b.status)) return
          const cIn  = b.checkIn?.toDate  ? b.checkIn.toDate()  : new Date(b.checkIn)
          const cOut = b.checkOut?.toDate ? b.checkOut.toDate() : new Date(b.checkOut)
          if (cIn <= now && now < cOut) ids.add(b.roomId)
        })
        setBookedIds(ids)
      },
      () => setBookedIds(new Set()),
    )
    return unsub
  }, [])

  return bookedIds
}

export function useRooms() {
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'rooms'),
      (snap) => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.active !== false)
          .sort((a, b) => parseInt(a.number) - parseInt(b.number))
        setRooms(list)
        setLoading(false)
      },
      (err) => {
        console.error('useRooms error:', err)
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { rooms, loading, error }
}

export function useRoom(roomId) {
  const [room, setRoom]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) { setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap) => {
        setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      () => { setRoom(null); setLoading(false) }
    )
    return unsub
  }, [roomId])

  return { room, loading }
}
