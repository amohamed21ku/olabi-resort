import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoom } from '../hooks/useRooms'
import { checkAvailability } from '../firebase/services'
import { FiUsers, FiMaximize2, FiArrowLeft, FiArrowRight, FiCheck, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function ImageGallery({ images, name }) {
  const [activeIdx, setActiveIdx]   = useState(0)
  const [bgSrc, setBgSrc]           = useState(images[0])  // stable visible image
  const [fgSrc, setFgSrc]           = useState(null)        // image being loaded on top
  const [fgLoaded, setFgLoaded]     = useState(false)       // fg ready to fade in
  const [bgReady, setBgReady]       = useState(false)       // first img loaded
  const pendingUrl                  = useRef(null)
  const preloaded                   = useRef(new Set([images[0]]))
  const touchStartX                 = useRef(null)
  const galleryRef                  = useRef(null)

  const preload = useCallback((url) => {
    if (!url || preloaded.current.has(url)) return
    const img = new Image()
    img.onload = () => preloaded.current.add(url)
    img.src = url
  }, [])

  // Preload the rest of the gallery in the background once the hero is painted.
  // Cached images switch instantly (see switchTo) — visitors on slow connections
  // get a smooth scrub through all photos instead of waiting per swipe.
  useEffect(() => {
    if (images.length <= 1) return
    const ric = window.requestIdleCallback || (cb => setTimeout(cb, 250))
    const cic = window.cancelIdleCallback  || clearTimeout
    const handle = ric(() => { images.slice(1).forEach(preload) }, { timeout: 2000 })
    return () => cic(handle)
  }, [images, preload])

  const switchTo = useCallback((idx) => {
    if (idx === activeIdx) return
    const url = images[idx]
    setActiveIdx(idx)
    // Already cached → swap instantly, no fade-in wait.
    if (preloaded.current.has(url)) {
      pendingUrl.current = null
      setFgSrc(null)
      setFgLoaded(false)
      setBgSrc(url)
      return
    }
    pendingUrl.current = url
    setFgLoaded(false)
    setFgSrc(url)
    preload(images[(idx + 1) % images.length])
  }, [activeIdx, images, preload])

  // When fg image finishes downloading: fade it in, then promote it to bg
  const handleFgLoad = useCallback(() => {
    const url = fgSrc
    if (url !== pendingUrl.current) return // stale, user navigated again
    preloaded.current.add(url)
    setFgLoaded(true)
    setTimeout(() => {
      if (pendingUrl.current !== url) return
      setBgSrc(url)
      setFgSrc(null)
      setFgLoaded(false)
      pendingUrl.current = null
    }, 300)
  }, [fgSrc])

  const prev = useCallback(() => switchTo(activeIdx === 0 ? images.length - 1 : activeIdx - 1), [switchTo, activeIdx, images.length])
  const next = useCallback(() => switchTo(activeIdx === images.length - 1 ? 0 : activeIdx + 1), [switchTo, activeIdx, images.length])

  useEffect(() => {
    const el = galleryRef.current; if (!el) return
    const h = (e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next() }
    el.addEventListener('keydown', h)
    return () => el.removeEventListener('keydown', h)
  }, [prev, next])

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        ref={galleryRef} tabIndex={0}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', background: '#e8e0d0', outline: 'none', cursor: images.length > 1 ? 'grab' : 'default' }}
      >
        {/* Shimmer while first image loads */}
        {!bgReady && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(90deg, #e8e0d0 25%, #f0e8d8 50%, #e8e0d0 75%)', backgroundSize: '200% 100%', animation: 'gallery-shimmer 1.4s infinite' }} />
        )}

        {/* BG: stable current image — stays visible while next loads */}
        <img src={bgSrc} alt={name} decoding="async" fetchpriority="high"
          onLoad={() => !bgReady && setBgReady(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} />

        {/* FG: new image fading in on top */}
        {fgSrc && (
          <img key={fgSrc} src={fgSrc} alt="" decoding="async"
            onLoad={handleFgLoad}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 3, opacity: fgLoaded ? 1 : 0, transition: fgLoaded ? 'opacity 0.28s ease' : 'none' }} />
        )}

        {/* Tiny loading spinner while fg is downloading */}
        {fgSrc && !fgLoaded && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 24, height: 24, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.65s linear infinite' }} />
        )}

        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous image"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              <FiChevronLeft size={20} color="var(--ink)" />
            </button>
            <button onClick={next} aria-label="Next image"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              <FiChevronRight size={20} color="var(--ink)" />
            </button>
            <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.52)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {activeIdx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — lazy loaded, share same URL so browser cache makes them instant after main view */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => switchTo(i)}
              style={{ flexShrink: 0, width: 76, height: 54, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `2.5px solid ${activeIdx === i ? 'var(--terracotta)' : 'transparent'}`, padding: 0, cursor: 'pointer', background: '#e8e0d0', transition: 'border-color 0.18s, opacity 0.18s', opacity: activeIdx === i ? 1 : 0.7 }}
              onMouseEnter={e => { if (activeIdx !== i) e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { if (activeIdx !== i) e.currentTarget.style.opacity = '0.7' }}
            >
              <img src={img} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RoomDetailPage() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const { language, isRTL } = useLanguage()
  const navigate = useNavigate()
  const tr = (key) => t(language, key)

  const { room, loading } = useRoom(roomId)
  const BackIcon = isRTL ? FiArrowRight : FiArrowLeft

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = searchParams.get('guests')   || '2'

  const [available, setAvailable]    = useState(null)
  const [checkingAvail, setChecking] = useState(false)

  useEffect(() => {
    if (!checkIn || !checkOut || !room) return
    setChecking(true)
    checkAvailability(room.id, checkIn, checkOut)
      .then(v => setAvailable(v))
      .catch(() => setAvailable(true))
      .finally(() => setChecking(false))
  }, [room?.id, checkIn, checkOut])

  const bookingParams = new URLSearchParams({
    ...(checkIn  ? { checkIn }  : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(guests   ? { guests }   : {}),
  }).toString()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--muted)' }}>{tr('loading')}</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="page-loader">
        <p style={{ color: 'var(--muted)' }}>{isRTL ? 'الغرفة غير موجودة' : 'Room not found'}</p>
        <Link to="/rooms" className="btn btn-outline">{isRTL ? 'عودة للغرف' : 'Back to Rooms'}</Link>
      </div>
    )
  }

  const name      = isRTL ? room.nameAr : room.nameEn
  const desc      = isRTL ? room.descAr : room.descEn
  const amenities = (isRTL ? room.amenitiesAr : room.amenities) || []
  const beds      = isRTL ? room.bedsAr : room.beds
  const images    = room.images?.length ? room.images : (room.image ? [room.image] : [])

  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1

  const totalPrice = room.price ? room.price * nights : null

  return (
    <div style={{ background: 'var(--cream)', paddingBottom: 80 }}>
      {/* Back link */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--sand)', padding: '16px 0' }}>
        <div className="container">
          <button
            onClick={() => navigate(`/rooms${bookingParams ? `?${bookingParams}` : ''}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14, fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--terracotta)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <BackIcon size={16} />
            {isRTL ? 'عودة إلى الغرف' : 'Back to Rooms'}
          </button>
        </div>
      </div>

      <div className="container room-detail-top" style={{ paddingTop: 40 }}>
        <div className="room-detail-grid">
          {/* Left: gallery + details */}
          <div>
            {/* Image gallery */}
            {images.length > 0
              ? <ImageGallery images={images} name={name} />
              : <div style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '16/9', marginBottom: 36, background: '#f3f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#ccc' }}>🏨</div>
            }

            {/* Name + type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--linen)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: '100px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {tr(`type_${room.type}`)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {tr('rooms_floor')} {room.floor} · #{room.number}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'var(--ink)', marginBottom: 20, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)', lineHeight: 1.2 }}>
              {name}
            </h1>

            {/* Quick specs */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '20px 0', borderTop: '1px solid var(--sand)', borderBottom: '1px solid var(--sand)', marginBottom: 28 }}>
              {[
                { icon: <FiUsers />,      label: tr('detail_capacity'), value: `${room.capacity} ${tr('rooms_guests')}` },
                ...(room.size ? [{ icon: <FiMaximize2 />, label: tr('detail_size'), value: `${room.size} ${tr('rooms_size')}` }] : []),
                { icon: <span>🛏</span>, label: tr('detail_beds'),     value: beds },
                { icon: <span>🏢</span>, label: tr('detail_floor'),    value: room.floor },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                  <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{icon} {value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {desc && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{tr('detail_description')}</h3>
                <p style={{ fontSize: 16, color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: 32 }}>{desc}</p>
              </>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{tr('detail_amenities')}</h3>
                <div className="amenities-grid">
                  {amenities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--charcoal)', background: 'var(--linen)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                      <FiCheck size={14} style={{ color: 'var(--olive)', flexShrink: 0 }} />
                      {a}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: booking card (sticky on desktop) */}
          <div className="room-booking-card" style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {/* Price header */}
              <div className="booking-card-price" style={{ background: 'var(--linen)', padding: 24, borderBottom: '1px solid var(--sand)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  {room.price ? (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--terracotta)', fontFamily: 'var(--font-body)' }}>${room.price}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>{tr('rooms_perNight')}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--terracotta)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                      {isRTL ? 'السعر عند الطلب' : 'Price on Request'}
                    </span>
                  )}
                </div>
                {room.price && checkIn && checkOut && (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {nights} {tr('detail_nights')} = <strong style={{ color: 'var(--ink)' }}>${totalPrice}</strong>
                  </p>
                )}
              </div>

              {/* Dates display */}
              {checkIn && checkOut ? (
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[{ label: tr('booking_checkIn'), date: checkIn }, { label: tr('booking_checkOut'), date: checkOut }].map(({ label, date }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>{label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FiCalendar size={13} style={{ color: 'var(--terracotta)' }} />
                          {new Date(date).toLocaleDateString(isRTL ? 'ar-SY' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Availability */}
              {checkIn && checkOut && (
                <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--sand)' }}>
                  {checkingAvail
                    ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>{tr('avail_checking')}</p>
                    : <span className={`badge ${available ? 'badge-green' : 'badge-red'}`}>
                        {available ? tr('avail_available') : tr('avail_unavailable')}
                      </span>
                  }
                </div>
              )}

              {/* CTA */}
              <div className="booking-card-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {available !== false && (
                  <Link to={`/booking/${room.id}${bookingParams ? `?${bookingParams}` : ''}`} className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
                    {tr('detail_bookRoom')}
                  </Link>
                )}
                {!checkIn && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>{tr('avail_select_dates')}</p>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {[tr('booking_policy1'), tr('booking_policy2'), tr('booking_policy3')].map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <FiCheck size={12} style={{ color: 'var(--olive)', flexShrink: 0, marginTop: 1 }} />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
