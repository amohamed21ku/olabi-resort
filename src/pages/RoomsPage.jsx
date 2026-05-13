import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { rooms, roomTypes } from '../data/rooms'
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

  const [activeType, setActiveType]         = useState('all')
  const [availability, setAvailability]     = useState({})
  const [checkingAvail, setCheckingAvail]   = useState(false)

  // Filter by type + capacity
  const filtered = rooms.filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false
    if (guests > 0 && r.capacity < guests) return false
    return true
  })

  // Check availability when dates are provided
  const runAvailabilityCheck = useCallback(async () => {
    if (!checkIn || !checkOut) return
    setCheckingAvail(true)
    const results = {}
    await Promise.all(filtered.map(async room => {
      try {
        results[room.id] = await checkAvailability(room.id, checkIn, checkOut)
      } catch {
        results[room.id] = true // default to available on error
      }
    }))
    setAvailability(results)
    setCheckingAvail(false)
  }, [checkIn, checkOut, filtered.map(r => r.id).join(',')])

  useEffect(() => { runAvailabilityCheck() }, [runAvailabilityCheck])

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Page header */}
      <div style={{
        background: 'var(--linen)',
        borderBottom: '1px solid var(--sand)',
        padding: '40px 0 32px',
      }}>
        <div className="container">
          <p className="section-label">{tr('rooms_label')}</p>
          <h1 className="section-title">{tr('rooms_title')}</h1>
          <p className="section-subtitle">{tr('rooms_subtitle')}</p>
          {/* Search bar */}
          <div style={{ marginTop: '28px' }}>
            <SearchBar initialValues={{ checkIn, checkOut, guests: guests || 2 }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '36px' }}>
        {/* Type filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '32px',
          justifyContent: isRTL ? 'flex-end' : 'flex-start',
        }}>
          {roomTypes.map(rt => (
            <button
              key={rt.value}
              onClick={() => setActiveType(rt.value)}
              className="btn btn-sm"
              style={{
                background: activeType === rt.value ? 'var(--terracotta)' : 'var(--white)',
                color:      activeType === rt.value ? 'var(--white)'      : 'var(--charcoal)',
                border:     `1.5px solid ${activeType === rt.value ? 'var(--terracotta)' : 'var(--border)'}`,
                borderRadius: '100px',
                transition: 'all 0.2s',
              }}
            >
              {isRTL ? rt.labelAr : rt.labelEn}
            </button>
          ))}
        </div>

        {/* Availability notice */}
        {checkIn && checkOut && (
          <div style={{
            background: 'var(--olive-light)',
            border: '1px solid var(--olive)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '28px',
            fontSize: '14px',
            color: 'var(--olive-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>{checkingAvail ? tr('avail_checking') : `${Object.values(availability).filter(Boolean).length} ${isRTL ? 'غرف متاحة' : 'rooms available'}`}</span>
          </div>
        )}

        {/* Rooms grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: '18px', marginBottom: '12px' }}>🔍</p>
            <p>{tr('rooms_noRooms')}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '28px',
          }}>
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
