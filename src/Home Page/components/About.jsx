import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const About = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const images = [
    '/static/images/assets/about-image.png',
    '/static/images/assets/featured-room.png',
    '/static/images/assets/hero-bg.png',
  ];

  const captions = isAr
    ? ['كسب · أواخر الصيف', 'الغرفة الرئيسية', 'منظر الوادي']
    : ['Kasab · late summer', 'The main room', 'View from the valley'];

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4800);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <section
      id="about"
      className="section relative overflow-hidden"
      style={{ background: 'var(--shell)' }}
    >
      {/* Top wave divider — paper to shell */}
      <WaveTop />

      {/* Soft decorative wash */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(207, 224, 231, 0.55) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(227, 207, 166, 0.45) 0%, transparent 70%)',
        }}
      />

      <span className="side-numeral hidden lg:block">— 02 · {isAr ? 'القصة' : 'The story'}</span>

      <div className="container-resort relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* TEXT — 7 cols */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <p className="eyebrow mb-6">
              {isAr ? 'القصة · ٤٠ عامًا' : 'The story · since 1985'}
            </p>

            <h2
              className="text-balance"
              style={
                isAr
                  ? {
                      fontFamily: 'var(--font-display-ar)',
                      fontWeight: 600,
                      fontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)',
                      lineHeight: 1.2,
                      color: 'var(--ink)',
                    }
                  : {
                      fontFamily: 'var(--font-display)',
                      fontVariationSettings: "'SOFT' 80, 'opsz' 144",
                      fontWeight: 380,
                      fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                      lineHeight: 1.02,
                      letterSpacing: '-0.025em',
                      color: 'var(--ink)',
                    }
              }
            >
              {isAr ? (
                <>
                  حيث يلتقي{' '}
                  <em style={{ color: 'var(--terracotta)' }}>الجبل</em>{' '}
                  بنسمة البحر.
                </>
              ) : (
                <>
                  Where the mountains{' '}
                  <em style={{ color: 'var(--terracotta)' }}>breathe</em>{' '}
                  the sea.
                </>
              )}
            </h2>

            <p
              className="mt-7 max-w-[560px] text-pretty"
              style={
                isAr
                  ? {
                      fontFamily: 'var(--font-accent-ar)',
                      fontWeight: 400,
                      fontSize: 'clamp(1.15rem, 1.45vw, 1.4rem)',
                      lineHeight: 1.85,
                      color: 'var(--ink)',
                    }
                  : {
                      fontFamily: 'var(--font-italic)',
                      fontStyle: 'italic',
                      fontVariationSettings: "'SOFT' 100, 'opsz' 144",
                      fontSize: 'clamp(1.05rem, 1.4vw, 1.25rem)',
                      lineHeight: 1.55,
                      color: 'var(--ink)',
                    }
              }
            >
              {isAr
                ? '"على ارتفاع ١١٨٠ مترًا، تنفتح كسب كأنّها صفحةٌ من كتابٍ قديم — صنوبرٌ، وحجرٌ مكلّس، وموجٌ بعيد."'
                : '"At 1,180 metres, Kasab opens like a page from an old book — pine, lime-washed stone, and the far hush of waves."'}
            </p>

            <p
              className="mt-6 max-w-[560px] text-[var(--ink-soft)] leading-relaxed"
              style={{ fontSize: 'clamp(0.98rem, 1.05vw, 1.05rem)' }}
            >
              {isAr
                ? 'يقع منتجع العلبي في قلب مرتفعات كسب على الساحل السوري الشمالي، حيث يجتمع البحر الأبيض المتوسط بسلاسل جبال الأمانوس. أنشأته عائلتنا عام ١٩٨٥ ولا يزال يديره أبناؤها — مكانٌ صغير، حميم، وُلد ليكون استراحة الصيف.'
                : 'Tucked into the highlands of Kasab on the northern Syrian coast, Olabi sits where the Mediterranean meets the Amanos range. Built by our family in 1985 and still run by its sons — small, intimate, made for slow summers.'}
            </p>

            {/* Stat row */}
            <ul className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6 max-w-[640px]">
              {[
                { v: '40', l: isAr ? 'سنة من الضيافة' : 'Years of hospitality' },
                { v: '16', l: isAr ? 'غرفة وجناح' : 'Rooms & suites' },
                { v: '1,180m', l: isAr ? 'ارتفاع عن البحر' : 'Altitude' },
              ].map((s) => (
                <li key={s.l} className="border-t border-[var(--hairline-strong)] pt-3">
                  <span
                    className="block text-[var(--ink)] leading-none"
                    style={
                      isAr
                        ? {
                            fontFamily: 'var(--font-display-ar)',
                            fontWeight: 600,
                            fontSize: 'clamp(1.5rem, 2.4vw, 2.1rem)',
                          }
                        : {
                            fontFamily: 'var(--font-display)',
                            fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                            fontWeight: 460,
                            fontSize: 'clamp(1.5rem, 2.4vw, 2.1rem)',
                          }
                    }
                  >
                    {s.v}
                  </span>
                  <span className="mt-2 block text-[10px] tracking-[0.28em] uppercase text-[var(--ink-faded)]">
                    {s.l}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-6 flex-wrap">
              <a href="#rooms" className="link-underline">
                {isAr ? 'تصفّح الغرف' : 'See the rooms'}
                <span aria-hidden>{isAr ? '←' : '→'}</span>
              </a>
              <a href="#directions" className="link-underline">
                {isAr ? 'كيف تصل' : 'How to find us'}
                <span aria-hidden>{isAr ? '←' : '→'}</span>
              </a>
            </div>
          </div>

          {/* IMAGE — 5 cols, asymmetric  */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <figure className="relative">
              {/* Frame stripe (mirrors in RTL) */}
              <span
                aria-hidden
                className={`hidden lg:block absolute -top-6 w-[90%] h-[88%] border border-[var(--terracotta)]/40 ${
                  isAr ? '-left-6' : '-right-6'
                }`}
              />

              <div
                className="relative aspect-[4/5] overflow-hidden bg-[var(--linen)]"
                style={{ boxShadow: 'var(--shadow-lift)' }}
              >
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={captions[i]}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
                      i === idx ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}

                {/* paper grain overlay */}
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.97 0 0 0 0 0.9 0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                  }}
                />

                {/* corner stamp */}
                <span
                  className="absolute top-5 left-5 text-[10px] tracking-[0.3em] uppercase text-white/85 backdrop-blur-sm bg-black/15 px-2.5 py-1 border border-white/30"
                  style={{ letterSpacing: '0.3em' }}
                >
                  ✶ {isAr ? 'منتجع العلبي' : 'Olabi resort'}
                </span>
              </div>

              {/* Caption (handwritten feel via italic) */}
              <figcaption className="mt-5 flex items-center justify-between text-[var(--ink-faded)]">
                <span
                  className={isAr ? 'text-[var(--ink)]' : 'italic text-[var(--ink)]'}
                  style={
                    isAr
                      ? { fontFamily: 'var(--font-accent-ar)', fontWeight: 400, fontSize: '1.05rem' }
                      : { fontFamily: 'var(--font-italic)', fontVariationSettings: "'SOFT' 100, 'opsz' 144" }
                  }
                >
                  {captions[idx]}
                </span>
                <div className="flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      aria-label={`Image ${i + 1}`}
                      className={`h-[2px] transition-all duration-500 ${
                        i === idx ? 'w-7 bg-[var(--terracotta)]' : 'w-4 bg-[var(--ink-whisper)]'
                      }`}
                    />
                  ))}
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};

const WaveTop = () => (
  <svg
    viewBox="0 0 1440 60"
    preserveAspectRatio="none"
    className="absolute top-0 left-0 w-full h-[40px] -translate-y-px"
    style={{ color: 'var(--shell)' }}
    aria-hidden
  >
    <path
      d="M0,0 C240,55 480,55 720,30 C960,5 1200,5 1440,30 L1440,60 L0,60 Z"
      fill="currentColor"
    />
  </svg>
);

export default About;
