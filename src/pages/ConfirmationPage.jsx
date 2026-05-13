import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { getBookingById, sendWhatsAppNotification } from '../firebase/services'
import { FiCheck, FiHome, FiMessageCircle } from 'react-icons/fi'

export default function ConfirmationPage() {
  const { bookingId }   = useParams()
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBookingById(bookingId)
      .then(b => setBooking(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bookingId])

  const formatDate = (d) => {
    try {
      const date = d?.toDate ? d.toDate() : new Date(d)
      return date.toLocaleDateString(isRTL ? 'ar-SY' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return '' }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--muted)' }}>{tr('loading')}</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--cream)',
      minHeight: '100vh',
      paddingBottom: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="container" style={{ maxWidth: '560px' }}>
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          textAlign: 'center',
        }}>
          {/* Success header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--olive) 0%, var(--olive-dark) 100%)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: 72, height: 72,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}>
              <FiCheck size={34} color="white" strokeWidth={2.5} />
            </div>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--white)',
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
              lineHeight: 1.2,
            }}>
              {tr('confirm_title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', maxWidth: '380px', lineHeight: 1.7 }}>
              {tr('confirm_subtitle')}
            </p>
          </div>

          {/* Booking details */}
          <div style={{ padding: '32px 40px' }}>
            {/* Booking ID */}
            <div style={{
              background: 'var(--linen)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tr('confirm_id')}
              </span>
              <code style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--terracotta)',
                fontFamily: 'monospace',
                background: 'var(--white)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                #{bookingId?.slice(0, 8).toUpperCase()}
              </code>
            </div>

            {/* Booking info */}
            {booking && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {[
                  { label: tr('booking_room'),     value: isRTL ? booking.roomNameAr : booking.roomNameEn },
                  { label: tr('booking_checkIn'),  value: formatDate(booking.checkIn) },
                  { label: tr('booking_checkOut'), value: formatDate(booking.checkOut) },
                  { label: tr('booking_nights'),   value: booking.nights },
                  { label: tr('booking_guests'),   value: booking.guests },
                  { label: tr('booking_total'),    value: `$${booking.totalPrice}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--linen)',
                  }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {booking && (
                <button
                  className="btn btn-olive btn-lg"
                  onClick={() => sendWhatsAppNotification({ ...booking, bookingId }, language)}
                  style={{ justifyContent: 'center', gap: '8px' }}
                >
                  <FiMessageCircle size={18} />
                  {tr('confirm_whatsapp')}
                </button>
              )}
              <Link to="/" className="btn btn-outline btn-lg" style={{ justifyContent: 'center', gap: '8px' }}>
                <FiHome size={16} />
                {tr('confirm_backHome')}
              </Link>
              <Link to="/rooms" style={{
                fontSize: '14px',
                color: 'var(--muted)',
                textAlign: 'center',
                padding: '8px',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--terracotta)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >
                {tr('confirm_viewRooms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
