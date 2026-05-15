import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { t } from '../translations'
import { useRoom } from '../hooks/useRooms'
import { createBooking, checkAvailability } from '../firebase/services'
import { FiArrowLeft, FiArrowRight, FiCheck, FiAlertCircle } from 'react-icons/fi'

export default function BookingPage() {
  const { roomId }      = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language, isRTL } = useLanguage()
  const navigate        = useNavigate()
  const tr = (key) => t(language, key)

  const { room, loading } = useRoom(roomId)
  const BackIcon    = isRTL ? FiArrowRight : FiArrowLeft

  const today     = new Date().toISOString().split('T')[0]
  const tomorrow  = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const guestsStr = searchParams.get('guests') || '2'
  const guests    = parseInt(guestsStr, 10)

  const [checkIn,  setCheckIn]    = useState(searchParams.get('checkIn')  || today)
  const [checkOut, setCheckOut]   = useState(searchParams.get('checkOut') || tomorrow)
  const [submitting, setSubmit]   = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({ guestName: '', guestPhone: '', guestEmail: '', notes: '' })
  const [available, setAvailable] = useState(null)
  const [checkingAvail, setChecking] = useState(false)

  const nights      = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
  const totalPrice  = (room && room.price) ? room.price * nights : null
  const minCheckOut = new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0]

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleCheckInChange = (val) => {
    if (!val) return
    setCheckIn(val)
    if (new Date(val) >= new Date(checkOut)) {
      setCheckOut(new Date(new Date(val).getTime() + 86400000).toISOString().split('T')[0])
    }
    setError('')
  }
  const handleCheckOutChange = (val) => {
    if (!val) return
    if (new Date(val) > new Date(checkIn)) {
      setCheckOut(val)
      setError('')
    }
  }

  useEffect(() => {
    setSearchParams({ checkIn, checkOut, guests: guestsStr }, { replace: true })
  }, [checkIn, checkOut])

  useEffect(() => {
    if (!room || !checkIn || !checkOut) return
    setChecking(true)
    checkAvailability(room.id, checkIn, checkOut)
      .then(v => setAvailable(v))
      .catch(() => setAvailable(true))
      .finally(() => setChecking(false))
  }, [room?.id, checkIn, checkOut])

  const unavailableMsg = isRTL
    ? 'هذه الغرفة محجوزة في التواريخ المختارة. يرجى اختيار تواريخ أخرى أو غرفة أخرى.'
    : 'This room is already booked for the selected dates. Please choose different dates or another room.'

  const formatDate = (d) => new Date(d).toLocaleDateString(
    isRTL ? 'ar-SY' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  const priceLabel = totalPrice != null ? `$${totalPrice}` : (isRTL ? 'عند الطلب' : 'On Request')

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

  const mainImage = room.images?.[0] || room.image || null

  const summaryItems = [
    { label: tr('booking_room'),     value: isRTL ? room.nameAr : room.nameEn },
    { label: tr('booking_checkIn'),  value: formatDate(checkIn) },
    { label: tr('booking_checkOut'), value: formatDate(checkOut) },
    { label: tr('booking_nights'),   value: nights },
    { label: tr('booking_guests'),   value: guests },
    { label: tr('booking_pricePerN'),value: room.price ? `$${room.price}` : (isRTL ? 'عند الطلب' : 'On Request') },
  ]

  const handleConfirm = async () => {
    if (submitting) return
    if (!form.guestName.trim())  { setError(tr('required_field') + ' — ' + tr('booking_name'));  return }
    if (!form.guestPhone.trim()) { setError(tr('required_field') + ' — ' + tr('booking_phone')); return }
    if (available === false) { setError(unavailableMsg); return }
    setError('')
    setSubmit(true)

    try {
      const { id } = await createBooking({
        roomId:     room.id,
        roomNumber: room.number,
        roomNameEn: room.nameEn,
        roomNameAr: room.nameAr,
        checkIn, checkOut, nights, guests,
        totalPrice,
        guestName:  form.guestName.trim(),
        guestPhone: form.guestPhone.trim(),
        guestEmail: form.guestEmail.trim(),
        notes:      form.notes.trim(),
      })
      navigate(`/confirmation/${id}?wa=1`)
    } catch (err) {
      console.error('createBooking failed:', err?.code, err?.message, err)
      if (err?.code === 'ROOM_UNAVAILABLE' || err?.message === 'ROOM_UNAVAILABLE') {
        setAvailable(false)
        setError(unavailableMsg)
      } else {
        const code = err?.code || err?.message
        setError(code ? `${tr('error_generic')} [${code}]` : tr('error_generic'))
      }
      setSubmit(false)
    }
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--sand)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14, fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
            <BackIcon size={16} />{tr('booking_back')}
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)', margin: 0 }}>
            {tr('booking_title')}
          </h1>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        <div className="booking-page-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Mobile price banner */}
            <div className="hide-desktop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>{isRTL ? room.nameAr : room.nameEn}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--terracotta)' }}>
                {priceLabel} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>/ {nights} {tr('detail_nights')}</span>
              </span>
            </div>

            {/* Room preview */}
            <div className="booking-room-preview" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex' }}>
              <div className="booking-room-img" style={{ width: 180, flexShrink: 0, background: '#f3f0ea' }}>
                {mainImage
                  ? <img src={mainImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#ccc' }}>🏨</div>
                }
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--terracotta)' }}>{tr(`type_${room.type}`)}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{isRTL ? room.nameAr : room.nameEn}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{tr('rooms_floor')} {room.floor} · #{room.number} · {room.capacity} {tr('rooms_guests')}</p>
              </div>
            </div>

            {/* Editable stay dates */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRTL ? 'تواريخ الإقامة' : 'Stay dates'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {nights} {tr('detail_nights')}
                </span>
              </div>
              <div className="stay-dates-grid">
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>{tr('booking_checkIn')}</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={e => handleCheckInChange(e.target.value)}
                    className="form-input"
                    style={{ padding: '12px 14px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>{tr('booking_checkOut')}</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={minCheckOut}
                    onChange={e => handleCheckOutChange(e.target.value)}
                    className="form-input"
                    style={{ padding: '12px 14px' }}
                  />
                </div>
              </div>
            </div>

            {available === false && (
              <div style={{ background: '#FDECEA', border: '1px solid #F44336', color: '#8B1A10', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, lineHeight: 1.6 }}>{unavailableMsg}</span>
                  <Link to="/rooms" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                    {isRTL ? 'تصفح غرف أخرى' : 'Browse other rooms'}
                  </Link>
                </div>
              </div>
            )}
            {checkingAvail && (
              <div style={{ background: 'var(--linen)', border: '1px solid var(--sand)', color: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13 }}>
                {tr('avail_checking')}
              </div>
            )}

            {/* Booking summary */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {summaryItems.map(({ label, value }, i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < summaryItems.length - 1 ? '1px solid var(--linen)' : 'none', fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--linen)', borderTop: '2px solid var(--sand)', fontSize: 16, fontWeight: 700 }}>
                <span style={{ color: 'var(--ink)' }}>{tr('booking_total')}</span>
                <span style={{ color: 'var(--terracotta)' }}>{priceLabel}</span>
              </div>
            </div>

            {/* Guest info */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)', margin: 0 }}>{tr('booking_guestInfo')}</h2>
              {[
                { key: 'guestName',  label: tr('booking_name'),  placeholder: tr('booking_namePlaceholder'),  required: true },
                { key: 'guestPhone', label: tr('booking_phone'), placeholder: tr('booking_phonePlaceholder'), required: true, type: 'tel' },
                { key: 'guestEmail', label: tr('booking_email'), placeholder: tr('booking_emailPlaceholder'), required: false, type: 'email' },
              ].map(({ key, label, placeholder, required, type = 'text' }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label} {required && <span style={{ color: 'var(--terracotta)' }}>*</span>}</label>
                  <input type={type} value={form[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder} className="form-input" required={required} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">{tr('booking_notes')}</label>
                <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder={tr('booking_notesPlaceholder')} className="form-input" rows={3} style={{ resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </div>

            {/* Policies */}
            <div style={{ background: 'var(--olive-light)', borderRadius: 'var(--radius-md)', padding: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--olive-dark)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tr('booking_policies')}</h4>
              {[tr('booking_policy1'), tr('booking_policy2'), tr('booking_policy3')].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14, color: 'var(--charcoal)' }}>
                  <FiCheck size={14} style={{ color: 'var(--olive)', flexShrink: 0, marginTop: 2 }} /><span>{p}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
              {isRTL
                ? 'بالضغط على "إرسال الطلب" سيتم تسجيل طلب حجزك وفتح محادثة واتساب لإرسال التفاصيل إلى المنتجع، وسنقوم بتأكيد الحجز معك في أقرب وقت ممكن.'
                : 'By clicking "Send Request" your booking request will be saved and WhatsApp will open to send the details to the resort. We will confirm your booking with you as soon as possible.'
              }
            </p>

            {error && <div style={{ display: 'flex', gap: 8, color: 'var(--terracotta)', fontSize: 14, alignItems: 'center' }}><FiAlertCircle size={15} />{error}</div>}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirm}
              disabled={submitting || available === false || checkingAvail}
              style={{ justifyContent: 'center', opacity: (submitting || available === false || checkingAvail) ? 0.7 : 1, cursor: (submitting || available === false || checkingAvail) ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? tr('booking_confirming') : tr('booking_confirm')}
            </button>
          </div>

          {/* Sticky summary sidebar */}
          <div className="booking-sidebar" style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {mainImage
                ? <img src={mainImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: 160, background: '#f3f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#ccc' }}>🏨</div>
              }
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{tr(`type_${room.type}`)}</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{isRTL ? room.nameAr : room.nameEn}</h3>
                <div className="divider" />
                <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {room.price && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--muted)' }}>${room.price} × {nights} {tr('detail_nights')}</span>
                      <span style={{ fontWeight: 600 }}>${totalPrice}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, paddingTop: 8, borderTop: '1px solid var(--sand)' }}>
                    <span>{tr('booking_total')}</span>
                    <span style={{ color: 'var(--terracotta)' }}>{priceLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
