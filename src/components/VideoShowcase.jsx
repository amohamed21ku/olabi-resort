import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '../App'

const VIDEO_SRC = '/static/images/assets/for website 1.mp4'

export default function VideoShowcase() {
  const { language, isRTL } = useLanguage()
  const videoRef   = useRef(null)
  const sectionRef = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [muted,    setMuted]    = useState(false)
  const [visible,  setVisible]  = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
      setPlaying(false)
    } else {
      v.muted = false
      v.play()
        .then(() => setPlaying(true))
        .catch(() => { v.muted = true; v.play().then(() => setPlaying(true)) })
    }
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100)
  }

  const seek = (e) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const headline = isRTL
    ? 'اكتشف المنتجع في أبهى صوره'
    : 'A place that speaks for itself'

  const subline = isRTL
    ? 'جولة بصرية في الغرف والمدرّجات والإطلالات التي تجعل منتجع العلبي تجربةً لا تُنسى.'
    : 'Walk through the rooms, terraces, and views that make Olabi an unforgettable mountain escape.'

  return (
    <section
      ref={sectionRef}
      style={{ background: '#07130a', padding: '80px 0 88px' }}
    >
      <style>{`
        @keyframes vsSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="container">

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <p className="section-label" style={{ color: 'var(--terracotta)' }}>
            {isRTL ? 'تجربة المنتجع' : 'Resort Experience'}
          </p>
          <h2 className="section-title" style={{
            color: '#ffffff',
            margin: '0 auto 14px',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
          }}>
            {headline}
          </h2>
          <p className="section-subtitle" style={{
            color: 'rgba(255,255,255,0.52)',
            margin: '0 auto',
            fontFamily: isRTL ? 'var(--font-ar)' : undefined,
          }}>
            {subline}
          </p>
        </div>

        {/* Player */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.97)',
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(61,90,58,0.4), 0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div
            style={{ position: 'relative', aspectRatio: '16/9', cursor: 'pointer', background: '#040c06' }}
            onClick={toggle}
          >
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              playsInline
              preload="metadata"
              onTimeUpdate={onTimeUpdate}
              onEnded={() => { setPlaying(false); setProgress(0) }}
            />

            {/* Dark overlay when paused */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.28)',
              opacity: playing ? 0 : 1,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }} />

            {/* Play button */}
            {!playing && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '14px',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: '76px', height: '76px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255,255,255,0.30)',
                  boxShadow: '0 0 40px rgba(61,90,58,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '11px',
                  letterSpacing: '2.5px',
                  textTransform: isRTL ? 'none' : 'uppercase',
                  fontFamily: isRTL ? 'var(--font-ar)' : undefined,
                }}>
                  {isRTL ? 'شاهد الفيلم' : 'Watch the film'}
                </p>
              </div>
            )}

            {/* Controls (visible on hover when playing) */}
            {playing && (
              <div
                className="video-controls"
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '32px 20px 16px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Progress bar */}
                <div
                  style={{
                    width: '100%', height: '3px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                  onClick={seek}
                >
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--terracotta)',
                    borderRadius: '2px',
                    transition: 'width 0.25s linear',
                  }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={toggle} style={{ color: 'rgba(255,255,255,0.75)', background: 'none', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={toggleMute}
                    style={{ color: 'rgba(255,255,255,0.6)', background: 'none', cursor: 'pointer' }}
                  >
                    {muted
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
