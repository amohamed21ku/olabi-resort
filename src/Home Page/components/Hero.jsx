import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const HERO_VIDEO = '/static/images/assets/hero-bg.MP4';
const HERO_LOGO  = '/static/images/assets/olabi-logo.jpg';

const Hero = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const videoRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [vidLoaded, setVidLoaded] = useState(false);

  /* scroll tracker */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* force-play the video (bypasses autoplay policy on some browsers) */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => {
      v.play().catch(() => {});
      setVidLoaded(true);
    };
    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener('canplay', tryPlay, { once: true });
    }
    return () => v.removeEventListener('canplay', tryPlay);
  }, []);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const headline = isAr
    ? { pre: 'البحرُ والجبلُ', mid: 'في', highlight: 'حضنٍ', post: 'واحد.' }
    : { pre: 'The sea and the mountain,', mid: '', highlight: 'one', post: 'embrace.' };

  const subline = isAr
    ? 'منتجعٌ عائليٌّ في مرتفعات كسب — نسمةُ صنوبر، هدوءٌ طويل، ومائدةٌ كأنّها بيتك.'
    : 'A family resort in the heights of Kasab — pine on the breeze, slow afternoons, and a table that feels like home.';

  const overline = isAr
    ? 'منتجع العلبي · كسب — الساحل السوري'
    : 'Olabi Resort · Kasab — Syrian Coast';

  return (
    <section
      id="home"
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center"
    >
      {/* ─── KEYFRAMES (scoped to hero) ─────────────────── */}
      <style>{`
        @keyframes heroLogoReveal {
          0%   { opacity: 0; transform: translateY(-18px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes logoPulseGlow {
          0%, 100% { box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 0   rgba(224,208,181,0); }
          50%       { box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 60px rgba(224,208,181,0.35); }
        }
        @keyframes sparkleRise {
          0%   { transform: translateY(0)     scale(1);   opacity: 0;   }
          8%   { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-98vh) scale(0.4); opacity: 0;   }
        }
        @keyframes ctaPulseRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-120%); }
          60%  { transform: translateX(240%);  }
          100% { transform: translateX(240%);  }
        }
        @keyframes badgeDot {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* ─── VIDEO BACKGROUND ───────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* fallback colour while video loads */}
        <div className="absolute inset-0 bg-[#0a2331]" />

        <video
          ref={videoRef}
          src={HERO_VIDEO}
          className="absolute inset-0 w-full h-full object-cover animate-ken-burn"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/static/images/assets/hero-bg.png"
        />

        {/* cinematic darkening gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,35,49,0.82) 0%, rgba(10,35,49,0.48) 25%, rgba(10,35,49,0.30) 48%, rgba(10,35,49,0.60) 75%, rgba(10,35,49,0.94) 100%)',
          }}
        />
        {/* radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(78% 60% at 50% 55%, transparent 0%, rgba(10,35,49,0.32) 65%, rgba(10,35,49,0.72) 100%)',
          }}
        />
        {/* warm aegean tint */}
        <div
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            background:
              'radial-gradient(55% 80% at 18% 30%, rgba(207,224,231,0.55) 0%, transparent 70%), radial-gradient(40% 60% at 85% 80%, rgba(232,184,58,0.22) 0%, transparent 70%)',
          }}
        />
        {/* subtle film grain */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* ─── RISING SPARKLE PARTICLES ───────────────────── */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        {[
          { left: '9%',  delay: '0s',    dur: '13s', size: 2.5 },
          { left: '24%', delay: '4.5s',  dur: '17s', size: 2   },
          { left: '47%', delay: '8s',    dur: '11s', size: 3.5 },
          { left: '68%', delay: '2s',    dur: '15s', size: 2   },
          { left: '83%', delay: '11s',   dur: '14s', size: 3   },
          { left: '58%', delay: '6s',    dur: '19s', size: 2   },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.left,
              bottom: '5%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: 'rgba(224,208,181,0.95)',
              boxShadow: `0 0 ${p.size * 3}px rgba(224,208,181,0.9)`,
              animation: `sparkleRise ${p.dur} ease-in ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ─── INSET FRAME LINES ──────────────────────────── */}
      <div className="absolute inset-x-6 lg:inset-x-12 top-[130px] lg:top-[150px] h-px bg-white/12 z-10 pointer-events-none" />
      <div className="absolute inset-x-6 lg:inset-x-12 bottom-6 h-px bg-white/12 z-10 pointer-events-none" />

      {/* ─── TOP META STRIP ─────────────────────────────── */}
      <div className="absolute top-[140px] lg:top-[160px] inset-x-0 z-20 pointer-events-none">
        <div
          className="container-resort flex items-center justify-between text-white/65 text-[10px] tracking-[0.4em] uppercase"
          style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.14em', fontWeight: 500 } : {}}
        >
          <span>{isAr ? '— ٠١ / مرحبًا' : '— 01 / Arrive'}</span>
          <span className="hidden md:inline">✶ {isAr ? 'منذ ١٩٨٥' : 'Est. 1985'}</span>
          <span className="hidden md:inline" dir="ltr" style={{ fontFamily: 'var(--font-sans)' }}>
            35.92° N · 35.91° E
          </span>
        </div>
      </div>

      {/* ─── FLOATING SIDE BADGE ────────────────────────── */}
      <aside
        className={`hidden lg:flex absolute z-20 flex-col items-center gap-3 ${isAr ? 'left-10' : 'right-10'} top-1/2 -translate-y-1/2 text-white/75`}
      >
        <SunEmblem className="w-14 h-14 text-[var(--lemon-soft)] animate-spin-slow" />
        <span className="text-[9px] tracking-[0.38em] uppercase rotate-[-90deg] origin-center mt-12 whitespace-nowrap opacity-70">
          {isAr ? 'صيف · ٢٠٢٦' : 'Summer · 2026'}
        </span>
      </aside>

      {/* ─── CENTER CONTENT ─────────────────────────────── */}
      <div className="relative z-10 container-resort pt-44 pb-32 text-center">

        {/* LOGO CARD — hero centrepiece */}
        <div className="flex justify-center mb-8" style={{ animation: 'heroLogoReveal 1s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
          <div className="relative group">
            {/* glow halo behind card */}
            <div
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(224,208,181,0.25) 0%, transparent 70%)',
                filter: 'blur(18px)',
              }}
            />
            {/* logo card */}
            <div
              className="relative bg-white rounded-2xl px-8 py-4 border border-white/60 transition-transform duration-500 group-hover:scale-[1.04]"
              style={{ animation: 'logoPulseGlow 4s ease-in-out 1.2s infinite' }}
            >
              <img
                src={HERO_LOGO}
                alt="Olabi Resort Kasab"
                className="h-20 lg:h-28 w-auto object-contain select-none"
                draggable="false"
              />
            </div>
          </div>
        </div>

        {/* SEASON OPEN BADGE */}
        <div className="flex justify-center mb-6 animate-fade-in-up delay-100">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
          >
            <span
              className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: 'badgeDot 1.8s ease-in-out infinite' }}
            />
            <span
              className="text-white/90 text-[11px] tracking-[0.3em] uppercase"
              style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.18em', fontWeight: 600 } : {}}
            >
              {isAr ? 'الموسم ٢٠٢٦ · مفتوح الآن' : 'Season 2026 · Now Open'}
            </span>
          </div>
        </div>

        {/* EYEBROW */}
        <p className="inline-flex items-center gap-3 text-white/65 text-[10px] tracking-[0.42em] uppercase animate-fade-in-up delay-200">
          <span className="block w-8 h-px bg-white/45" />
          {overline}
          <span className="block w-8 h-px bg-white/45" />
        </p>

        {/* HEADLINE */}
        <h1
          className="text-white mx-auto mt-6 max-w-[18ch] text-balance animate-fade-in-up delay-300"
          style={
            isAr
              ? {
                  fontFamily: 'var(--font-display-ar)',
                  fontWeight: 600,
                  fontSize: 'clamp(2.6rem, 7.8vw, 6.5rem)',
                  lineHeight: 1.12,
                  textShadow: '0 4px 30px rgba(10,35,49,0.6)',
                }
              : {
                  fontFamily: 'var(--font-display)',
                  fontVariationSettings: "'SOFT' 70, 'opsz' 144",
                  fontWeight: 380,
                  fontSize: 'clamp(3rem, 8.8vw, 7.5rem)',
                  lineHeight: 0.98,
                  letterSpacing: '-0.025em',
                  textShadow: '0 4px 30px rgba(10,35,49,0.6)',
                }
          }
        >
          {headline.pre}{' '}
          {headline.mid && <>{headline.mid} </>}
          <span
            style={
              isAr
                ? { fontFamily: 'var(--font-accent-ar)', fontWeight: 700, color: 'var(--sand)' }
                : {
                    fontFamily: 'var(--font-italic)',
                    fontStyle: 'italic',
                    fontVariationSettings: "'SOFT' 100, 'opsz' 144",
                    color: 'var(--sand)',
                    fontWeight: 360,
                  }
            }
          >
            {headline.highlight}
          </span>{' '}
          {headline.post}
        </h1>

        {/* SUBLINE */}
        <p
          className="text-white/80 mt-7 mx-auto max-w-[56ch] text-pretty animate-fade-in-up delay-500"
          style={{
            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
            lineHeight: isAr ? 1.95 : 1.68,
            textShadow: '0 2px 12px rgba(10,35,49,0.4)',
          }}
        >
          {subline}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-700">
          {/* Primary — pulsing ring + shimmer */}
          <div className="relative">
            {/* pulse ring */}
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'var(--terracotta)',
                animation: 'ctaPulseRing 2.6s cubic-bezier(0.4,0,0.6,1) 2s infinite',
              }}
            />
            <button
              onClick={() => scrollTo('booking')}
              className="btn-clay px-8 py-4 relative"
            >
              {/* shimmer sweep */}
              <span
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.30) 50%, transparent 62%)',
                  animation: 'shimmerSweep 3.4s ease-in-out 1.8s infinite',
                }}
              />
              {isAr ? 'احجز إقامتك' : 'Reserve your stay'}
              <ArrowSmall flip={isAr} />
            </button>
          </div>

          <button onClick={() => scrollTo('about')} className="btn-ghost-light px-7 py-4">
            {isAr ? 'تعرّف على المنتجع' : 'Discover the resort'}
          </button>
        </div>

        {/* MICRO STATS */}
        <dl className="mt-16 grid grid-cols-3 gap-4 sm:gap-10 max-w-[640px] mx-auto animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          {[
            { v: '1,180m', l: isAr ? 'فوق سطح البحر' : 'Above sea level' },
            { v: isAr ? '١٦' : '16', l: isAr ? 'غرفة وجناح' : 'Rooms & suites' },
            { v: isAr ? '٤٠ سنة' : '40 yrs', l: isAr ? 'إرث عائلي' : 'Family legacy' },
          ].map((m) => (
            <div key={m.l} className="border-t border-white/22 pt-4 text-center">
              <dt
                className="text-white leading-none whitespace-nowrap"
                style={
                  isAr
                    ? { fontFamily: 'var(--font-display-ar)', fontWeight: 600, fontSize: 'clamp(1.05rem, 1.6vw, 1.5rem)' }
                    : {
                        fontFamily: 'var(--font-display)',
                        fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                        fontWeight: 460,
                        fontSize: 'clamp(1.05rem, 1.6vw, 1.5rem)',
                        letterSpacing: '-0.01em',
                      }
                }
              >
                {m.v}
              </dt>
              <dd
                className={`mt-2 text-[10px] uppercase text-white/55 ${isAr ? 'tracking-[0.12em] normal-case' : 'tracking-[0.28em]'}`}
                style={isAr ? { textTransform: 'none', fontFamily: 'var(--font-sans-ar)' } : {}}
              >
                {m.l}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ─── SCROLL HINT ────────────────────────────────── */}
      <button
        onClick={() => scrollTo('about')}
        aria-label="Scroll down"
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-white/80 hover:text-white focus-ring transition-opacity duration-500 ${
          scrolled ? 'opacity-0 pointer-events-none' : 'animate-scroll-hint'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[9px] tracking-[0.38em] uppercase"
            style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.18em' } : {}}
          >
            {isAr ? 'تابع للأسفل' : 'Scroll'}
          </span>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
            <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1" />
            <circle cx="7" cy="6" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </button>

      {/* ─── BOTTOM MARQUEE ─────────────────────────────── */}
      <div className="absolute bottom-2 inset-x-0 z-10 overflow-hidden text-white/35 pointer-events-none">
        <div
          className="flex gap-12 whitespace-nowrap text-[10px] tracking-[0.4em] uppercase animate-marquee"
          style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.18em' } : {}}
        >
          {Array.from({ length: 2 }).map((_, dup) => (
            <React.Fragment key={dup}>
              {(isAr
                ? ['نسمة جبل', '✶', 'هدوء طويل', '✶', 'صنوبر و نجوم', '✶', 'موسم ٢٠٢٦', '✶', 'إقامة عائلية', '✶']
                : ['Pine on the breeze', '✶', 'Slow afternoons', '✶', 'Sea & stars', '✶', 'Season 2026', '✶', 'Family run', '✶']
              ).map((t, i) => (
                <span key={`${dup}-${i}`}>{t}</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Sub-components ────────────────────────────────── */

const SunEmblem = ({ className }) => (
  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" className={className}>
    <circle cx="60" cy="60" r="22" />
    {[...Array(16)].map((_, i) => {
      const a = (i * Math.PI * 2) / 16;
      const x1 = 60 + Math.cos(a) * 30;
      const y1 = 60 + Math.sin(a) * 30;
      const x2 = 60 + Math.cos(a) * (i % 2 === 0 ? 52 : 42);
      const y2 = 60 + Math.sin(a) * (i % 2 === 0 ? 52 : 42);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
    })}
  </svg>
);

const ArrowSmall = ({ flip }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export default Hero;
