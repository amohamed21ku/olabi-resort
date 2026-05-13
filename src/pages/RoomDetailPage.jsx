import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { getRoomById } from '../data/rooms'
import { checkAvailability } from '../firebase/services'
import { FiUsers, FiMaximize2, FiArrowLeft, FiArrowRight, FiCheck, FiCalendar } from 'react-icons/fi'

export default function RoomDetailPage() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const { language, isRTL } = useLanguage()
  const navigate = useNavigate()
  const tr = (key) => t(language, key)

  const room = getRoomById(roomId)
  const BackIcon = isRTL ? FiArrowRight : FiArrowLeft

  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = searchParams.get('guests')   || '2'

  const [activeImg, setActiveImg]     = useState(0)
  const [available, setAvailable]     = useState(null)
  const [checkingAvail, setChecking]  = useState(false)

  useEffect(() => {
    if (!checkIn || !checkOut || !room) return
    setChecking(true)
    checkAvailability(room.id, checkIn, checkOut)
      .then(v => setAvailable(v))
      .catch(() => setAvailable(true))
      .finally(() => setChecking(false))
  }, [room?.id, checkIn, checkOut])

  if (!room) {
    return (
      <div className="page-loader">
        <p style={{ color: 'var(--muted)' }}>{isRTL ? 'الغرفة غير موجودة' : 'Room not found'}</p>
        <Link to="/rooms" className="btn btn-outline">{isRTL ? 'عودة للغرف' : 'Back to Rooms'}</Link>
      </div>
    )
  }

  const name    = isRTL ? room.nameAr    : room.nameEn
  const desc    = isRTL ? room.descAr    : room.descEn
  const amenities = isRTL ? room.amenitiesAr : room.amenities
  const beds    = isRTL ? room.bedsAr    : room.beds

  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1

  const bookingParams = new URLSearchParams({
    ...(checkIn  ? { checkIn }  : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(guests   ? { guests }   : {}),
  }).toString()

  return (
    <div style={{ background: 'var(--cream)', paddingBottom: '80px' }}>
      {/* Back link */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--sand)', padding: '16px 0' }}>
        <div className="container">
          <button
            onClick={() => navigate(`/rooms${bookingParams ? `?${bookingParams}` : ''}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--muted)',
              fontSize: '14px',
              fontFamily: 'inherit',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--terracotta)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <BackIcon size={16} />
            {isRTL ? 'عودة إلى الغرف' : 'Back to Rooms'}
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '40px',
          alignItems: 'start',
        }}>
          {/* Left: gallery + details */}
          <div>
            {/* Main image */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              aspectRatio: '16/9',
              marginBottom: '12px',
            }}>
              <img
                src={room.images[activeImg]}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
              />
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
              {room.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: '80px',
                    height: '56px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: `2px solid ${activeImg === i ? 'var(--terracotta)' : 'transparent'}`,
                    padding: 0,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>

            {/* Name + type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'var(--linen)',
                color: 'var(--charcoal)',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>
                {tr(`type_${room.type}`)}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {tr('rooms_floor')} {room.floor} · #{room.number}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '20px',
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
              lineHeight: 1.2,
            }}>
              {name}
            </h1>

            {/* Quick specs */}
            <div style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              padding: '20px 0',
              borderTop: '1px solid var(--sand)',
              borderBottom: '1px solid var(--sand)',
              marginBottom: '28px',
            }}>
              {[
                { icon: <FiUsers />,      label: tr('detail_capacity'), value: `${room.capacity} ${tr('rooms_guests')}` },
                { icon: <FiMaximize2 />,  label: tr('detail_size'),     value: `${room.size} ${tr('rooms_size')}` },
                { icon: <span>🛏</span>, label: tr('detail_beds'),     value: beds },
                { icon: <span>🏢</span>, label: tr('detail_floor'),    value: room.floor },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {icon} {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '10px',
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            }}>
              {tr('detail_description')}
            </h3>
            <p style={{ fontSize: '16px', color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: '32px' }}>
              {desc}
            </p>

            {/* Amenities */}
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '14px',
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            }}>
              {tr('detail_amenities')}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '10px',
            }}>
              {amenities.map((a, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: 'var(--charcoal)',
                  background: 'var(--linen)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <FiCheck size={14} style={{ color: 'var(--olive)', flexShrink: 0 }} />
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Right: booking card (sticky) */}
          <div style={{
            position: 'sticky',
            top: 'calc(var(--header-h) + 24px)',
          }}>
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              {/* Price header */}
              <div style={{
                background: 'var(--linen)',
                padding: '24px',
                borderBottom: '1px solid var(--sand)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--terracotta)', fontFamily: 'var(--font-body)' }}>
                    ${room.price}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                    {tr('rooms_perNight')}
                  </span>
                </div>
                {checkIn && checkOut && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {nights} {tr('detail_nights')} = <strong style={{ color: 'var(--ink)' }}>${room.price * nights}</strong>
                  </p>
                )}
              </div>

              {/* Dates display */}
              {checkIn && checkOut ? (
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}>
                    {[
                      { label: tr('booking_checkIn'),  date: checkIn },
                      { label: tr('booking_checkOut'), date: checkOut },
                    ].map(({ label, date }) => (
                      <div key={label}>
                        <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                          {label}
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                    ? <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{tr('avail_checking')}</p>
                    : <span className={`badge ${available ? 'badge-green' : 'badge-red'}`}>
                        {available ? tr('avail_available') : tr('avail_unavailable')}
                      </span>
                  }
                </div>
              )}

              {/* CTA */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {available !== false && (
                  <Link
                    to={`/booking/${room.id}${bookingParams ? `?${bookingParams}` : ''}`}
                    className="btn btn-primary btn-lg"
                    style={{ justifyContent: 'center' }}
                  >
                    {tr('detail_bookRoom')}
                  </Link>
                )}
                {!checkIn && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
                    {tr('avail_select_dates')}
                  </p>
                )}

                {/* Policies */}
                <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {[tr('booking_policy1'), tr('booking_policy2'), tr('booking_policy3')].map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <FiCheck size={12} style={{ color: 'var(--olive)', flexShrink: 0, marginTop: '1px' }} />
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
