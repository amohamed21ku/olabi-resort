import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'

export default function Header() {
  const { language, setLanguage, isRTL } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const transparent = isHome && !scrolled && !menuOpen
  const tr = (key) => t(language, key)

  const navLinks = [
    { key: 'nav_home',       href: '/' },
    { key: 'nav_rooms',      href: '/#rooms' },
    { key: 'nav_about',      href: '/#about' },
    { key: 'nav_directions', href: '/#directions' },
  ]

  const scrollTo = (href) => {
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      if (location.pathname !== '/') {
        navigate('/')
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.3s, box-shadow 0.3s',
        background: transparent ? 'transparent' : 'var(--white)',
        boxShadow: transparent ? 'none' : 'var(--shadow-sm)',
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '16px',
        }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              flexShrink: 0,
              lineHeight: 0,
              display: 'inline-flex',
              alignItems: 'center',
              padding: transparent ? '6px 14px' : '0',
              borderRadius: '14px',
              background: transparent
                ? 'linear-gradient(180deg, rgba(255,250,240,0.96) 0%, rgba(252,245,232,0.92) 100%)'
                : 'transparent',
              boxShadow: transparent
                ? '0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.35) inset'
                : 'none',
              transition: 'background 0.3s, box-shadow 0.3s, padding 0.3s',
            }}
          >
            <img
              src="/static/images/assets/olabi-logo.jpg"
              alt="Olabi Resort"
              style={{
                height: '72px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '8px',
                filter: transparent
                  ? 'none'
                  : 'drop-shadow(0 1px 4px rgba(0,0,0,0.15))',
                transition: 'transform 0.3s, height 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hide-mobile">
            {navLinks.map(link => (
              link.href.startsWith('/#')
                ? <button
                    key={link.key}
                    onClick={() => scrollTo(link.href)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: transparent ? 'rgba(255,255,255,0.88)' : 'var(--charcoal)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'color 0.2s',
                      background: 'none',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => e.target.style.color = transparent ? '#fff' : 'var(--terracotta)'}
                    onMouseLeave={e => e.target.style.color = transparent ? 'rgba(255,255,255,0.88)' : 'var(--charcoal)'}
                  >
                    {tr(link.key)}
                  </button>
                : <Link
                    key={link.key}
                    to={link.href}
                    style={{
                      padding: '8px 14px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: transparent
                        ? 'rgba(255,255,255,0.88)'
                        : location.pathname === link.href ? 'var(--terracotta)' : 'var(--charcoal)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {tr(link.key)}
                  </Link>
            ))}
          </nav>

          {/* Right side: lang + cta + burger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: `1.5px solid ${transparent ? 'rgba(255,255,255,0.5)' : 'var(--border)'}`,
                fontSize: '13px',
                fontWeight: 600,
                color: transparent ? 'var(--white)' : 'var(--charcoal)',
                background: 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
                fontFamily: language === 'ar' ? 'var(--font-body)' : 'var(--font-ar)',
              }}
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Book Now — desktop only */}
            <button
              onClick={() => scrollTo('/#rooms')}
              className="btn btn-primary btn-sm hide-mobile"
              style={{ background: transparent ? 'rgba(61,90,58,0.9)' : 'var(--terracotta)' }}
            >
              {tr('nav_bookNow')}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="hide-desktop"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
              style={{
                width: 40, height: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '8px',
              }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  background: transparent ? 'var(--white)' : 'var(--ink)',
                  borderRadius: '2px',
                  transition: 'all 0.25s',
                  transformOrigin: 'center',
                  transform: menuOpen
                    ? i === 0 ? 'translateY(7px) rotate(45deg)'
                    : i === 2 ? 'translateY(-7px) rotate(-45deg)'
                    : 'scaleX(0)'
                    : 'none',
                }} />
              ))}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div style={{
        position: 'fixed',
        top: 'var(--header-h)',
        left: 0, right: 0,
        zIndex: 99,
        background: 'var(--white)',
        boxShadow: 'var(--shadow-md)',
        padding: menuOpen ? '20px 24px 28px' : '0 24px',
        maxHeight: menuOpen ? '360px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, padding 0.3s ease',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navLinks.map(link => (
            link.href.startsWith('/#')
              ? <button
                  key={link.key}
                  onClick={() => { scrollTo(link.href); setMenuOpen(false) }}
                  style={{
                    padding: '13px 0',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: 'var(--charcoal)',
                    textAlign: isRTL ? 'right' : 'left',
                    borderBottom: '1px solid var(--linen)',
                    background: 'none',
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  {tr(link.key)}
                </button>
              : <Link
                  key={link.key}
                  to={link.href}
                  style={{
                    padding: '13px 0',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: location.pathname === link.href ? 'var(--terracotta)' : 'var(--charcoal)',
                    borderBottom: '1px solid var(--linen)',
                    display: 'block',
                  }}
                >
                  {tr(link.key)}
                </Link>
          ))}
          <button
            onClick={() => { scrollTo('/#rooms'); setMenuOpen(false) }}
            className="btn btn-primary"
            style={{ marginTop: '16px', justifyContent: 'center' }}
          >
            {tr('nav_bookNow')}
          </button>
        </nav>
      </div>

      {/* Spacer so content doesn't go under header */}
      {!isHome && <div style={{ height: 'var(--header-h)' }} />}
    </>
  )
}
