import { useState, useEffect, useMemo } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { CATEGORIES } from '../firebase/seed'

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

// Inventory rooms (minimal: number, type, capacity, active).
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

// Variant docs (one per type+capacity listing). Holds all customer-facing
// metadata: name, description, images, amenities, beds, price, featured.
export function useVariants() {
  const [variants, setVariants] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'variants'),
      (snap) => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const idxDiff = CATEGORIES.indexOf(a.type) - CATEGORIES.indexOf(b.type)
            if (idxDiff !== 0) return idxDiff
            return (a.capacity || 0) - (b.capacity || 0)
          })
        setVariants(list)
        setLoading(false)
      },
      (err) => {
        console.error('useVariants error:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { variants, loading }
}

// Composes the customer-facing list: variants enriched with their inventory
// rooms (so callers can show available counts in admin, etc.).
export function useRoomVariants() {
  const { variants, loading: lv } = useVariants()
  const { rooms,    loading: lr } = useRooms()

  const enriched = useMemo(() => {
    return variants
      .filter(v => v.active !== false)
      .map(v => {
        const units = rooms.filter(r =>
          r.active !== false
          && r.type === v.type
          && Number(r.capacity) === Number(v.capacity)
        )
        const heroImage = v.images?.[0] || null
        return {
          ...v,
          rooms: units,
          count: units.length,
          heroImage,
        }
      })
  }, [variants, rooms])

  return { variants: enriched, loading: lv || lr }
}

export function useRoomVariant(slug) {
  const { variants, loading } = useRoomVariants()
  const variant = useMemo(
    () => variants.find(v => v.id === slug) || null,
    [variants, slug],
  )
  return { variant, loading }
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
