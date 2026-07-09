import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoomVariants } from '../hooks/useRooms'
import { countAvailableUnitsForVariant } from '../firebase/services'
import SearchBar from '../components/SearchBar'
import Seo from '../components/Seo'
import TypeCard from '../components/TypeCard'
import DirectionsMap from '../components/DirectionsMap'
import HikeSpotlight from '../components/HikeSpotlight'
import { FiPhone, FiMail, FiMapPin, FiChevronDown, FiSearch, FiNavigation, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  LuBedDouble, LuMountainSnow, LuArmchair, LuTrees, LuHouse,
  LuChefHat, LuWifi, LuUtensils, LuFlame, LuGoal,
  LuTent, LuBaby, LuShoppingCart, LuCar, LuSnowflake, LuSun,
} from 'react-icons/lu'

const ABOUT_IMAGES = [
  '/static/images/assets/about-image.png',
  '/static/images/assets/DSC02417.JPG',
  '/static/images/assets/DSC02418.JPG',
  '/static/images/assets/DSC02433.JPG',
  '/static/images/assets/DSC02434.JPG',
]

function AboutCarousel({ isRTL }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % ABOUT_IMAGES.length), 5000)
    return () => clearInterval(t)
  }, [paused])

  const go = (n) => setIdx((n + ABOUT_IMAGES.length) % ABOUT_IMAGES.length)
  const next = () => go(idx + 1)
  const prev = () => go(idx - 1)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) (isRTL ? dx > 0 : dx < 0) ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        aspectRatio: '4/3',
        background: '#e8e0d0',
        order: isRTL ? 1 : 0,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {ABOUT_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.7s ease',
          }}
        />
      ))}

      <button
        onClick={isRTL ? next : prev}
        aria-label={isRTL ? 'Next' : 'Previous'}
        style={{
          position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.85)'}
      >
        <FiChevronLeft size={20} color="var(--ink)" />
      </button>
      <button
        onClick={isRTL ? prev : next}
        aria-label={isRTL ? 'Previous' : 'Next'}
        style={{
          position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.85)'}
      >
        <FiChevronRight size={20} color="var(--ink)" />
      </button>

      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 8,
      }}>
        {ABOUT_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === idx ? 22 : 8, height: 8, borderRadius: 6,
              background: i === idx ? 'var(--white)' : 'rgba(255,255,255,0.55)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)
  const { variants } = useRoomVariants()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const videoRef = useRef(null)

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = parseInt(searchParams.get('guests') || '0', 10)

  const visibleVariants = variants.filter(v => {
    if (v.count === 0) return false
    if (guests > 0 && v.capacity < guests) return false
    return true
  })

  const [availabilityByVariant, setAvailability]  = useState({})
  const [checkingAvail,         setCheckingAvail] = useState(false)

  const variantKey = visibleVariants.map(v => v.id).join(',')
  const runAvailabilityCheck = useCallback(async () => {
    if (!checkIn || !checkOut || visibleVariants.length === 0) {
      setAvailability({})
      return
    }
    setCheckingAvail(true)
    const results = {}
    await Promise.all(visibleVariants.map(async v => {
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
  }, [checkIn, checkOut, variantKey])

  useEffect(() => { runAvailabilityCheck() }, [runAvailabilityCheck])

  const hasAvailability = Object.values(availabilityByVariant).some(Boolean)

  useEffect(() => {
    const wantsRoomsScroll =
      location.hash === '#rooms' || !!checkIn || !!checkOut
    if (!wantsRoomsScroll) {
      if (location.hash) {
        const id = location.hash.slice(1)
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 250)
      }
      return
    }
    setTimeout(() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }), 250)
  }, [location.hash, location.search, checkIn, checkOut])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    const play = () => v.play().catch(() => {})
    if (v.readyState >= 2) play()
    else v.addEventListener('canplay', play, { once: true })
    return () => v.removeEventListener('canplay', play)
  }, [])

  const scrollToRooms = () => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <Seo
        title={isRTL
          ? 'منتجع العلبي كسب | Olabi Resort — فندق ومنتجع جبلي في كسب، اللاذقية، سوريا'
          : 'Olabi Resort Kasab | Mountain Hotel & Resort in Kasab, Latakia, Syria'}
        description={isRTL
          ? 'منتجع وفندق العلبي في كسب، اللاذقية — أفضل منتجع جبلي في سوريا. غرف وأجنحة فاخرة، إنترنت ستارلينك مجاني، مطعم، ومسارات هايكنغ وسط غابات الصنوبر. صيف بارد بلا مكيف. احجز مباشرة.'
          : 'Olabi Resort & Hotel in Kasab, Latakia — the finest mountain resort in Syria. Luxury rooms & suites, free Starlink WiFi, restaurant, and forest hiking trails. Cool summers, no AC. Book direct.'}
        path="/"
        lang={isRTL ? 'ar' : 'en'}
      />

      <HikeSpotlight />

      {/* ─── Hero ─── */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#07130a',
      }}>
        <style>{`
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroScrollBounce {
            0%, 100% { transform: translateX(-50%) translateY(0);   opacity: 0.4; }
            50%       { transform: translateX(-50%) translateY(7px); opacity: 0.18; }
          }
        `}</style>

        {/* Autoplay background video */}
        <video
          ref={videoRef}
          src="/static/images/assets/for website 1.mp4"
          autoPlay muted loop playsInline preload="auto"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Gradient overlay — dark enough to read text */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.38) 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Content */}
        <div className="container hero-content" style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 600,
            letterSpacing: '3px', textTransform: isRTL ? 'none' : 'uppercase',
            color: 'rgba(255,255,255,0.7)', marginBottom: '16px',
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
            animation: 'heroFadeUp 0.7s ease 0.1s both',
          }}>
            {tr('hero_label')}
          </p>

          <h1 style={{
            fontSize: 'clamp(30px, 4.5vw, 54px)',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.12,
            maxWidth: '640px',
            marginBottom: '16px',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            animation: 'heroFadeUp 0.7s ease 0.2s both',
          }}>
            {tr('hero_title')}
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.62)',
            lineHeight: 1.7,
            maxWidth: '480px',
            marginBottom: '28px',
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            animation: 'heroFadeUp 0.7s ease 0.3s both',
          }}>
            {isRTL
              ? 'منتجعٌ عائليٌّ في مرتفعات كسب — نسمةُ صنوبر، هدوءٌ طويل، وإطلالة لا تُنسى.'
              : "A family resort in the heights of Kasab — pine breeze, slow afternoons, and views you'll never forget."}
          </p>

          <div style={{ width: '100%', maxWidth: '720px', animation: 'heroFadeUp 0.7s ease 0.4s both' }}>
            <SearchBar
              onDark
              initialValues={{ checkIn, checkOut, guests: guests || 2 }}
            />
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px',
            marginTop: '16px',
            animation: 'heroFadeUp 0.7s ease 0.52s both',
          }}>
            <button
              onClick={scrollToRooms}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              <FiSearch size={13} />
              {isRTL ? 'استعرض الغرف' : 'Explore rooms'}
            </button>
            <button
              onClick={() => document.getElementById('directions')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 20px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.1)',
                border: '1.5px solid rgba(255,255,255,0.28)',
                color: 'rgba(255,255,255,0.82)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: isRTL ? 'var(--font-ar)' : undefined,
              }}
            >
              <FiMapPin size={13} />
              {isRTL ? 'كيف تصل إلينا' : 'How to get here'}
            </button>

            {/* Hiking event — subtle entry point, visible on landing without competing with booking */}
            <Link
              to="/hike"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px', borderRadius: '100px',
                background: 'rgba(134,239,172,0.16)',
                border: '1.5px solid rgba(134,239,172,0.45)',
                color: '#bbf7d0', fontSize: '13px', fontWeight: 600,
                fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                textDecoration: 'none',
              }}
            >
              <LuMountainSnow size={14} />
              {isRTL ? 'مسار العم سيفاك' : "Uncle Sevak's Trail"}
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
                background: '#86efac', color: '#07130a',
                padding: '1px 6px', borderRadius: '100px',
              }}>{isRTL ? 'جديد' : 'NEW'}</span>
            </Link>
          </div>
        </div>

        {!scrolled && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%',
            animation: 'heroScrollBounce 2.2s ease-in-out infinite',
            zIndex: 3,
          }}>
            <FiChevronDown size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
          </div>
        )}
      </section>

      {/* ─── Rooms ─── */}
      <section id="rooms" className="section" style={{ background: 'var(--cream)', scrollMarginTop: 'var(--header-h)' }}>
        <div className="container">
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <p className="section-label">{tr('rooms_label')}</p>
            <h2 className="section-title" style={{ margin: '0 auto 14px' }}>
              {tr('rooms_title')}
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {tr('rooms_subtitle')}
            </p>
          </div>

          {checkIn && checkOut && (
            <div style={{
              background: 'var(--olive-light)',
              border: '1px solid var(--olive)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 28,
              fontSize: 14,
              color: 'var(--olive-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: 720,
              margin: '0 auto 28px',
            }}>
              <span>{checkingAvail
                ? tr('avail_checking')
                : (hasAvailability
                    ? (isRTL ? 'فئات متاحة للحجز' : 'Categories available to book')
                    : (isRTL ? 'لا تتوفر فئات في هذه التواريخ' : 'No categories available for these dates'))}</span>
            </div>
          )}

          {visibleVariants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <p style={{ fontSize: 18, marginBottom: 12 }}>🔍</p>
              <p>{tr('rooms_noRooms')}</p>
            </div>
          ) : (
            <div className="grid-rooms">
              {visibleVariants.map(variant => (
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
      </section>

      {/* ─── About ─── */}
      <section id="about" className="section" style={{ background: 'var(--linen)' }}>
        <div className="container">
          <div className="about-grid">
            <AboutCarousel isRTL={isRTL} />

            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p className="section-label">{tr('about_label')}</p>
              <h2 className="section-title">{tr('about_title')}</h2>

              <p style={{
                fontSize: '16.5px',
                color: 'var(--charcoal)',
                lineHeight: 1.85,
                marginBottom: '14px',
              }}>
                {tr('about_body')}
              </p>
              <p style={{
                fontSize: '16px',
                color: 'var(--charcoal)',
                lineHeight: 1.85,
                marginBottom: '24px',
              }}>
                {tr('about_body2')}
              </p>

              {/* Tagline highlight */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--olive-light)',
                border: '1px solid rgba(107, 124, 74, 0.28)',
                marginBottom: '20px',
              }}>
                <LuSun size={20} strokeWidth={1.75} style={{ color: 'var(--olive-dark)' }} aria-hidden />
                <span style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--olive-dark)',
                  letterSpacing: isRTL ? '0' : '0.3px',
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                  fontStyle: isRTL ? 'normal' : 'italic',
                }}>
                  {tr('about_tagline')}
                </span>
              </div>

              {/* Location chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--muted)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.4px',
              }}>
                <FiMapPin size={15} style={{ color: 'var(--terracotta)' }} />
                <span>{tr('about_location')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hike event teaser ─── */}
      <section style={{
        position: 'relative', overflow: 'hidden', background: '#07130a',
      }}>
        <img
          src="/static/images/assets/hike/hike-1.jpg"
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: isRTL
            ? 'linear-gradient(270deg, rgba(7,19,10,0.92) 0%, rgba(7,19,10,0.55) 55%, rgba(7,19,10,0.25) 100%)'
            : 'linear-gradient(90deg, rgba(7,19,10,0.92) 0%, rgba(7,19,10,0.55) 55%, rgba(7,19,10,0.25) 100%)',
        }} />
        <div className="container" style={{
          position: 'relative', zIndex: 2,
          padding: '88px 0', display: 'flex', flexDirection: 'column',
          alignItems: isRTL ? 'flex-end' : 'flex-start',
          textAlign: isRTL ? 'right' : 'left',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 16,
            padding: '7px 15px', borderRadius: 100,
            background: 'rgba(134,239,172,0.16)', border: '1px solid rgba(134,239,172,0.35)',
          }}>
            <LuMountainSnow size={16} style={{ color: '#86efac' }} />
            <span style={{ color: '#86efac', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
              fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
              {tr('hike_teaser_label')}
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#fff',
            lineHeight: 1.15, marginBottom: 16, maxWidth: 580,
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {tr('hike_teaser_title')}
          </h2>
          <p style={{
            fontSize: 16.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8,
            maxWidth: 520, marginBottom: 28,
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}>
            {tr('hike_teaser_body')}
          </p>
          <Link to="/hike" className="btn btn-primary btn-lg"
            style={{ borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {tr('hike_teaser_cta')}
            {isRTL ? <FiChevronLeft size={17} /> : <FiChevronRight size={17} />}
          </Link>
        </div>
      </section>

      {/* ─── Features / Amenities ─── */}
      <section id="features" className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <p className="section-label">{tr('features_label')}</p>
            <h2 className="section-title" style={{ margin: '0 auto 14px' }}>
              {tr('features_title')}
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {tr('features_subtitle')}
            </p>
          </div>

          <div className="grid-features">
            {[
              { Icon: LuBedDouble,    key: 'feat_rooms' },
              { Icon: LuMountainSnow, key: 'feat_views' },
              { Icon: LuArmchair,     key: 'feat_terraces' },
              { Icon: LuTrees,        key: 'feat_outdoor' },
              { Icon: LuHouse,        key: 'feat_cabins' },
              { Icon: LuChefHat,      key: 'feat_kitchen' },
              { Icon: LuWifi,         key: 'feat_wifi' },
              { Icon: LuUtensils,     key: 'feat_dining' },
              { Icon: LuFlame,        key: 'feat_bbq' },
              { Icon: LuGoal,         key: 'feat_sports' },
              { Icon: LuTent,         key: 'feat_tent' },
              { Icon: LuBaby,         key: 'feat_kids' },
              { Icon: LuShoppingCart, key: 'feat_market' },
              { Icon: LuCar,          key: 'feat_parking' },
              { Icon: LuSnowflake,    key: 'feat_ac' },
            ].map(({ Icon, key }) => (
              <div
                key={key}
                className="feature-card"
                style={{ textAlign: isRTL ? 'right' : 'left' }}
              >
                <div className="feature-icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <p className="feature-label" style={{ fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                  {tr(key)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Directions ─── */}
      <section id="directions" className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p className="section-label">{tr('dir_label')}</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>
              {tr('dir_title')}
            </h2>
          </div>

          {/* Animated map - click opens Google Maps */}
          <div style={{ marginBottom: '40px' }}>
            <DirectionsMap />
          </div>

          <div className="grid-dirs">
            {[
              { title: tr('dir_from_lat'), time: tr('dir_hours_lat'), color: 'var(--terracotta)' },
              { title: tr('dir_from_dam'), time: tr('dir_hours_dam'), color: 'var(--olive)' },
            ].map(({ title, time, color }) => (
              <div key={title} className="dir-card-inner" style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: '0 10px 30px rgba(35, 48, 31, 0.08)',
                textAlign: isRTL ? 'right' : 'left',
                border: '1px solid rgba(221, 208, 184, 0.72)',
                borderTop: `5px solid ${color}`,
              }}>
                <div className="dir-card-icon" style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--olive-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                  marginBottom: '18px',
                }}>
                  <FiNavigation size={22} />
                </div>
                <h3 className="dir-card-title" style={{
                  fontSize: '18px', fontWeight: 700,
                  color: 'var(--ink)', marginBottom: '8px',
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                }}>
                  {title}
                </h3>
                <p className="dir-card-time" style={{ fontSize: '15px', color: 'var(--charcoal)', fontWeight: 700, lineHeight: 1.55 }}>{time}</p>
              </div>
            ))}
          </div>

          <div className="dir-contact-row" style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '48px',
            paddingTop: '40px',
            borderTop: '1px solid var(--sand)',
          }}>
            {[
              { Icon: FiMapPin, text: tr('dir_address') },
              { Icon: FiPhone, text: tr('dir_phone'),  href: `tel:${tr('dir_phone')}` },
              { Icon: FiMail,  text: tr('dir_email'),  href: `mailto:${tr('dir_email')}` },
            ].map(({ Icon, text, href }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center',
                gap: '10px', fontSize: '15px', color: 'var(--charcoal)',
              }}>
                <Icon size={18} style={{ color: 'var(--terracotta)', flexShrink: 0 }} />
                {href
                  ? <a href={href} style={{ color: 'var(--charcoal)', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = 'var(--terracotta)'}
                      onMouseLeave={e => e.target.style.color = 'var(--charcoal)'}
                    >{text}</a>
                  : <span>{text}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section style={{ background: 'var(--terracotta)', padding: '64px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 700,
            color: 'var(--white)',
            marginBottom: '16px',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
          }}>
            {isRTL ? 'جاهز لاكتشاف ملاذك؟' : 'Ready to Find Your Escape?'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', marginBottom: '28px', fontSize: '17px' }}>
            {isRTL ? 'احجز مباشرة للحصول على أفضل سعر.' : 'Book directly for the best rates.'}
          </p>
          <button onClick={scrollToRooms} className="btn btn-ghost btn-lg">
            {tr('rooms_viewAll')}
          </button>
        </div>
      </section>
    </>
  )
}
