import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { getBookingById, buildWhatsAppUrl, formatBookingNumber, getBookingRooms } from '../firebase/services'
import { FiCheck, FiHome, FiMessageCircle } from 'react-icons/fi'

const AUTO_OPEN_DELAY_MS = 3000

const STATUS_LABEL = {
  pending:      { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed:    { ar: 'مؤكد',        en: 'Confirmed' },
  'checked-in': { ar: 'داخل الفندق', en: 'Checked in' },
  'checked-out':{ ar: 'غادر',        en: 'Checked out' },
  cancelled:    { ar: 'ملغى',        en: 'Cancelled' },
}

export default function ConfirmationPage() {
  const { bookingId }   = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language, isRTL } = useLanguage()
  const tr = (key) => t(language, key)

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const shouldAutoOpen = searchParams.get('wa') === '1'
  const [countdown, setCountdown] = useState(shouldAutoOpen ? Math.ceil(AUTO_OPEN_DELAY_MS / 1000) : 0)
  const redirectedRef = useRef(false)

  useEffect(() => {
    getBookingById(bookingId)
      .then(b => setBooking(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bookingId])

  // Auto-redirect to WhatsApp once after the booking loads (only if ?wa=1
  // was set by the booking flow). Strip the flag from the URL so a back-press
  // from WhatsApp doesn't re-trigger the redirect loop.
  useEffect(() => {
    if (!shouldAutoOpen || !booking || redirectedRef.current) return

    setSearchParams({}, { replace: true })

    let remaining = Math.ceil(AUTO_OPEN_DELAY_MS / 1000)
    setCountdown(remaining)
    const tick = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) clearInterval(tick)
    }, 1000)

    const timer = setTimeout(() => {
      redirectedRef.current = true
      const waUrl = buildWhatsAppUrl({ ...booking, bookingId }, language)
      const waTab = window.open(waUrl, '_blank', 'noopener,noreferrer')
      if (!waTab || waTab.closed || typeof waTab.closed === 'undefined') {
        window.location.href = waUrl
      }
    }, AUTO_OPEN_DELAY_MS)

    return () => { clearTimeout(timer); clearInterval(tick) }
  }, [booking, shouldAutoOpen, bookingId, language, setSearchParams])

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
          <div className="confirm-header" style={{
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
          <div className="confirm-body" style={{ padding: '32px 40px' }}>
            {/* Booking ID */}
            <div className="confirm-id-row" style={{
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
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--terracotta)',
                fontFamily: 'monospace',
                background: 'var(--white)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                letterSpacing: '0.5px',
              }}>
                #{booking?.bookingNumber != null ? formatBookingNumber(booking.bookingNumber) : bookingId?.slice(0, 8).toUpperCase()}
              </code>
            </div>

            {/* Booking info */}
            {booking && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {(() => {
                  const lines = getBookingRooms(booking)
                  const roomsVal = lines.length > 1
                    ? `${lines.length} ${isRTL ? 'غرف' : 'rooms'} — ${lines.map(l => isRTL ? l.roomNameAr : (l.roomNameEn || l.roomNameAr)).filter(Boolean).join('، ')}`
                    : (isRTL ? (lines[0]?.roomNameAr || booking.roomNameAr) : (lines[0]?.roomNameEn || booking.roomNameEn))
                  const st = STATUS_LABEL[booking.status] || STATUS_LABEL.pending
                  return [
                  { label: tr('booking_room'),     value: roomsVal },
                  { label: isRTL ? 'الحالة' : 'Status', value: isRTL ? st.ar : st.en },
                  { label: tr('booking_checkIn'),  value: formatDate(booking.checkIn) },
                  { label: tr('booking_checkOut'), value: formatDate(booking.checkOut) },
                  { label: tr('booking_nights'),   value: booking.nights },
                  { label: tr('booking_guests'),   value: booking.guests },
                  { label: tr('booking_total'),    value: booking.totalPrice != null ? `${booking.totalPrice}` : (isRTL ? 'عند الطلب' : 'On Request') },
                ]})().map(({ label, value }) => (
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

            {/* Auto-open notice */}
            {shouldAutoOpen && booking && countdown > 0 && (
              <div style={{
                background: 'var(--olive-light)',
                border: '1px solid var(--olive)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--olive-dark)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                {isRTL
                  ? `سيتم تحويلك إلى واتساب خلال ${countdown} ثانية...`
                  : `Opening WhatsApp in ${countdown} second${countdown === 1 ? '' : 's'}...`
                }
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {booking && (
                <a
                  href={buildWhatsAppUrl({ ...booking, bookingId }, language)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-olive btn-lg"
                  style={{ justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <FiMessageCircle size={18} />
                  {shouldAutoOpen && countdown > 0
                    ? (isRTL ? 'فتح واتساب الآن' : 'Open WhatsApp Now')
                    : tr('confirm_whatsapp')
                  }
                </a>
              )}
              <Link to="/" className="btn btn-outline btn-lg" style={{ justifyContent: 'center', gap: '8px' }}>
                <FiHome size={16} />
                {tr('confirm_backHome')}
              </Link>
              <Link to="/#rooms" style={{
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
