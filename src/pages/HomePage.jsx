import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoomVariants } from '../hooks/useRooms'
import SearchBar from '../components/SearchBar'
import TypeCard from '../components/TypeCard'
import DirectionsMap from '../components/DirectionsMap'
import { FiPhone, FiMail, FiMapPin, FiChevronDown, FiSearch, FiNavigation, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

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
  const visibleVariants = variants.filter(v => v.count > 0)
  const [scrolled, setScrolled] = useState(false)
  const videoRef = useRef(null)

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

  return (
    <>
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
            <SearchBar onDark />
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px',
            marginTop: '16px',
            animation: 'heroFadeUp 0.7s ease 0.52s both',
          }}>
            <Link
              to="/rooms"
              className="btn btn-primary btn-sm"
              style={{ borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              <FiSearch size={13} />
              {isRTL ? 'استعرض الغرف' : 'Explore rooms'}
            </Link>
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

      {/* ─── Featured Rooms ─── */}
      <section className="section" style={{ background: 'var(--cream)' }}>
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

          <div className="grid-rooms">
            {visibleVariants.map(variant => (
              <TypeCard key={variant.id} variant={variant} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/rooms" className="btn btn-outline btn-lg">
              {tr('rooms_viewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about" className="section" style={{ background: 'var(--linen)' }}>
        <div className="container">
          <div className="about-grid">
            <AboutCarousel isRTL={isRTL} />

            <div>
              <p className="section-label">{tr('about_label')}</p>
              <h2 className="section-title">{tr('about_title')}</h2>
              <p style={{ fontSize: '16px', color: 'var(--charcoal)', lineHeight: 1.8 }}>
                {tr('about_body')}
              </p>
            </div>
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
          <Link to="/rooms" className="btn btn-ghost btn-lg">
            {tr('rooms_viewAll')}
          </Link>
        </div>
      </section>
    </>
  )
}
