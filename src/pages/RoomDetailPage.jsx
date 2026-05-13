import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoom } from '../hooks/useRooms'
import { checkAvailability } from '../firebase/services'
import { FiUsers, FiMaximize2, FiArrowLeft, FiArrowRight, FiCheck, FiCalendar } from 'react-icons/fi'

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

  const [activeImg, setActiveImg]    = useState(0)
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
            {/* Main image */}
            {images.length > 0 ? (
              <>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', marginBottom: 12 }}>
                  <img src={images[activeImg]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} style={{ width: 80, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `2px solid ${activeImg === i ? 'var(--terracotta)' : 'transparent'}`, padding: 0, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '16/9', marginBottom: 36, background: '#f3f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#ccc' }}>🏨</div>
            )}

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
