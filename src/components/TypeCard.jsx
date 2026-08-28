import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { FiUsers, FiArrowRight, FiArrowLeft } from 'react-icons/fi'

const TYPE_ACCENT = {
  superub: { bg: '#FDF6E3', color: '#7A5C00' },
  premium: { bg: '#E8F0FD', color: '#1A3A7A' },
  deluxe:  { bg: 'var(--olive-light)', color: 'var(--olive-dark)' },
}

export default function TypeCard({ variant, checkIn, checkOut, guests, available = null }) {
  const { language, isRTL, withLang } = useLanguage()
  const location = useLocation()
  const tr = (key) => t(language, key)

  const categoryName = tr(`type_${variant.type}`)
  const variantName  = isRTL
    ? (variant.nameAr || `${categoryName} — لـ ${variant.capacity} أشخاص`)
    : (variant.nameEn || `${categoryName} — for ${variant.capacity} persons`)
  const desc = isRTL
    ? (variant.descAr || tr(`cat_${variant.type}_desc`))
    : (variant.descEn || tr(`cat_${variant.type}_desc`))

  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight
  const mainImage = variant.heroImage
  const accent    = TYPE_ACCENT[variant.type] || TYPE_ACCENT.deluxe

  const bookingParams = new URLSearchParams({
    ...(checkIn  ? { checkIn }  : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(guests   ? { guests }   : {}),
  }).toString()

  const detailHref = withLang(`/rooms/${variant.id}${bookingParams ? `?${bookingParams}` : ''}`)
  const bookHref   = withLang(`/booking/${variant.id}${bookingParams ? `?${bookingParams}` : ''}`)
  const linkState  = { from: location.pathname }

  const isFull = available === false

  return (
    <div
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.25s, box-shadow 0.25s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
    >
      <Link to={detailHref} state={linkState} style={{ display: 'block', position: 'relative', paddingTop: '65%', overflow: 'hidden', flexShrink: 0, background: '#f3f0ea' }}>
        {mainImage ? (
          <img
            src={mainImage}
            alt={variantName}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 40 }}>🏨</div>
        )}
        <span style={{
          position: 'absolute', top: 12, [isRTL ? 'right' : 'left']: 12,
          background: accent.bg, color: accent.color, padding: '4px 11px',
          borderRadius: '100px', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          {categoryName}
        </span>
        {available !== null && (
          <span style={{
            position: 'absolute', top: 12, [isRTL ? 'left' : 'right']: 12,
            background: isFull ? '#F44336' : '#4CAF50',
            color: '#fff',
            padding: '4px 11px',
            borderRadius: '100px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            {isFull ? tr('avail_unavailable') : tr('avail_available')}
          </span>
        )}
        <span style={{
          position: 'absolute', bottom: 12, [isRTL ? 'right' : 'left']: 12,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '5px 11px',
          borderRadius: '100px',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          backdropFilter: 'blur(4px)',
          fontFamily: isRTL ? 'var(--font-ar)' : undefined,
        }}>
          <FiUsers size={13} />
          {variant.capacity} {tr('rooms_guests')}
        </span>
      </Link>

      <div className="card-body-room" style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <Link to={detailHref} state={linkState}>
            <h3 className="card-name-room" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
              {variantName}
            </h3>
          </Link>
          <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
              {isRTL ? 'السعر عند الطلب' : 'Price on Request'}
            </span>
          </div>
        </div>

        {desc && (
          <p style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
            {desc}
          </p>
        )}

        <div className="divider" />

        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
          {isFull ? (
            <button
              className="btn btn-sm"
              disabled
              style={{ flex: 1, justifyContent: 'center', background: 'var(--linen)', color: 'var(--muted)', border: '1.5px solid var(--border)', cursor: 'not-allowed' }}
            >
              {tr('avail_unavailable')}
            </button>
          ) : (
            <Link to={bookHref} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              {tr('rooms_bookNow')}
            </Link>
          )}
          <Link to={detailHref} state={linkState} className="btn btn-outline btn-sm card-cta-details" style={{ gap: 6 }}>
            {tr('rooms_details')}
            <ArrowIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
