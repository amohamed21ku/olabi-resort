import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRooms } from '../hooks/useRooms'
import { checkAvailability } from '../firebase/services'
import RoomCard from '../components/RoomCard'
import SearchBar from '../components/SearchBar'

export default function RoomsPage() {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)
  const [searchParams] = useSearchParams()

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = parseInt(searchParams.get('guests') || '0', 10)

  const { rooms, loading } = useRooms()

  const [availability, setAvailability]   = useState({})
  const [checkingAvail, setCheckingAvail] = useState(false)

  const filtered = rooms.filter(r => {
    if (guests > 0 && r.capacity < guests) return false
    return true
  })

  const runAvailabilityCheck = useCallback(async () => {
    if (!checkIn || !checkOut || filtered.length === 0) return
    setCheckingAvail(true)
    const results = {}
    await Promise.all(filtered.map(async room => {
      try { results[room.id] = await checkAvailability(room.id, checkIn, checkOut) }
      catch { results[room.id] = true }
    }))
    setAvailability(results)
    setCheckingAvail(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, filtered.map(r => r.id).join(',')])

  useEffect(() => { runAvailabilityCheck() }, [runAvailabilityCheck])

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ background: 'var(--linen)', borderBottom: '1px solid var(--sand)', padding: '40px 0 32px' }}>
        <div className="container">
          <p className="section-label">{tr('rooms_label')}</p>
          <h1 className="section-title">{tr('rooms_title')}</h1>
          <p className="section-subtitle">{tr('rooms_subtitle')}</p>
          <div style={{ marginTop: 28 }}>
            <SearchBar initialValues={{ checkIn, checkOut, guests: guests || 2 }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36 }}>
        {/* Availability notice */}
        {checkIn && checkOut && (
          <div style={{ background: 'var(--olive-light)', border: '1px solid var(--olive)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 28, fontSize: 14, color: 'var(--olive-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{checkingAvail ? tr('avail_checking') : `${Object.values(availability).filter(Boolean).length} ${isRTL ? 'غرف متاحة' : 'rooms available'}`}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>🔍</p>
            <p>{tr('rooms_noRooms')}</p>
          </div>
        ) : (
          <div className="grid-rooms-page">
            {filtered.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests || undefined}
                availability={checkIn && checkOut ? (availability[room.id] ?? null) : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
