import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot, query, orderBy,
  db, HIKE_DOC, DEFAULT_HIKE_CONTENT,
} from '../services'

// Live Firestore subscriptions shared by every admin section. Extracted
// verbatim from the old Dashboard component — same collections, same
// ordering, same loading flags.
export function useAdminData() {
  const [rooms, setRooms]     = useState([])
  const [variants, setVariants] = useState([])
  const [bookings, setBookings] = useState([])
  const [hikeContent, setHikeContent] = useState(null)
  const [hikeApps, setHikeApps] = useState([])
  const [loadingR, setLR] = useState(true)
  const [loadingV, setLV] = useState(true)
  const [loadingB, setLB] = useState(true)

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
    return onSnapshot(q, snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLB(false) })
  }, [])

  useEffect(() => onSnapshot(doc(db, HIKE_DOC.col, HIKE_DOC.id), snap => {
    setHikeContent(snap.exists() ? { ...DEFAULT_HIKE_CONTENT, ...snap.data() } : { ...DEFAULT_HIKE_CONTENT })
  }), [])

  useEffect(() => onSnapshot(collection(db, 'hikeApplications'), snap => {
    setHikeApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }), [])

  return {
    rooms, variants, bookings, hikeContent, hikeApps,
    loadingR, loadingV, loadingB,
  }
}
