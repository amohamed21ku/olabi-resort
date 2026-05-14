import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa'

export default function Footer() {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)

  const navLinks = [
    { label: tr('nav_home'),       href: '/' },
    { label: tr('nav_rooms'),      href: '/rooms' },
    { label: tr('nav_about'),      href: '/#about' },
    { label: tr('nav_directions'), href: '/#directions' },
  ]

  return (
    <footer style={{
      background: '#1A1A12',
      color: 'rgba(255,255,255,0.75)',
      paddingTop: '64px',
      paddingBottom: '32px',
    }}>
      <div className="container">
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr',
          gap: '56px',
          marginBottom: '48px',
        }}>
          {/* Brand */}
          <div style={{ minWidth: 0 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 96,
                padding: '8px 14px',
                borderRadius: '14px',
                background: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                flexShrink: 0,
              }}>
                <img
                  src="/static/images/assets/olabi-logo.jpg"
                  alt="Olabi Resort"
                  style={{
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </span>
              <span style={{
                fontWeight: 700,
                fontSize: '22px',
                color: 'var(--white)',
                fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
              }}>
                {isRTL ? 'منتجع العلبي' : 'Olabi Resort'}
              </span>
            </Link>
            <p style={{ fontSize: '14px', lineHeight: 1.75, maxWidth: '380px' }}>
              {tr('footer_tagline')}
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {[
                { Icon: FaInstagram, href: '#' },
                { Icon: FaFacebook, href: '#' },
                { Icon: FaWhatsapp, href: 'https://wa.me/963XXXXXXXXX' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  transition: 'background 0.2s, color 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ color: 'var(--white)', fontWeight: 600, marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {tr('footer_links')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.65)',
                    transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.color = 'var(--terracotta)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'var(--white)', fontWeight: 600, marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {tr('footer_contact')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { Icon: FiMapPin, text: tr('dir_address') },
                { Icon: FiPhone, text: tr('dir_phone'),  href: `tel:${tr('dir_phone')}` },
                { Icon: FiMail,  text: tr('dir_email'),  href: `mailto:${tr('dir_email')}` },
              ].map(({ Icon, text, href }, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Icon size={15} style={{ color: 'var(--terracotta)', flexShrink: 0, marginTop: '2px' }} />
                  {href
                    ? <a href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = '#fff'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                      >{text}</a>
                    : <span style={{ fontSize: '14px' }}>{text}</span>
                  }
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {tr('footer_rights')}
          </p>
          <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
          >
            {tr('footer_privacy')}
          </a>
        </div>
      </div>
    </footer>
  )
}
