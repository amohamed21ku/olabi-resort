import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { getBookingById, buildWhatsAppUrl, formatBookingNumber, getBookingRooms } from '../firebase/services'
import Seo from '../components/Seo'
import { FiCheck, FiHome, FiMessageCircle, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi'

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
  const { language, isRTL, withLang } = useLanguage()
  const tr = (key) => t(language, key)

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoOpenFailed, setAutoOpenFailed] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Captured once, before the effect below strips ?wa=1 from the URL — the
  // live searchParams value can't be used for the UI below since it changes
  // out from under it as soon as the auto-open attempt runs.
  const [wasAutoOpen] = useState(() => searchParams.get('wa') === '1')
  const shouldAutoOpen = searchParams.get('wa') === '1'
  const redirectedRef = useRef(false)

  useEffect(() => {
    getBookingById(bookingId)
      .then(b => setBooking(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bookingId])

  // Open WhatsApp with the notification message the moment the booking loads
  // (only if ?wa=1 was set by the booking flow) — no artificial delay, so
  // this stays as close as possible to the "Send Request" click that started
  // the flow, which is what a browser's popup blocker actually keys off of.
  // Strip the flag from the URL so a back-press from WhatsApp doesn't
  // re-trigger it. This can only ever *open* WhatsApp with the message
  // pre-filled — WhatsApp itself requires a human tap on Send, and there is
  // no way around that via wa.me links (by design, to prevent spam), so the
  // button below stays visible as the guaranteed fallback if the automatic
  // attempt is blocked or the tab gets missed.
  useEffect(() => {
    if (!shouldAutoOpen || !booking || redirectedRef.current) return
    redirectedRef.current = true
    setSearchParams({}, { replace: true })

    const waUrl = buildWhatsAppUrl({ ...booking, bookingId }, language)
    const waTab = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!waTab || waTab.closed || typeof waTab.closed === 'undefined') {
      setAutoOpenFailed(true)
    }
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
      <Seo
        title={tr('confirm_title')}
        description={tr('confirm_subtitle')}
        path={`/confirmation/${bookingId}`}
        lang={isRTL ? 'ar' : 'en'}
        noindex
      />
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
            {/* Booking ID + guest name — the whole block is clickable and opens
                the full booking details in a popup, not just the name text. */}
            <button
              type="button"
              onClick={() => booking && setDetailsOpen(true)}
              disabled={!booking}
              className="confirm-id-row"
              style={{
                display: 'block', width: '100%',
                background: 'var(--linen)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                border: 'none',
                cursor: booking ? 'pointer' : 'default',
                textAlign: isRTL ? 'right' : 'left',
                fontFamily: 'inherit',
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {booking?.guestName && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 20px', borderTop: '1px solid var(--white)',
                  fontSize: '15px', fontWeight: 700, color: 'var(--ink)',
                }}>
                  {isRTL ? `مرحباً، ${booking.guestName}` : `Hello, ${booking.guestName}`}
                  {detailsOpen ? <FiChevronUp size={16} color="var(--muted)" /> : <FiChevronDown size={16} color="var(--muted)" />}
                </div>
              )}
            </button>

            {/* Auto-open notice */}
            {wasAutoOpen && booking && (
              <div style={{
                background: autoOpenFailed ? 'var(--linen)' : 'var(--olive-light)',
                border: `1px solid ${autoOpenFailed ? 'var(--sand)' : 'var(--olive)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: autoOpenFailed ? 'var(--charcoal)' : 'var(--olive-dark)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                {autoOpenFailed
                  ? (isRTL
                      ? 'تعذّر فتح واتساب تلقائياً. اضغط الزر أدناه لإرسال طلبك إلى المنتجع.'
                      : "Couldn't open WhatsApp automatically. Tap the button below to send your request to the resort.")
                  : (isRTL
                      ? 'تم فتح واتساب لإرسال طلبك إلى المنتجع — يرجى الضغط على "إرسال" لإتمام الإشعار.'
                      : 'WhatsApp has opened to send your request to the resort — please tap "Send" there to complete it.')
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
                  {tr('confirm_whatsapp')}
                </a>
              )}
              <Link to={withLang('/')} className="btn btn-outline btn-lg" style={{ justifyContent: 'center', gap: '8px' }}>
                <FiHome size={16} />
                {tr('confirm_backHome')}
              </Link>
              <Link to={`${withLang('/')}#rooms`} style={{
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

      {detailsOpen && booking && (
        <div
          onClick={() => setDetailsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(28,28,20,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto',
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 22px', borderBottom: '1px solid var(--linen)',
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
                {tr('confirm_id')} #{booking.bookingNumber != null ? formatBookingNumber(booking.bookingNumber) : bookingId?.slice(0, 8).toUpperCase()}
              </h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label={isRTL ? 'إغلاق' : 'Close'}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <FiX size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          </div>
        </div>
      )}
    </div>
  )
}
