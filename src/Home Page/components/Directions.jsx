import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const Directions = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const routes = [
    {
      from: isAr ? 'من دمشق' : 'From Damascus',
      via: 'M5 → Lattakia',
      steps: isAr
        ? [
            { t: 'الطريق الدولي M5 شمالاً', d: 'حوالي ٣٥٠ كم باتجاه اللاذقية.' },
            { t: 'مخرج كسب', d: 'انعطف عند المخرج رقم ١٥ — كسب / الحدود التركية.' },
            { t: 'لافتات المنتجع', d: 'تابع ٥ كم متّبعًا لافتات منتجع العلبي.' },
          ]
        : [
            { t: 'Highway M5 north', d: 'About 350 km toward Lattakia.' },
            { t: 'Exit to Kasab', d: 'Take exit 15 — Kasab / Turkey border.' },
            { t: 'Resort signage', d: 'Continue 5 km following Olabi signs.' },
          ],
      stats: [
        { v: '5.5h', l: isAr ? 'تقريبًا' : 'Drive time' },
        { v: '380 km', l: isAr ? 'مسافة' : 'Distance' },
      ],
    },
    {
      from: isAr ? 'من اللاذقية' : 'From Lattakia',
      via: isAr ? 'الطريق الساحلي' : 'Coastal road',
      steps: isAr
        ? [
            { t: 'الطريق الساحلي شمالاً', d: 'مسارٌ ساحليٌّ بانورامي.' },
            { t: 'مخرج كسب', d: 'انعطف عبر الطريق الجبلي.' },
            { t: 'وصولك', d: 'مدخل المنتجع على يمينك.' },
          ]
        : [
            { t: 'Coastal road north', d: 'A scenic seaside drive.' },
            { t: 'Turn at Kasab', d: 'Climb the mountain road.' },
            { t: 'Arrive', d: 'Resort entrance on your right.' },
          ],
      stats: [
        { v: '1.5h', l: isAr ? 'تقريبًا' : 'Drive time' },
        { v: '65 km', l: isAr ? 'مسافة' : 'Distance' },
      ],
    },
  ];

  return (
    <section
      id="directions"
      className="section relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, var(--linen) 0%, var(--shell) 100%)',
      }}
    >
      <WaveTop fill="var(--shell)" />
      <span className="side-numeral hidden lg:block">— 06 · {isAr ? 'الطريق إلينا' : 'The way here'}</span>

      <div className="container-resort relative">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">{isAr ? 'كيف تصل' : 'How to get here'}</p>
            <h2
              className="text-balance"
              style={
                isAr
                  ? {
                      fontFamily: 'var(--font-display-ar)',
                      fontWeight: 600,
                      fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
                      lineHeight: 1.2,
                      color: 'var(--ink)',
                    }
                  : {
                      fontFamily: 'var(--font-display)',
                      fontVariationSettings: "'SOFT' 80, 'opsz' 144",
                      fontWeight: 400,
                      fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                      lineHeight: 1.02,
                      letterSpacing: '-0.025em',
                      color: 'var(--ink)',
                    }
              }
            >
              {isAr ? (
                <>على بُعد <em style={{ color: 'var(--terracotta)' }}>مسافة</em> من العادي.</>
              ) : (
                <>A <em style={{ color: 'var(--terracotta)' }}>winding</em> drive away from ordinary.</>
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p
              className="text-[var(--ink-soft)] max-w-md"
              style={{ fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              {isAr
                ? 'الطريق إلى كسب جزءٌ من المتعة — جبالٌ، صنوبر، وإطلالاتٌ بحرية بين كلّ منعطف.'
                : 'The road into Kasab is half the pleasure — mountains, pine, and glimpses of sea around every bend.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Routes — span 2 */}
          <div className="lg:col-span-2 space-y-6">
            {routes.map((route, ri) => (
              <article
                key={ri}
                className="relative bg-[var(--paper)] p-8 lg:p-10 transition-all duration-500 hover:-translate-y-1"
                style={{
                  border: '1px solid var(--hairline-strong)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Card head */}
                <div className="flex items-baseline justify-between gap-3 mb-7 pb-5 border-b border-[var(--hairline)]">
                  <div>
                    <span className="block text-[10px] tracking-[0.32em] uppercase text-[var(--terracotta)] mb-2">
                      0{ri + 1}
                    </span>
                    <h3
                      className="text-[var(--ink)]"
                      style={
                        isAr
                          ? {
                              fontFamily: 'var(--font-display-ar)',
                              fontWeight: 600,
                              fontSize: 'clamp(1.55rem, 2.3vw, 2.05rem)',
                            }
                          : {
                              fontFamily: 'var(--font-display)',
                              fontVariationSettings: "'SOFT' 70, 'opsz' 144",
                              fontWeight: 460,
                              fontSize: 'clamp(1.6rem, 2.4vw, 2.1rem)',
                              letterSpacing: '-0.015em',
                            }
                      }
                    >
                      {route.from}
                    </h3>
                  </div>
                  <span
                    className="text-[var(--ink-faded)] text-sm shrink-0"
                    style={
                      isAr
                        ? { fontFamily: 'var(--font-accent-ar)', fontWeight: 400 }
                        : { fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontVariationSettings: "'SOFT' 100, 'opsz' 144" }
                    }
                  >
                    {route.via}
                  </span>
                </div>

                {/* Steps */}
                <ol className="space-y-5">
                  {route.steps.map((step, si) => (
                    <li key={si} className="flex gap-5">
                      <span
                        className="shrink-0 w-9 h-9 rounded-full grid place-items-center font-medium text-sm"
                        style={{
                          background: 'var(--terracotta-pale)',
                          color: 'var(--terracotta-deep)',
                          border: '1px solid var(--terracotta-soft)',
                          fontFamily: 'var(--font-display)',
                          fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                        }}
                      >
                        {si + 1}
                      </span>
                      <div className="pt-1">
                        <h4
                          className="text-[var(--ink)] mb-1"
                          style={
                            isAr
                              ? {
                                  fontFamily: 'var(--font-display-ar)',
                                  fontWeight: 600,
                                  fontSize: '1.15rem',
                                }
                              : {
                                  fontFamily: 'var(--font-display)',
                                  fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                                  fontWeight: 460,
                                  fontSize: '1.1rem',
                                }
                          }
                        >
                          {step.t}
                        </h4>
                        <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                          {step.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-[var(--hairline)] flex gap-10">
                  {route.stats.map((s, si) => (
                    <div key={si}>
                      <span
                        className="block leading-none"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                          fontWeight: 480,
                          fontSize: '1.85rem',
                          color: 'var(--aegean)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {s.v}
                      </span>
                      <span className="block text-[10px] tracking-[0.28em] uppercase text-[var(--ink-faded)] mt-1.5">
                        {s.l}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar — illustrated postcard */}
          <aside
            className="relative bg-[var(--aegean)] text-white p-8 lg:p-10 overflow-hidden"
            style={{ boxShadow: 'var(--shadow-lift)' }}
          >
            {/* Map-stripes background */}
            <svg
              aria-hidden
              viewBox="0 0 200 300"
              className="absolute inset-0 w-full h-full opacity-15"
              preserveAspectRatio="xMidYMid slice"
            >
              {[...Array(8)].map((_, i) => (
                <path
                  key={i}
                  d={`M-20 ${30 + i * 38} Q 60 ${10 + i * 38}, 120 ${50 + i * 38} T 240 ${30 + i * 38}`}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.6"
                  strokeDasharray="3 4"
                />
              ))}
              <circle cx="60" cy="170" r="3" fill="white" />
              <circle cx="60" cy="170" r="10" fill="none" stroke="white" strokeWidth="0.7" />
              <text x="72" y="174" fontSize="9" fill="white" fontFamily="serif">Olabi</text>
            </svg>

            <div className="relative">
              <p className="text-[10px] tracking-[0.32em] uppercase text-white/70 mb-4">
                {isAr ? 'هل تتوه؟' : 'A little lost?'}
              </p>
              <h3
                className="text-white text-balance"
                style={
                  isAr
                    ? {
                        fontFamily: 'var(--font-display-ar)',
                        fontWeight: 600,
                        fontSize: 'clamp(1.65rem, 2.5vw, 2.15rem)',
                        lineHeight: 1.3,
                      }
                    : {
                        fontFamily: 'var(--font-display)',
                        fontVariationSettings: "'SOFT' 80, 'opsz' 144",
                        fontWeight: 420,
                        fontSize: 'clamp(1.65rem, 2.5vw, 2.2rem)',
                        lineHeight: 1.05,
                        letterSpacing: '-0.015em',
                      }
                }
              >
                {isAr ? (
                  <>اتصل بنا، <em style={{ color: 'var(--sand)' }}>سنرشدك</em> خطوة بخطوة.</>
                ) : (
                  <>Call us — we’ll talk you <em style={{ color: 'var(--sand)' }}>in</em>.</>
                )}
              </h3>

              <p
                className="mt-5 text-white/85 max-w-xs"
                style={
                  isAr
                    ? { fontFamily: 'var(--font-accent-ar)', fontWeight: 400, fontSize: '1.05rem', lineHeight: 1.85 }
                    : { fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontVariationSettings: "'SOFT' 100, 'opsz' 144" }
                }
              >
                {isAr
                  ? 'الاستقبال مفتوح من السادسة صباحًا حتى منتصف الليل، طوال الموسم.'
                  : 'Reception is open from 6 am to midnight, all season.'}
              </p>

              <a
                href="tel:+905528957541"
                className="mt-7 inline-flex items-center gap-3 text-white border-b border-white/60 pb-1.5 hover:border-[var(--sand)] hover:text-[var(--sand)] transition-colors"
                dir="ltr"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                  +90 552 895 75 41
                </span>
              </a>

              {/* tiny GPS pin coordinates */}
              <div className="mt-10 pt-5 border-t border-white/15 grid grid-cols-2 gap-4 text-[11px] tracking-[0.18em] uppercase text-white/70">
                <div>
                  <span className="block text-white/55">{isAr ? 'الإحداثيات' : 'Coordinates'}</span>
                  <span className="block mt-1 text-white" dir="ltr">35.92° N · 35.91° E</span>
                </div>
                <div>
                  <span className="block text-white/55">{isAr ? 'الارتفاع' : 'Altitude'}</span>
                  <span className="block mt-1 text-white">1,180 m</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const WaveTop = ({ fill = 'var(--shell)' }) => (
  <svg
    viewBox="0 0 1440 60"
    preserveAspectRatio="none"
    className="absolute top-0 left-0 w-full h-[40px] -translate-y-px"
    style={{ color: fill }}
    aria-hidden
  >
    <path
      d="M0,0 C240,55 480,55 720,30 C960,5 1200,5 1440,30 L1440,60 L0,60 Z"
      fill="currentColor"
    />
  </svg>
);

export default Directions;
