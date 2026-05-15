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
  const ForwardIcon = isRTL ? FiArrowLeft  : FiArrowRight

  const today     = new Date().toISOString().split('T')[0]
  const tomorrow  = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const guestsStr = searchParams.get('guests') || '2'
  const guests    = parseInt(guestsStr, 10)

  const [checkIn,  setCheckIn]    = useState(searchParams.get('checkIn')  || today)
  const [checkOut, setCheckOut]   = useState(searchParams.get('checkOut') || tomorrow)
  const [step, setStep]           = useState(1)
  const [submitting, setSubmit]   = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({ guestName: '', guestPhone: '', guestEmail: '', notes: '' })
  const [available, setAvailable] = useState(null)   // null = unknown, true/false once checked
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
      navigate(`/confirmation/${id}`)
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

  const steps = [tr('booking_step1'), tr('booking_step2'), tr('booking_step3')]

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--sand)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14, fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
            <BackIcon size={16} />{tr('booking_back')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((label, i) => {
              const num    = i + 1
              const done   = step > num
              const active = step === num
              return (
                <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: '100px', background: active ? 'var(--terracotta)' : done ? 'var(--olive-light)' : 'transparent', color: active ? '#fff' : done ? 'var(--olive-dark)' : 'var(--muted)', fontSize: 13, fontWeight: 600, transition: 'all 0.3s' }}>
                    {done ? <FiCheck size={13} /> : <span>{num}</span>}
                    <span className="hide-mobile">{label}</span>
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 24, height: 1, background: 'var(--sand)', margin: '0 2px' }} />}
                </div>
              )
            })}
          </div>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40 }}>
        <div className="booking-page-grid">
          <div>
            {/* Mobile price banner */}
            <div className="hide-desktop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>{isRTL ? room.nameAr : room.nameEn}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--terracotta)' }}>
                {priceLabel} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>/ {nights} {tr('detail_nights')}</span>
              </span>
            </div>

            {/* Editable stay dates — always visible across all steps */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRTL ? 'تواريخ الإقامة' : 'Stay dates'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {nights} {tr('detail_nights')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>{tr('booking_checkIn')}</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={e => handleCheckInChange(e.target.value)}
                    className="form-input"
                    style={{ padding: '10px 12px', fontSize: 14 }}
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
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 28, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
              {tr('booking_title')}
            </h1>

            {available === false && (
              <div style={{ background: '#FDECEA', border: '1px solid #F44336', color: '#8B1A10', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
              <div style={{ background: 'var(--linen)', border: '1px solid var(--sand)', color: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
                {tr('avail_checking')}
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

                <div style={{ background: 'var(--olive-light)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--olive-dark)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tr('booking_policies')}</h4>
                  {[tr('booking_policy1'), tr('booking_policy2'), tr('booking_policy3')].map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14, color: 'var(--charcoal)' }}>
                      <FiCheck size={14} style={{ color: 'var(--olive)', flexShrink: 0, marginTop: 2 }} /><span>{p}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setStep(2)}
                  disabled={available === false || checkingAvail}
                  style={{ justifyContent: 'center', gap: 8, opacity: (available === false || checkingAvail) ? 0.55 : 1, cursor: (available === false || checkingAvail) ? 'not-allowed' : 'pointer' }}
                >
                  {tr('booking_next')} <ForwardIcon size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Guest info */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>{tr('booking_guestInfo')}</h2>
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
                <button className="btn btn-primary btn-lg" onClick={() => {
                  if (!form.guestName.trim() || !form.guestPhone.trim()) { setError(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill in required fields'); return }
                  setError(''); setStep(3)
                }} style={{ justifyContent: 'center', gap: 8 }}>
                  {tr('booking_next')} <ForwardIcon size={16} />
                </button>
                {error && <div style={{ display: 'flex', gap: 8, color: 'var(--terracotta)', fontSize: 14, alignItems: 'center' }}><FiAlertCircle size={15} />{error}</div>}
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
                  {isRTL ? 'مراجعة نهائية' : 'Final Review'}
                </h2>
                <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {[...summaryItems,
                    { label: tr('booking_name'),  value: form.guestName },
                    { label: tr('booking_phone'), value: form.guestPhone },
                    ...(form.guestEmail ? [{ label: tr('booking_email'), value: form.guestEmail }] : []),
                    ...(form.notes     ? [{ label: tr('booking_notes'), value: form.notes }]      : []),
                  ].map(({ label, value }, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--linen)' : 'none', fontSize: 14, gap: 12 }}>
                      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', textAlign: isRTL ? 'left' : 'right' }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--linen)', borderTop: '2px solid var(--sand)', fontSize: 16, fontWeight: 700 }}>
                    <span>{tr('booking_total')}</span>
                    <span style={{ color: 'var(--terracotta)' }}>{priceLabel}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {isRTL
                    ? 'بالضغط على "إرسال الطلب" سيتم تسجيل طلب حجزك وفتح محادثة واتساب لإرسال التفاصيل إلى المنتجع، وسنقوم بتأكيد الحجز معك في أقرب وقت ممكن.'
                    : 'By clicking "Send Request" your booking request will be saved and WhatsApp will open to send the details to the resort. We will confirm your booking with you as soon as possible.'
                  }
                </p>
                {error && <div style={{ display: 'flex', gap: 8, color: 'var(--terracotta)', fontSize: 14, alignItems: 'center' }}><FiAlertCircle size={15} />{error}</div>}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleConfirm}
                  disabled={submitting || available === false}
                  style={{ justifyContent: 'center', opacity: (submitting || available === false) ? 0.7 : 1, cursor: (submitting || available === false) ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? tr('booking_confirming') : tr('booking_confirm')}
                </button>
              </div>
            )}
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
