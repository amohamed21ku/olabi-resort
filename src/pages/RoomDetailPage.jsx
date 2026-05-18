import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoomVariant } from '../hooks/useRooms'
import { countAvailableUnitsForVariant } from '../firebase/services'
import { FiUsers, FiArrowLeft, FiArrowRight, FiCheck, FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

function ImageGallery({ images, name }) {
  const { isRTL } = useLanguage()
  const [rawActiveIdx, setActiveIdx]  = useState(0)
  const activeIdx = images.length ? Math.min(rawActiveIdx, images.length - 1) : 0
  const [bgSrc, setBgSrc]             = useState(images[0])
  const [fgSrc, setFgSrc]             = useState(null)
  const [fgLoaded, setFgLoaded]       = useState(false)
  const [bgReady, setBgReady]         = useState(false)
  const [isSwitching, setSwitching]   = useState(false)
  const [viewerOpen, setViewerOpen]   = useState(false)
  const [loadedUrls, setLoadedUrls]   = useState(() => new Set(images[0] ? [images[0]] : []))
  const imageCache                    = useRef(new Map())
  const switchToken                   = useRef(0)
  const transitionTimer               = useRef(null)
  const touchStartX                   = useRef(null)
  const galleryRef                    = useRef(null)

  const markLoaded = useCallback((url) => {
    if (!url) return
    imageCache.current.set(url, { status: 'ready', promise: Promise.resolve(url) })
    setLoadedUrls(prev => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  const loadImage = useCallback((url) => {
    if (!url) return Promise.resolve(null)
    const cached = imageCache.current.get(url)
    if (cached?.status === 'ready') return Promise.resolve(url)
    if (cached?.promise) return cached.promise

    const promise = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = async () => {
        try { if (img.decode) await img.decode() } catch {}
        markLoaded(url)
        resolve(url)
      }
      img.onerror = reject
      img.src = url
    })

    imageCache.current.set(url, { status: 'loading', promise })
    return promise
  }, [markLoaded])

  const preloadNeighbors = useCallback((idx) => {
    if (images.length <= 1) return
    const prevIdx = idx === 0 ? images.length - 1 : idx - 1
    const nextIdx = idx === images.length - 1 ? 0 : idx + 1
    loadImage(images[prevIdx]).catch(() => {})
    loadImage(images[nextIdx]).catch(() => {})
  }, [images, loadImage])

  useEffect(() => {
    const firstImage = images[0] || ''
    imageCache.current = new Map()
    switchToken.current += 1
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    setActiveIdx(0)
    setBgSrc(firstImage)
    setFgSrc(null)
    setFgLoaded(false)
    setBgReady(false)
    setSwitching(false)
    setViewerOpen(false)
    setLoadedUrls(new Set(firstImage ? [firstImage] : []))
  }, [images])

  useEffect(() => {
    if (!bgReady) return
    preloadNeighbors(activeIdx)
  }, [activeIdx, bgReady, preloadNeighbors])

  useEffect(() => {
    if (!bgReady || images.length <= 1) return
    let cancelled = false
    const queue = images.filter((url) => imageCache.current.get(url)?.status !== 'ready')
    const pump = () => {
      if (cancelled) return
      const url = queue.shift()
      if (!url) return
      loadImage(url).catch(() => {}).then(() => { if (!cancelled) pump() })
    }
    pump()
    return () => { cancelled = true }
  }, [bgReady, images, loadImage])

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current) }, [])

  const switchTo = useCallback((idx) => {
    if (idx === activeIdx || !images[idx]) return
    const url = images[idx]
    const token = switchToken.current + 1
    switchToken.current = token
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    setActiveIdx(idx)
    setSwitching(true)
    setFgSrc(null)
    setFgLoaded(false)
    preloadNeighbors(idx)
    if (imageCache.current.get(url)?.status === 'ready') {
      setBgSrc(url)
      setSwitching(false)
      return
    }
    loadImage(url)
      .then(() => {
        if (switchToken.current !== token) return
        setFgSrc(url)
        requestAnimationFrame(() => { if (switchToken.current === token) setFgLoaded(true) })
        transitionTimer.current = setTimeout(() => {
          if (switchToken.current !== token) return
          setBgSrc(url)
          setFgSrc(null)
          setFgLoaded(false)
          setSwitching(false)
        }, 280)
      })
      .catch(() => { if (switchToken.current === token) setSwitching(false) })
  }, [activeIdx, images, loadImage, preloadNeighbors])

  const prev = useCallback(() => switchTo(activeIdx === 0 ? images.length - 1 : activeIdx - 1), [switchTo, activeIdx, images.length])
  const next = useCallback(() => switchTo(activeIdx === images.length - 1 ? 0 : activeIdx + 1), [switchTo, activeIdx, images.length])

  useEffect(() => {
    if (!viewerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const h = (e) => {
      if (e.key === 'Escape') setViewerOpen(false)
      if (e.key === 'ArrowLeft')  (isRTL ? next : prev)()
      if (e.key === 'ArrowRight') (isRTL ? prev : next)()
    }
    window.addEventListener('keydown', h)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', h)
    }
  }, [viewerOpen, prev, next, isRTL])

  useEffect(() => {
    const el = galleryRef.current; if (!el) return
    const h = (e) => {
      if (e.key === 'ArrowLeft')  (isRTL ? next : prev)()
      if (e.key === 'ArrowRight') (isRTL ? prev : next)()
    }
    el.addEventListener('keydown', h)
    return () => el.removeEventListener('keydown', h)
  }, [prev, next, isRTL])

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      const goNext = isRTL ? dx > 0 : dx < 0
      goNext ? next() : prev()
    }
    touchStartX.current = null
  }

  return (
    <div className="gallery-wrap">
      <div
        ref={galleryRef} tabIndex={0}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        className="gallery-main-area"
        style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', background: '#e8e0d0', outline: 'none', cursor: images.length > 1 ? 'grab' : 'default' }}
      >
        {!bgReady && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(90deg, #e8e0d0 25%, #f0e8d8 50%, #e8e0d0 75%)', backgroundSize: '200% 100%', animation: 'gallery-shimmer 1.4s infinite' }} />
        )}
        <img src={bgSrc} alt={name} decoding="async" fetchpriority="high"
          onClick={() => setViewerOpen(true)}
          onLoad={() => { markLoaded(bgSrc); if (!bgReady) setBgReady(true) }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, cursor: 'zoom-in' }} />
        {fgSrc && (
          <img key={fgSrc} src={fgSrc} alt="" decoding="async"
            onClick={() => setViewerOpen(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 3, opacity: fgLoaded ? 1 : 0, transition: fgLoaded ? 'opacity 0.28s ease' : 'none', cursor: 'zoom-in' }} />
        )}
        {isSwitching && !fgLoaded && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 24, height: 24, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.65s linear infinite' }} />
        )}
        {images.length > 1 && (
          <>
            <button onClick={isRTL ? next : prev} aria-label={isRTL ? 'Next image' : 'Previous image'}
              className="gallery-arrow gallery-arrow-left">
              <FiChevronLeft size={20} color="var(--ink)" />
            </button>
            <button onClick={isRTL ? prev : next} aria-label={isRTL ? 'Previous image' : 'Next image'}
              className="gallery-arrow gallery-arrow-right">
              <FiChevronRight size={20} color="var(--ink)" />
            </button>
            <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.52)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {activeIdx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="gallery-thumb-strip" style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => switchTo(i)}
              aria-label={`Show image ${i + 1}`}
              className="gallery-thumb-btn"
              style={{ flexShrink: 0, width: 76, height: 54, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `2.5px solid ${activeIdx === i ? 'var(--terracotta)' : 'transparent'}`, padding: 0, cursor: 'pointer', background: '#e8e0d0', transition: 'border-color 0.18s, opacity 0.18s', opacity: activeIdx === i ? 1 : 0.7, position: 'relative' }}
              onMouseEnter={e => { if (activeIdx !== i) e.currentTarget.style.opacity = '1'; loadImage(img).catch(() => {}) }}
              onFocus={() => loadImage(img).catch(() => {})}
              onMouseLeave={e => { if (activeIdx !== i) e.currentTarget.style.opacity = '0.7' }}
            >
              <img src={img} alt="" loading="lazy" decoding="async"
                onLoad={() => markLoaded(img)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {!loadedUrls.has(img) && (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12, fontWeight: 700, background: '#e8e0d0' }}>
                  {i + 1}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <div
          onClick={() => setViewerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            onClick={() => setViewerOpen(false)}
            aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <FiX size={22} />
          </button>
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>
            {activeIdx + 1} / {images.length}
          </div>
          <img
            src={images[activeIdx]}
            alt={name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 6, userSelect: 'none', display: 'block' }}
          />
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); (isRTL ? next : prev)() }}
              aria-label="Previous"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <FiChevronLeft size={26} />
            </button>
          )}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); (isRTL ? prev : next)() }}
              aria-label="Next"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <FiChevronRight size={26} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoomDetailPage() {
  // The :roomId param now carries the variant slug like 'superub-5'.
  const { roomId: variantSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language, isRTL } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const tr = (key) => t(language, key)

  const cameFromHome = location.state?.from === '/'

  const { variant, loading } = useRoomVariant(variantSlug)
  const BackIcon = isRTL ? FiArrowRight : FiArrowLeft

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = searchParams.get('guests')   || '2'

  const today = new Date().toISOString().split('T')[0]

  const updateDate = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value) {
      next.delete(key)
    } else {
      next.set(key, value)
      if (key === 'checkIn') {
        const currentOut = searchParams.get('checkOut') || ''
        if (!currentOut || currentOut <= value) {
          const bumped = new Date(new Date(value).getTime() + 86400000)
          next.set('checkOut', bumped.toISOString().split('T')[0])
        }
      }
    }
    setSearchParams(next, { replace: true })
  }

  const [available,     setAvailable]  = useState(null)
  const [checkingAvail, setChecking]   = useState(false)

  // Images are managed once per variant in /admin → Variants.
  const images = useMemo(() => {
    if (!variant) return []
    const arr = variant.images?.length ? variant.images : (variant.heroImage ? [variant.heroImage] : [])
    return [...new Set(arr)]
  }, [variant])

  useEffect(() => {
    if (!checkIn || !checkOut || !variant) return
    setChecking(true)
    countAvailableUnitsForVariant(variant.type, variant.capacity, checkIn, checkOut)
      .then(n => setAvailable(n > 0))
      .catch(() => setAvailable(true))
      .finally(() => setChecking(false))
  }, [variant?.id, checkIn, checkOut])

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

  if (!variant || variant.count === 0) {
    return (
      <div className="page-loader">
        <p style={{ color: 'var(--muted)' }}>{isRTL ? 'الفئة غير موجودة' : 'Category not found'}</p>
        <Link to="/rooms" className="btn btn-outline">{isRTL ? 'عودة للغرف' : 'Back to Rooms'}</Link>
      </div>
    )
  }

  const categoryName = tr(`type_${variant.type}`)
  const name = isRTL
    ? (variant.nameAr || `${categoryName} — لـ ${variant.capacity} أشخاص`)
    : (variant.nameEn || `${categoryName} — for ${variant.capacity} persons`)
  const desc = isRTL
    ? (variant.descAr || tr(`cat_${variant.type}_desc`))
    : (variant.descEn || tr(`cat_${variant.type}_desc`))
  const amenities = (isRTL ? variant.amenitiesAr : variant.amenities) || []

  const isFull = available === false

  return (
    <div style={{ background: 'var(--cream)', paddingTop: 'var(--header-h)', paddingBottom: 80, minHeight: '100vh' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--sand)', padding: '16px 0' }}>
        <div className="container">
          <button
            onClick={() => navigate(cameFromHome ? '/' : `/rooms${bookingParams ? `?${bookingParams}` : ''}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14, fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--terracotta)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <BackIcon size={16} />
            {cameFromHome
              ? (isRTL ? 'العودة للرئيسية' : 'Back to Home')
              : (isRTL ? 'عودة إلى الغرف' : 'Back to Rooms')}
          </button>
        </div>
      </div>

      <div className="container room-detail-top" style={{ paddingTop: 40 }}>
        <div className="room-detail-grid">
          <div>
            <div className="room-gallery-bleed">
              {images.length > 0
                ? <ImageGallery images={images} name={name} />
                : <div style={{ aspectRatio: '16/9', marginBottom: 20, background: '#f3f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#ccc' }}>🏨</div>
              }
            </div>

            <div className="room-detail-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--linen)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: '100px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {categoryName}
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'var(--ink)', marginBottom: 20, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)', lineHeight: 1.2 }}>
                {name}
              </h1>

              <div className="room-specs-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tr('detail_capacity')}</span>
                  <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiUsers /> {variant.capacity} {tr('rooms_guests')}
                  </span>
                </div>
                {(isRTL ? variant.bedsAr : variant.beds) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tr('detail_beds')}</span>
                    <span style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>{isRTL ? variant.bedsAr : variant.beds}</span>
                  </div>
                )}
              </div>

              {desc && (
                <>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{tr('detail_description')}</h3>
                  <p style={{ fontSize: 16, color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: 32 }}>{desc}</p>
                </>
              )}

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
          </div>

          <div className="room-booking-card" style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div className="booking-card-price" style={{ background: 'var(--linen)', padding: 24, borderBottom: '1px solid var(--sand)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--terracotta)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                    {isRTL ? 'السعر عند الطلب' : 'Price on Request'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'checkIn',  label: tr('booking_checkIn'),  value: checkIn,  min: today },
                    { key: 'checkOut', label: tr('booking_checkOut'), value: checkOut, min: checkIn || today },
                  ].map(({ key, label, value, min }) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiCalendar size={11} style={{ color: 'var(--terracotta)' }} />
                        {label}
                      </label>
                      <input
                        type="date"
                        value={value}
                        min={min}
                        onChange={e => updateDate(key, e.target.value)}
                        style={{ padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--ink)', background: '#f9f8f6', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {checkIn && checkOut && (
                <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--sand)' }}>
                  {checkingAvail
                    ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>{tr('avail_checking')}</p>
                    : <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                        {isFull ? tr('avail_unavailable') : tr('avail_available')}
                      </span>
                  }
                </div>
              )}

              <div className="booking-card-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!isFull && (
                  <Link to={`/booking/${variant.id}${bookingParams ? `?${bookingParams}` : ''}`} className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
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

      <div className="room-mobile-cta">
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--terracotta)' }}>
            {isRTL ? 'السعر عند الطلب' : 'Price on Request'}
          </span>
        </div>
        {!isFull && (
          <Link
            to={`/booking/${variant.id}${bookingParams ? `?${bookingParams}` : ''}`}
            className="btn btn-primary"
            style={{ flexShrink: 0, padding: '12px 24px', fontSize: 15 }}
          >
            {tr('detail_bookRoom')}
          </Link>
        )}
        {isFull && (
          <span className="badge badge-red" style={{ flexShrink: 0 }}>{tr('avail_unavailable')}</span>
        )}
      </div>
    </div>
  )
}
