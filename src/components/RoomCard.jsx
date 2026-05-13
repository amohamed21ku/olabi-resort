import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { FiUsers, FiMaximize2, FiArrowRight, FiArrowLeft } from 'react-icons/fi'

export default function RoomCard({ room, checkIn, checkOut, guests, availability = null }) {
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)

  const name  = isRTL ? room.nameAr  : room.nameEn
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight

  const bookingParams = new URLSearchParams({
    ...(checkIn  ? { checkIn }  : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(guests   ? { guests }   : {}),
  }).toString()

  const bookHref    = `/booking/${room.id}${bookingParams ? `?${bookingParams}` : ''}`
  const detailHref  = `/rooms/${room.id}${bookingParams ? `?${bookingParams}` : ''}`

  const typeColors = {
    standard:  { bg: 'var(--linen)', color: 'var(--charcoal)' },
    deluxe:    { bg: 'var(--olive-light)', color: 'var(--olive-dark)' },
    suite:     { bg: '#FDF0E8', color: '#8B4513' },
    family:    { bg: '#E8F0FD', color: '#1A3A7A' },
    penthouse: { bg: '#FDF6E3', color: '#7A5C00' },
  }
  const tc = typeColors[room.type] || typeColors.standard

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      transition: 'transform 0.25s, box-shadow 0.25s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Image */}
      <Link to={detailHref} style={{ display: 'block', position: 'relative', paddingTop: '65%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={room.image}
          alt={name}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {/* Type badge */}
        <span style={{
          position: 'absolute',
          top: '12px',
          [isRTL ? 'right' : 'left']: '12px',
          background: tc.bg,
          color: tc.color,
          padding: '4px 11px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>
          {tr(`type_${room.type}`)}
        </span>
        {/* Availability dot */}
        {availability !== null && (
          <span style={{
            position: 'absolute',
            top: '12px',
            [isRTL ? 'left' : 'right']: '12px',
            width: 10, height: 10,
            borderRadius: '50%',
            background: availability ? '#4CAF50' : '#F44336',
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        )}
      </Link>

      {/* Content */}
      <div className="card-body-room" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
        {/* Name + Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <Link to={detailHref}>
            <h3 className="card-name-room" style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.3,
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            }}>
              {name}
            </h3>
          </Link>
          <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
            <span className="card-price-room" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--terracotta)' }}>
              ${room.price}
            </span>
            <span className="card-price-label" style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
              {tr('rooms_perNight')}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="card-meta-room" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--muted)' }}>
            <FiUsers size={13} />
            {room.capacity} {tr('rooms_guests')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--muted)' }}>
            <FiMaximize2 size={13} />
            {room.size} {tr('rooms_size')}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {tr('rooms_floor')} {room.floor}
          </span>
        </div>

        {/* Amenities preview */}
        <div className="card-amenities-room" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(isRTL ? room.amenitiesAr : room.amenities).slice(0, 3).map((a, i) => (
            <span key={i} style={{
              background: 'var(--linen)',
              color: 'var(--charcoal)',
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '100px',
            }}>
              {a}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span style={{
              background: 'var(--linen)',
              color: 'var(--muted)',
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '100px',
            }}>
              +{room.amenities.length - 3}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <Link to={bookHref} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            {tr('rooms_bookNow')}
          </Link>
          <Link to={detailHref} className="btn btn-outline btn-sm card-cta-details" style={{ gap: '6px' }}>
            {tr('rooms_details')}
            <ArrowIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
