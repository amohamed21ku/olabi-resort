import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { rooms } from '../data/rooms'
import SearchBar from '../components/SearchBar'
import RoomCard from '../components/RoomCard'
import { FiPhone, FiMail, FiMapPin, FiChevronDown, FiSearch } from 'react-icons/fi'

export default function HomePage() {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)
  const featuredRooms = rooms.filter(r => r.featured)
  const videoRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  /* Force-play video — bypasses browser autoplay restrictions */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    const tryPlay = () => v.play().catch(() => {})
    if (v.readyState >= 2) tryPlay()
    else v.addEventListener('canplay', tryPlay, { once: true })
    return () => v.removeEventListener('canplay', tryPlay)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '620px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0a1a10',
      }}>

        <style>{`
          @keyframes heroKenBurn { from { transform: scale(1); } to { transform: scale(1.08); } }
@keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
@keyframes heroScrollBounce {
            0%, 100% { transform: translateY(0);   opacity: 0.5; }
            50%       { transform: translateY(7px); opacity: 0.25; }
          }
        `}</style>

        {/* Video */}
        <video
          ref={videoRef}
          src="/static/images/assets/hero-bg.MP4"
          autoPlay muted loop playsInline preload="auto"
          poster="/static/images/assets/hero-bg.png"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            animation: 'heroKenBurn 28s ease-out forwards',
          }}
        />

        {/* Overlay — light enough to see the resort, dark enough to read text */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.38) 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Content — starts at golden-ratio position below header */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          paddingTop: 'calc(var(--header-h) + 7vh)',
          paddingBottom: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>

          {/* Eyebrow */}
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.70)',
            animation: 'heroFadeUp 0.8s ease 0.1s both',
          }}>
            {tr('hero_label')}
          </p>

          {/* Headline — prominent but not page-eating */}
          <h1 style={{
            fontSize: 'clamp(28px, 4.2vw, 48px)',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: '620px',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            textShadow: '0 2px 16px rgba(0,0,0,0.55)',
            marginBottom: '0',
            animation: 'heroFadeUp 0.8s ease 0.22s both',
          }}>
            {tr('hero_title')}
          </h1>

          {/* Booking widget */}
          <div style={{
            width: '100%',
            maxWidth: '900px',
            marginTop: '4px',
            animation: 'heroFadeUp 0.8s ease 0.46s both',
          }}>
            <SearchBar onDark />
          </div>

          {/* ═══ ACTION BUTTONS ═══ */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '8px',
            animation: 'heroFadeUp 0.8s ease 0.7s both',
          }}>
            {/* View all rooms */}
            <Link
              to="/rooms"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '100px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: 'var(--white)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.2s, border-color 0.2s',
                fontFamily: isRTL ? 'var(--font-ar)' : 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            >
              <FiSearch size={14} />
              {isRTL ? 'استعرض جميع الغرف' : 'View all rooms'}
            </Link>

            {/* Directions */}
            <button
              onClick={() => {
                const el = document.getElementById('directions')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '100px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: 'var(--white)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                fontFamily: isRTL ? 'var(--font-ar)' : 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            >
              <FiMapPin size={14} />
              {isRTL ? 'كيف تصل إلينا' : 'How to get here'}
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '28px', left: '50%',
          transform: 'translateX(-50%)',
          display: scrolled ? 'none' : 'flex',
          flexDirection: 'column', alignItems: 'center', gap: '5px',
          color: 'rgba(255,255,255,0.4)',
          animation: 'heroScrollBounce 2.2s ease-in-out infinite',
          zIndex: 3,
        }}>
          <span style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
            {tr('hero_scroll')}
          </span>
          <FiChevronDown size={14} />
        </div>
      </section>

      {/* ─── Featured Rooms ────────────────────────────── */}
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '28px',
          }}>
            {featuredRooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/rooms" className="btn btn-outline btn-lg">
              {tr('rooms_viewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── About ─────────────────────────────────────── */}
      <section id="about" className="section" style={{ background: 'var(--linen)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '60px',
            alignItems: 'center',
          }}>
            {/* Image */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              aspectRatio: '4/3',
              order: isRTL ? 1 : 0,
            }}>
              <img
                src="/static/images/assets/about-image.png"
                alt="Olabi Resort"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Text */}
            <div>
              <p className="section-label">{tr('about_label')}</p>
              <h2 className="section-title">{tr('about_title')}</h2>
              <p style={{ fontSize: '16px', color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: '36px' }}>
                {tr('about_body')}
              </p>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
              }}>
                {[
                  { value: '40+', label: tr('about_stat1') },
                  { value: '8',   label: tr('about_stat2') },
                  { value: '5k+', label: tr('about_stat3') },
                  { value: '1200', label: tr('about_stat4') },
                ].map(({ value, label }) => (
                  <div key={label} style={{
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--terracotta)',
                      lineHeight: 1,
                      marginBottom: '6px',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Directions ─────────────────────────────────── */}
      <section id="directions" className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p className="section-label">{tr('dir_label')}</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>
              {tr('dir_title')}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {[
              { title: tr('dir_from_dam'), time: tr('dir_hours_dam'), icon: '🚗', color: 'var(--terracotta)' },
              { title: tr('dir_from_lat'), time: tr('dir_hours_lat'), icon: '🚗', color: 'var(--olive)' },
            ].map(({ title, time, icon, color }) => (
              <div key={title} style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                borderTop: `4px solid ${color}`,
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: '8px',
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: '15px', color, fontWeight: 600 }}>{time}</p>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div style={{
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
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '15px',
                color: 'var(--charcoal)',
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

      {/* ─── CTA Banner ─────────────────────────────────── */}
      <section style={{
        background: 'var(--terracotta)',
        padding: '64px 0',
        textAlign: 'center',
      }}>
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
