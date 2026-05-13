import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

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
