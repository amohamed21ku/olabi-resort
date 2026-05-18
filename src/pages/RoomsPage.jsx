import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoomVariants } from '../hooks/useRooms'
import { countAvailableUnitsForVariant } from '../firebase/services'
import TypeCard from '../components/TypeCard'
import SearchBar from '../components/SearchBar'

export default function RoomsPage() {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)
  const [searchParams] = useSearchParams()

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = parseInt(searchParams.get('guests') || '0', 10)

  const { variants, loading } = useRoomVariants()

  // Drop variants that can't host the requested party size.
  const visible = variants.filter(v => {
    if (v.count === 0) return false
    if (guests > 0 && v.capacity < guests) return false
    return true
  })

  const [availabilityByVariant, setAvailability]   = useState({})
  const [checkingAvail,         setCheckingAvail]  = useState(false)

  const runAvailabilityCheck = useCallback(async () => {
    if (!checkIn || !checkOut || visible.length === 0) return
    setCheckingAvail(true)
    const results = {}
    await Promise.all(visible.map(async v => {
      try {
        const n = await countAvailableUnitsForVariant(v.type, v.capacity, checkIn, checkOut)
        results[v.id] = n > 0
      } catch {
        results[v.id] = true
      }
    }))
    setAvailability(results)
    setCheckingAvail(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, visible.map(v => v.id).join(',')])

  useEffect(() => { runAvailabilityCheck() }, [runAvailabilityCheck])

  const hasAvailability = Object.values(availabilityByVariant).some(Boolean)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 80 }}>
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
        {checkIn && checkOut && (
          <div style={{ background: 'var(--olive-light)', border: '1px solid var(--olive)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 28, fontSize: 14, color: 'var(--olive-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{checkingAvail
              ? tr('avail_checking')
              : (hasAvailability
                  ? (isRTL ? 'فئات متاحة للحجز' : 'Categories available to book')
                  : (isRTL ? 'لا تتوفر فئات في هذه التواريخ' : 'No categories available for these dates'))}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>🔍</p>
            <p>{tr('rooms_noRooms')}</p>
          </div>
        ) : (
          <div className="grid-rooms-page">
            {visible.map(variant => (
              <TypeCard
                key={variant.id}
                variant={variant}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests || undefined}
                available={checkIn && checkOut ? (availabilityByVariant[variant.id] ?? null) : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
