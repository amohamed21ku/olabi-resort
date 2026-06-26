import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { useHike } from '../hooks/useHike'
import { LuMountainSnow } from 'react-icons/lu'
import { FiX, FiArrowRight, FiArrowLeft, FiCheckCircle, FiCalendar } from 'react-icons/fi'

const FALLBACK_IMAGES = [
  '/static/images/assets/hike/hike-1.jpg',
  '/static/images/assets/hike/hike-3.jpg',
  '/static/images/assets/hike/hike-5.jpg',
]
const SEEN_KEY = 'olabiHikeSpotlightSeen'

function nextDate(content) {
  const today = new Date().toISOString().split('T')[0]
  return (content.upcoming || [])
    .filter(e => e?.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null
}

// First-visit popup + always-present pulsing floating button for the hike event.
// Rendered only on the home page so it never interferes with booking/admin flows.
export default function HikeSpotlight() {
  const { isRTL } = useLanguage()
  const { content } = useHike()
  const [open, setOpen]   = useState(false)
  const [show, setShow]   = useState(false) // drives the FAB entrance after mount

  useEffect(() => {
    const fab = setTimeout(() => setShow(true), 1200)
    let pop
    try {
      if (!localStorage.getItem(SEEN_KEY)) pop = setTimeout(() => setOpen(true), 2600)
    } catch { /* localStorage blocked — just skip the auto-popup */ }
    return () => { clearTimeout(fab); pop && clearTimeout(pop) }
  }, [])

  if (content.active === false) return null

  const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } }
  const close = () => { setOpen(false); markSeen() }

  const title   = (isRTL ? content.titleAr   : content.titleEn)   || content.titleAr
  const tagline = (isRTL ? content.taglineAr : content.taglineEn) || content.taglineAr
  const images  = (content.images?.length ? content.images : FALLBACK_IMAGES).slice(0, 3)
  const ev      = nextDate(content)
  const Arrow   = isRTL ? FiArrowLeft : FiArrowRight

  const dateStr = ev
    ? new Date(ev.date).toLocaleDateString(isRTL ? 'ar-SY' : 'en-GB', { month: 'long', day: 'numeric' })
    : null

  return (
    <>
      <style>{`
        @keyframes hsPop {
          0%   { opacity: 0; transform: translateY(24px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hsFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hsRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(1.9); opacity: 0;    }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        @keyframes hsFabIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hsBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        .hs-fab:hover { transform: translateY(-2px) scale(1.04) !important; box-shadow: 0 14px 34px rgba(7,19,10,0.45) !important; }
        .hs-fab:hover .hs-fab-label { max-width: 220px !important; opacity: 1 !important; margin-inline-start: 8px !important; }
      `}</style>

      {/* ── Floating pulsing button ── */}
      {show && (
        <Link
          to="/hike"
          onClick={markSeen}
          className="hs-fab"
          aria-label={title}
          style={{
            position: 'fixed', bottom: 22, zIndex: 90,
            [isRTL ? 'left' : 'right']: 22,
            display: 'inline-flex', alignItems: 'center',
            padding: '13px 16px', borderRadius: 100,
            background: 'linear-gradient(135deg, #3d5a3a 0%, #1C2B1C 100%)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 10px 28px rgba(7,19,10,0.4)',
            border: '1px solid rgba(134,239,172,0.35)',
            transition: 'transform 0.25s, box-shadow 0.25s',
            animation: 'hsFabIn 0.5s ease both',
          }}
        >
          {/* pulsing rings */}
          <span style={{ position: 'absolute', inset: 0, borderRadius: 100, border: '2px solid #86efac', animation: 'hsRing 2.4s ease-out infinite', pointerEvents: 'none' }} />
          <span style={{ position: 'relative', display: 'inline-flex', animation: 'hsBob 2.4s ease-in-out infinite' }}>
            <LuMountainSnow size={20} style={{ color: '#86efac' }} />
          </span>
          <span
            className="hs-fab-label"
            style={{
              maxWidth: 0, opacity: 0, overflow: 'hidden', whiteSpace: 'nowrap',
              fontSize: 14, fontWeight: 700, marginInlineStart: 0,
              transition: 'max-width 0.3s ease, opacity 0.25s ease, margin 0.3s ease',
              fontFamily: isRTL ? 'var(--font-ar)' : undefined,
            }}
          >
            {title}
          </span>
        </Link>
      )}

      {/* ── First-visit popup ── */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(7,19,10,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, animation: 'hsFade 0.25s ease both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              width: '100%', maxWidth: 420, background: 'var(--white)',
              borderRadius: 22, overflow: 'hidden', position: 'relative',
              boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
              animation: 'hsPop 0.4s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {/* close */}
            <button onClick={close} aria-label="Close" style={{
              position: 'absolute', top: 12, [isRTL ? 'left' : 'right']: 12, zIndex: 3,
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(0,0,0,0.45)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiX size={18} />
            </button>

            {/* image header */}
            <div style={{ position: 'relative', height: 188, background: '#07130a' }}>
              <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,19,10,0.1) 0%, rgba(7,19,10,0.75) 100%)' }} />

              {content.logoUrl && (
                <img src={content.logoUrl} alt="" style={{
                  position: 'absolute', top: 14, [isRTL ? 'right' : 'left']: 14,
                  width: 56, height: 56, objectFit: 'contain', borderRadius: 12,
                  background: 'rgba(255,255,255,0.12)', padding: 5,
                }} />
              )}

              {/* small thumbnails strip */}
              <div style={{ position: 'absolute', bottom: 12, [isRTL ? 'right' : 'left']: 14, display: 'flex', gap: 6 }}>
                {images.slice(1).map((src, i) => (
                  <img key={i} src={src} alt="" style={{
                    width: 44, height: 44, objectFit: 'cover', borderRadius: 9,
                    border: '2px solid rgba(255,255,255,0.85)',
                  }} />
                ))}
              </div>

              <span style={{
                position: 'absolute', bottom: 14, [isRTL ? 'left' : 'right']: 14,
                background: '#86efac', color: '#07130a', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.6px', padding: '4px 11px', borderRadius: 100,
              }}>
                {isRTL ? 'فعالية جديدة' : 'NEW EVENT'}
              </span>
            </div>

            {/* body */}
            <div style={{ padding: '22px 24px 26px', textAlign: isRTL ? 'right' : 'left' }}>
              <h3 style={{
                fontSize: 23, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 8,
                fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: 15, color: 'var(--charcoal)', lineHeight: 1.7, marginBottom: 16,
                fontFamily: isRTL ? 'var(--font-ar)' : undefined,
              }}>
                {tagline}
              </p>

              {/* free-for-guests + next date chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {content.residentsFree !== false && (
                  <span style={chip('var(--olive-light)', 'var(--olive-dark)', 'rgba(107,124,74,0.28)')}>
                    <FiCheckCircle size={14} />
                    {isRTL ? 'مجاني للنزلاء' : 'Free for guests'}
                  </span>
                )}
                {dateStr && (
                  <span style={chip('#fff7ed', '#c2410c', '#fed7aa')}>
                    <FiCalendar size={14} />
                    {isRTL ? `القادمة: ${dateStr}` : `Next: ${dateStr}`}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Link
                  to="/hike"
                  onClick={close}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {isRTL ? 'اكتشف الرحلة' : 'Discover the trail'}
                  <Arrow size={16} />
                </Link>
                <button onClick={close} style={{
                  padding: '0 18px', borderRadius: 100, border: '1px solid var(--sand)',
                  background: 'var(--white)', color: 'var(--muted)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: isRTL ? 'var(--font-ar)' : 'inherit',
                }}>
                  {isRTL ? 'لاحقاً' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function chip(bg, color, border) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12.5, fontWeight: 700, color,
    background: bg, border: `1px solid ${border}`,
    padding: '6px 12px', borderRadius: 100,
  }
}
