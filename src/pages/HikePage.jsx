import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../App'
import { withLangPrefix } from '../utils/i18nPath'
import { useHike } from '../hooks/useHike'
import { createHikeApplication } from '../firebase/services'
import Seo from '../components/Seo'
import {
  FiMapPin, FiSun, FiMoon, FiCamera, FiArrowRight, FiArrowLeft,
  FiCheckCircle, FiCalendar, FiUsers, FiChevronLeft, FiChevronRight, FiX,
} from 'react-icons/fi'
import { LuMountainSnow, LuTractor, LuTrees, LuWaves } from 'react-icons/lu'

// Format a YYYY-MM-DD date for display in the active language.
function fmtDate(d, language) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function HikePage() {
  const { language, isRTL } = useLanguage()
  const { content } = useHike()
  const ArrowEnd = isRTL ? FiArrowLeft : FiArrowRight

  const pick = (ar, en) => (isRTL ? content[ar] : content[en]) || content[isRTL ? en : ar] || ''

  // Only show dates that are today or later, sorted ascending.
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return (content.upcoming || [])
      .filter(e => e?.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [content.upcoming])

  const nextEvent = upcoming[0] || null
  const images = content.images?.length ? content.images : []
  const cover = images[0] || '/static/images/assets/hike/hike-1.jpg'

  // Structured data: the trail is a lasting attraction; each scheduled date is
  // an Event. Together they make the hike eligible for Google event/attraction
  // results for queries like "activities in Kasab" / "أنشطة في كسب".
  const SITE = 'https://olabiresort.com'
  const abs = (p) => (p?.startsWith('http') ? p : `${SITE}${p}`)
  const hikeJsonLd = useMemo(() => {
    const trailName = content.titleEn || "Uncle Sevak's Trail"
    const graph = [{
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: `${trailName} — Hiking in Kasab, Syria`,
      alternateName: content.titleAr || 'مسار العم سيفاك',
      description: (content.routeEn || content.introEn || 'A guided hiking trail from Olabi Resort to Eagle Mountain, Kasab.'),
      url: `${SITE}${withLangPrefix('/hike', isRTL ? 'ar' : 'en')}`,
      image: (content.images?.length ? content.images : ['/static/images/assets/hike/hike-1.jpg']).map(abs),
      isAccessibleForFree: true,
      touristType: ['Families', 'Hikers', 'Nature lovers'],
      geo: { '@type': 'GeoCoordinates', latitude: 35.9225528, longitude: 35.9830493 },
      containedInPlace: { '@type': 'Place', name: 'Kasab, Latakia Governorate, Syria' },
      isPartOf: { '@type': 'Resort', name: 'Olabi Resort', '@id': `${SITE}/#resort` },
    }]
    const eventLocation = {
      '@type': 'Place',
      name: 'Olabi Resort, Kasab',
      address: { '@type': 'PostalAddress', addressLocality: 'Kasab', addressRegion: 'Latakia Governorate', addressCountry: 'SY' },
      geo: { '@type': 'GeoCoordinates', latitude: 35.9225528, longitude: 35.9830493 },
    }
    const eventOrganizer = { '@type': 'Organization', name: 'Olabi Resort', url: SITE }
    const eventOffer = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE}${withLangPrefix('/hike', isRTL ? 'ar' : 'en')}`,
      description: 'Free and automatic for Olabi Resort guests.',
    }

    // The hike runs weekly. Declare it as a recurring event so Google and AI
    // assistants understand it is an ongoing weekly activity in Kasab — not a
    // one-off — even when no specific upcoming date is published.
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${trailName} — Weekly Guided Hike in Kasab`,
      description: content.introEn || 'A weekly guided hiking adventure from Olabi Resort to Eagle Mountain in Kasab, Syria. Free for resort guests.',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: abs(cover),
      location: eventLocation,
      organizer: eventOrganizer,
      offers: eventOffer,
      // Recurs every week (P1W). Add `byDay` here if a fixed weekday is set.
      eventSchedule: {
        '@type': 'Schedule',
        repeatFrequency: 'P1W',
        scheduleTimezone: 'Asia/Damascus',
        ...(nextEvent?.date ? { startDate: nextEvent.date } : {}),
      },
      ...(nextEvent?.date ? { startDate: nextEvent.date } : {}),
    })

    // If a concrete next date is published, also expose it as a dated instance.
    if (nextEvent?.date) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `${trailName} — Guided Hike in Kasab`,
        description: content.introEn || 'A guided hiking adventure from Olabi Resort to Eagle Mountain in Kasab, Syria.',
        startDate: nextEvent.date,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        image: abs(cover),
        location: eventLocation,
        organizer: eventOrganizer,
        offers: eventOffer,
      })
    }
    return graph
  }, [content, nextEvent, cover, isRTL])

  const scrollToForm = () => document.getElementById('hike-apply')?.scrollIntoView({ behavior: 'smooth' })

  const highlightIcons = [LuMountainSnow, LuTrees, LuWaves, FiCamera, LuTractor]

  return (
    <div style={{ background: 'var(--cream)' }}>
      <Seo
        title={isRTL
          ? 'رحلة هايكنغ أسبوعية في كسب: مسار العم سيفاك | منتجع العلبي'
          : "Weekly Hiking in Kasab: Uncle Sevak's Trail | Olabi Resort"}
        description={isRTL
          ? 'تبحث عن أنشطة في كسب؟ ينظّم منتجع العلبي رحلة هايكنغ أسبوعية مصحوبة بمرشد — مسار العم سيفاك من المنتجع إلى جبل النسر بإطلالاته الثلاث وسط غابات كسب سوريا. مجانية للنزلاء.'
          : "Looking for activities in Kasab? Olabi Resort runs a weekly guided hike — Uncle Sevak's Trail from the resort to Eagle Mountain's three panoramic viewpoints through the forests of Kasab, Syria. Free for resort guests."}
        path="/hike"
        image={cover}
        lang={isRTL ? 'ar' : 'en'}
        jsonLd={hikeJsonLd}
      />
      {/* ─── Hero ─── */}
      <section style={{
        position: 'relative', minHeight: '82vh',
        display: 'flex', alignItems: 'flex-end',
        overflow: 'hidden', background: '#07130a',
      }}>
        <img src={cover} alt="" loading="eager" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.85,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(7,19,10,0.55) 0%, rgba(7,19,10,0.25) 35%, rgba(7,19,10,0.75) 100%)',
        }} />

        <div className="container" style={{
          position: 'relative', zIndex: 2,
          padding: '0 0 56px', textAlign: isRTL ? 'right' : 'left',
        }}>
          {content.logoUrl ? (
            <img src={content.logoUrl} alt="" style={{
              width: 120, height: 120, objectFit: 'contain', marginBottom: 18,
              borderRadius: 18, background: 'rgba(255,255,255,0.08)', padding: 8,
            }} />
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 100, marginBottom: 18,
              background: 'rgba(134,239,172,0.16)', border: '1px solid rgba(134,239,172,0.35)',
            }}>
              <LuMountainSnow size={18} style={{ color: '#86efac' }} />
              <span style={{ color: '#86efac', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
                {isRTL ? 'فعالية · هايكنغ' : 'Event · Hiking'}
              </span>
            </div>
          )}

          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 64px)', fontWeight: 800, color: '#fff',
            lineHeight: 1.08, marginBottom: 14, maxWidth: 760,
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
          }}>
            {pick('titleAr', 'titleEn')}
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 22px)', color: 'rgba(255,255,255,0.9)',
            maxWidth: 620, marginBottom: 28, lineHeight: 1.6,
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
            textShadow: '0 1px 10px rgba(0,0,0,0.5)',
          }}>
            {pick('taglineAr', 'taglineEn')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button onClick={scrollToForm} className="btn btn-primary btn-lg"
              style={{ borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {isRTL ? 'سجّل للانضمام' : 'Apply to join'}
              <ArrowEnd size={16} />
            </button>
            {nextEvent && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '11px 18px', borderRadius: 100,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                fontFamily: isRTL ? 'var(--font-ar)' : undefined,
              }}>
                <FiCalendar size={15} style={{ color: '#86efac' }} />
                {isRTL ? 'الرحلة القادمة: ' : 'Next trip: '}{fmtDate(nextEvent.date, language)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Intro / the idea ─── */}
      <section className="section" style={{ background: 'var(--linen)' }}>
        <div className="container" style={{ maxWidth: 820, textAlign: 'center' }}>
          <p className="section-label">{isRTL ? 'الفكرة' : 'The idea'}</p>
          <h2 className="section-title" style={{ margin: '0 auto 20px' }}>
            {isRTL ? 'الهروب من الزحمة… واللجوء إلى الطبيعة' : 'Escape the crowds… return to nature'}
          </h2>
          <p style={{
            fontSize: '18px', color: 'var(--charcoal)', lineHeight: 1.9,
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
          }}>
            {pick('introAr', 'introEn')}
          </p>
        </div>
      </section>

      {/* ─── Route ─── */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div className="about-grid">
            <div style={{
              position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              aspectRatio: '4/3', boxShadow: 'var(--shadow-md)', order: isRTL ? 1 : 0,
              background: '#e8e0d0',
            }}>
              <img src={images[1] || cover} alt={isRTL ? 'خط سير مسار العم سيفاك من المنتجع إلى جبل النسر' : "The route of Uncle Sevak's Trail from the resort to Eagle Mountain"} loading="lazy" style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
            </div>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p className="section-label">{isRTL ? 'خط السير' : 'The route'}</p>
              <h2 className="section-title">{isRTL ? 'من المنتجع إلى جبل النسر' : 'From the resort to Eagle Mountain'}</h2>
              <p style={{
                fontSize: '16.5px', color: 'var(--charcoal)', lineHeight: 1.9, marginBottom: 24,
                fontFamily: isRTL ? 'var(--font-ar)' : undefined,
              }}>
                {pick('routeAr', 'routeEn')}
              </p>

              {/* Three enchanting views */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { Icon: LuMountainSnow, ar: 'جبل الأقرع', en: 'Mount Aqra' },
                  { Icon: LuTrees,        ar: 'ضيعة تركية', en: 'Turkish village' },
                  { Icon: LuWaves,        ar: 'البحر',      en: 'The sea' },
                ].map(({ Icon, ar, en }) => (
                  <div key={en} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 100,
                    background: 'var(--olive-light)', border: '1px solid rgba(107,124,74,0.28)',
                  }}>
                    <Icon size={17} style={{ color: 'var(--olive-dark)' }} />
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--olive-dark)',
                      fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                    }}>{isRTL ? ar : en}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Morning / Evening ─── */}
      <section className="section" style={{ background: 'var(--linen)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p className="section-label">{isRTL ? 'تجربتان في يوم واحد' : 'Two journeys, one day'}</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>
              {isRTL ? 'صباحٌ من المغامرة… ومساءٌ من الهدوء' : 'A morning of adventure… an evening of calm'}
            </h2>
          </div>
          <div style={{
            display: 'grid', gap: 22,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}>
            {[
              { Icon: FiSun,  tone: '#d97706', bg: '#fffbeb', label: isRTL ? 'الرحلة الصباحية' : 'Morning trip', body: pick('morningAr', 'morningEn') },
              { Icon: FiMoon, tone: '#4f46e5', bg: '#eef2ff', label: isRTL ? 'الرحلة المسائية' : 'Evening trip', body: pick('eveningAr', 'eveningEn') },
            ].map(({ Icon, tone, bg, label, body }) => (
              <div key={label} style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '30px',
                boxShadow: 'var(--shadow-md)', border: '1px solid var(--sand)',
                textAlign: isRTL ? 'right' : 'left',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, background: bg, color: tone,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{
                  fontSize: 21, fontWeight: 700, color: 'var(--ink)', marginBottom: 12,
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                }}>{label}</h3>
                <p style={{
                  fontSize: 16, color: 'var(--charcoal)', lineHeight: 1.85,
                  fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Highlights row */}
          {content.highlights?.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 36,
            }}>
              {content.highlights.map((h, i) => {
                const Icon = highlightIcons[i % highlightIcons.length]
                return (
                  <div key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 9,
                    padding: '10px 18px', borderRadius: 100, background: 'var(--white)',
                    border: '1px solid var(--sand)', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <Icon size={17} style={{ color: 'var(--terracotta)' }} />
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--charcoal)',
                      fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                    }}>{(isRTL ? h.ar : h.en) || h.ar || h.en}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Gallery ─── */}
      {images.length > 0 && (
        <section className="section" style={{ background: 'var(--cream)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p className="section-label">{isRTL ? 'لقطات من الطريق' : 'From the trail'}</p>
              <h2 className="section-title" style={{ margin: '0 auto' }}>
                {isRTL ? 'معرض الصور' : 'Gallery'}
              </h2>
            </div>
            <HikeGallery images={images} title={pick('titleAr', 'titleEn')} />
          </div>
        </section>
      )}

      {/* ─── Pricing note + upcoming dates + application ─── */}
      <section id="hike-apply" className="section" style={{ background: 'var(--linen)', scrollMarginTop: 'var(--header-h)' }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{
            display: 'grid', gap: 24,
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
            alignItems: 'start',
          }} className="hike-apply-grid">
            {/* Left: info */}
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p className="section-label">{isRTL ? 'الانضمام' : 'Join us'}</p>
              <h2 className="section-title">{isRTL ? 'احجز مكانك في الرحلة' : 'Reserve your spot'}</h2>

              {/* Resident free / external paid */}
              <div style={{
                background: 'var(--olive-light)', border: '1px solid rgba(107,124,74,0.28)',
                borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <FiCheckCircle size={18} style={{ color: 'var(--olive-dark)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{
                    fontSize: 15, color: 'var(--olive-dark)', lineHeight: 1.7, fontWeight: 600,
                    fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                  }}>{pick('priceNoteAr', 'priceNoteEn')}</p>
                </div>
                {content.priceExternal != null && content.priceExternal !== '' && (
                  <p style={{
                    fontSize: 14, color: 'var(--charcoal)', marginTop: 10,
                    paddingTop: 10, borderTop: '1px dashed rgba(107,124,74,0.3)',
                    fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                  }}>
                    {isRTL ? 'رسوم المشاركة لغير النزلاء: ' : 'Participation fee for non-guests: '}
                    <strong>${content.priceExternal}</strong>
                    {' '}{isRTL ? 'للشخص' : 'per person'}
                  </p>
                )}
              </div>

              {/* Upcoming dates list */}
              <h3 style={{
                fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
              }}>
                <FiCalendar size={16} style={{ color: 'var(--terracotta)' }} />
                {isRTL ? 'المواعيد القادمة' : 'Upcoming trips'}
              </h3>
              {upcoming.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                  {isRTL ? 'سيُعلن عن المواعيد القادمة قريباً. سجّل اهتمامك وسنتواصل معك.' : 'Upcoming dates will be announced soon. Register your interest and we will contact you.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcoming.map((e, i) => (
                    <div key={e.id || i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--white)', border: '1px solid var(--sand)',
                      borderRadius: 'var(--radius-md)', padding: '12px 14px',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: 'var(--olive-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <FiSun size={18} style={{ color: 'var(--olive-dark)' }} />
                      </div>
                      <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                          {fmtDate(e.date, language)}
                        </p>
                        {(isRTL ? e.timeAr : e.timeEn) && (
                          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
                            {isRTL ? e.timeAr : e.timeEn}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: application form */}
            <ApplicationForm upcoming={upcoming} isRTL={isRTL} language={language} />
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .hike-apply-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Application form
───────────────────────────────────────────────────────────── */
function ApplicationForm({ upcoming, isRTL, language }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', partySize: 2,
    isResident: false, eventDate: '', notes: '',
  })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!form.eventDate && upcoming.length) set('eventDate', upcoming[0].date)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming])

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError(isRTL ? 'الرجاء إدخال الاسم ورقم الهاتف' : 'Please enter your name and phone number')
      return
    }
    setError('')
    // Show success immediately — the write is queued by Firestore's persistent
    // cache and syncs in the background, so it feels instant even on a weak
    // connection. The application lands in the admin panel; no WhatsApp step.
    setDone(true)
    createHikeApplication(form).catch(err => {
      console.error('Hike application failed to sync:', err)
    })
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--sand)', background: 'var(--white)',
    fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl = {
    display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--charcoal)',
    marginBottom: 6, fontFamily: isRTL ? 'var(--font-ar)' : undefined,
  }

  if (done) {
    return (
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '36px 28px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--sand)', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--olive-light)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <FiCheckCircle size={32} style={{ color: 'var(--olive-dark)' }} />
        </div>
        <h3 style={{
          fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 10,
          fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
        }}>
          {isRTL ? 'تم استلام طلبك!' : 'Application received!'}
        </h3>
        <p style={{ fontSize: 15, color: 'var(--charcoal)', lineHeight: 1.7, fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
          {isRTL
            ? 'شكراً لك! سجّلنا طلبك للانضمام إلى الرحلة، وسيتواصل معك فريق المنتجع قريباً لتأكيد مشاركتك.'
            : 'Thank you! Your request to join the trip has been recorded. The resort team will contact you soon to confirm your spot.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{
      background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '28px',
      boxShadow: 'var(--shadow-md)', border: '1px solid var(--sand)',
      display: 'flex', flexDirection: 'column', gap: 16, textAlign: isRTL ? 'right' : 'left',
    }}>
      <div>
        <label style={lbl}>{isRTL ? 'الاسم الكامل *' : 'Full name *'}</label>
        <input style={inp} value={form.name} onChange={e => set('name', e.target.value)}
          placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>{isRTL ? 'رقم الهاتف *' : 'Phone *'}</label>
          <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+963 9XX XXX XXX" inputMode="tel" />
        </div>
        <div>
          <label style={lbl}>{isRTL ? 'عدد الأشخاص' : 'Party size'}</label>
          <div style={{ position: 'relative' }}>
            <FiUsers size={15} style={{ position: 'absolute', top: '50%', [isRTL ? 'right' : 'left']: 12, transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input type="number" min={1} max={30} style={{ ...inp, [isRTL ? 'paddingRight' : 'paddingLeft']: 34 }}
              value={form.partySize} onChange={e => set('partySize', e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <label style={lbl}>{isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}</label>
        <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)}
          placeholder={isRTL ? 'بريدك@الإلكتروني.com' : 'you@email.com'} />
      </div>

      {upcoming.length > 0 && (
        <div>
          <label style={lbl}>{isRTL ? 'اختر الموعد' : 'Choose a date'}</label>
          <select style={inp} value={form.eventDate} onChange={e => set('eventDate', e.target.value)}>
            {upcoming.map((e, i) => (
              <option key={e.id || i} value={e.date}>
                {fmtDate(e.date, language)}{(isRTL ? e.timeAr : e.timeEn) ? ` — ${isRTL ? e.timeAr : e.timeEn}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        padding: '11px 14px', borderRadius: 10,
        border: `1px solid ${form.isResident ? 'var(--olive)' : 'var(--sand)'}`,
        background: form.isResident ? 'var(--olive-light)' : 'var(--white)',
      }}>
        <input type="checkbox" checked={form.isResident} onChange={e => set('isResident', e.target.checked)}
          style={{ accentColor: 'var(--olive-dark)', width: 16, height: 16 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
          {isRTL ? 'أنا نزيل حالياً في منتجع العلبي' : "I'm currently a guest at Olabi Resort"}
        </span>
      </label>

      <div>
        <label style={lbl}>{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
        <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={2}
          value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder={isRTL ? 'أي تفاصيل تودّ إخبارنا بها…' : 'Anything you want us to know…'} />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', margin: 0, fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg"
        style={{ borderRadius: 100, justifyContent: 'center' }}>
        {isRTL ? 'إرسال الطلب' : 'Submit application'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', margin: 0, fontFamily: isRTL ? 'var(--font-ar)' : undefined }}>
        {isRTL ? 'سيتواصل معك فريق المنتجع لتأكيد مشاركتك.' : 'The resort team will contact you to confirm your spot.'}
      </p>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────
   Gallery with lightbox
───────────────────────────────────────────────────────────── */
function HikeGallery({ images, title }) {
  const [open, setOpen] = useState(null)
  const go = (n) => setOpen((n + images.length) % images.length)

  return (
    <>
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gridAutoRows: '180px',
      }}>
        {images.map((src, i) => (
          <button key={src + i} onClick={() => setOpen(i)} style={{
            border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden',
            borderRadius: 'var(--radius-md)', background: '#e8e0d0',
            gridRow: i % 5 === 0 ? 'span 2' : 'span 1',
          }}>
            <img src={src} alt={`${title} ${i + 1}`} loading="lazy" style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.4s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </button>
        ))}
      </div>

      {open != null && (
        <div onClick={() => setOpen(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <button onClick={() => setOpen(null)} style={lbBtn('top')} aria-label="Close"><FiX size={22} /></button>
          <button onClick={e => { e.stopPropagation(); go(open - 1) }} style={lbBtn('left')} aria-label="Previous"><FiChevronLeft size={26} /></button>
          <img src={images[open]} alt={`${title} ${open + 1}`} onClick={e => e.stopPropagation()} style={{
            maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8,
          }} />
          <button onClick={e => { e.stopPropagation(); go(open + 1) }} style={lbBtn('right')} aria-label="Next"><FiChevronRight size={26} /></button>
        </div>
      )}
    </>
  )
}

function lbBtn(pos) {
  const base = {
    position: 'fixed', zIndex: 201, width: 46, height: 46, borderRadius: '50%',
    background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }
  if (pos === 'top')   return { ...base, top: 20, right: 20 }
  if (pos === 'left')  return { ...base, top: '50%', left: 20, transform: 'translateY(-50%)' }
  return { ...base, top: '50%', right: 20, transform: 'translateY(-50%)' }
}
