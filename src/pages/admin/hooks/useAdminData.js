import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection, doc, onSnapshot, query, orderBy,
  db, HIKE_DOC, DEFAULT_HIKE_CONTENT, hasPublicGuestFields, moveBookingGuestFields,
} from '../services'

// Live Firestore subscriptions shared by every admin section. Extracted
// verbatim from the old Dashboard component — same collections, same
// ordering, same loading flags.
export function useAdminData() {
  const [rooms, setRooms]     = useState([])
  const [variants, setVariants] = useState([])
  const [bookingDocs, setBookingDocs] = useState([])
  const [guests, setGuests] = useState({})  // bookingGuests, by booking id
  const [hikeContent, setHikeContent] = useState(null)
  const [hikeApps, setHikeApps] = useState([])
  const [loadingR, setLR] = useState(true)
  const [loadingV, setLV] = useState(true)
  const [loadingB, setLB] = useState(true)
  const [loadingG, setLG] = useState(true)

  useEffect(() => onSnapshot(collection(db, 'rooms'), snap => {
    setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => +a.number - +b.number))
    setLR(false)
  }), [])

  useEffect(() => onSnapshot(collection(db, 'variants'), snap => {
    setVariants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLV(false)
  }), [])

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setBookingDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLB(false) })
  }, [])

  useEffect(() => onSnapshot(collection(db, 'bookingGuests'),
    snap => { setGuests(Object.fromEntries(snap.docs.map(d => [d.id, d.data()]))); setLG(false) },
    err  => { console.error('bookingGuests subscription failed:', err); setLG(false) },
  ), [])

  // Guest personal details live in the admin-only bookingGuests/{id} doc —
  // merged back here so every admin screen reads b.guestName etc. as before.
  const bookings = useMemo(
    () => bookingDocs.map(b => ({ ...b, ...guests[b.id] })),
    [bookingDocs, guests],
  )

  // Bookings created before that split still carry the details on the public
  // doc; move each one over (once per session) as soon as an admin sees it.
  const moved = useRef(new Set())
  useEffect(() => {
    const pending = bookingDocs.filter(b => hasPublicGuestFields(b) && !moved.current.has(b.id))
    if (!pending.length) return
    pending.forEach(b => moved.current.add(b.id))
    ;(async () => {
      for (const b of pending) {
        try { await moveBookingGuestFields(b.id) }
        catch (err) { console.error('moving guest details failed for booking', b.id, err) }
      }
    })()
  }, [bookingDocs])

  useEffect(() => onSnapshot(doc(db, HIKE_DOC.col, HIKE_DOC.id), snap => {
    setHikeContent(snap.exists() ? { ...DEFAULT_HIKE_CONTENT, ...snap.data() } : { ...DEFAULT_HIKE_CONTENT })
  }), [])

  useEffect(() => onSnapshot(collection(db, 'hikeApplications'), snap => {
    setHikeApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }), [])

  return {
    rooms, variants, bookings, hikeContent, hikeApps,
    loadingR, loadingV, loadingB: loadingB || loadingG,
  }
}
