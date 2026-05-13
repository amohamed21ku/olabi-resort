import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const FeaturedRooms = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const rooms = [
    {
      id: 1,
      name: isAr ? 'إطلالة الجبل' : 'Mountain View',
      tagline: isAr ? 'هواءٌ صافٍ وصنوبر' : 'Cool air & pine',
      price: '45,000',
      currency: 'SYP',
      image: '/static/images/assets/featured-room.png',
      features: isAr
        ? ['سرير كنغ', 'إطلالة الجبل', 'شرفة خاصة']
        : ['King bed', 'Mountain view', 'Private balcony'],
      number: '01',
    },
    {
      id: 2,
      name: isAr ? 'جناح شهر العسل' : 'Honeymoon Suite',
      tagline: isAr ? 'هدوءٌ يخصّ اثنين' : 'A quiet meant for two',
      price: '85,000',
      currency: 'SYP',
      image: '/static/images/assets/featured-room.png',
      features: isAr
        ? ['جاكوزي', 'إفطار في الغرفة', 'إعداد رومانسي']
        : ['Jacuzzi', 'In-room breakfast', 'Romantic setup'],
      number: '02',
    },
    {
      id: 3,
      name: isAr ? 'استراحة الحديقة' : 'Garden Retreat',
      tagline: isAr ? 'تحت ظلّ الزيتون' : 'Beneath the olive shade',
      price: '32,000',
      currency: 'SYP',
      image: '/static/images/assets/about-image.png',
      features: isAr
        ? ['إطلالة الحديقة', 'مطبخ صغير', 'تراس']
        : ['Garden view', 'Kitchenette', 'Terrace'],
      number: '03',
    },
    {
      id: 4,
      name: isAr ? 'جناح السطح' : 'Penthouse Suite',
      tagline: isAr ? 'النجوم على بُعد سلّم' : 'Stars at arm’s reach',
      price: '120,000',
      currency: 'SYP',
      image: '/static/images/assets/hero-bg.png',
      features: isAr
        ? ['إطلالة بانورامية', 'تراس على السطح', 'جاكوزي']
        : ['Panoramic view', 'Rooftop terrace', 'Jacuzzi'],
      number: '04',
    },
  ];

  return (
    <section
      id="rooms"
      className="section relative overflow-hidden"
      style={{ background: 'var(--paper)' }}
    >
      <WaveTop fill="var(--paper)" from="var(--shell)" />

      <span className="side-numeral hidden lg:block">— 03 · {isAr ? 'الإقامة' : 'Stay'}</span>

      <div className="container-resort relative">
        {/* Section header — editorial split */}
        <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">{isAr ? 'الغرف والأجنحة' : 'Rooms & suites'}</p>
            <h2
              className="text-balance"
              style={
                isAr
                  ? {
                      fontFamily: 'var(--font-display-ar)',
                      fontWeight: 600,
                      fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)',
                      lineHeight: 1.2,
                      color: 'var(--ink)',
                    }
                  : {
                      fontFamily: 'var(--font-display)',
                      fontVariationSettings: "'SOFT' 80, 'opsz' 144",
                      fontWeight: 400,
                      fontSize: 'clamp(2.5rem, 5.5vw, 4.75rem)',
                      lineHeight: 1.02,
                      letterSpacing: '-0.025em',
                      color: 'var(--ink)',
                    }
              }
            >
              {isAr ? (
                <>غرفٌ <em style={{ color: 'var(--terracotta)' }}>تشبه</em> المكان.</>
              ) : (
                <>Rooms that <em style={{ color: 'var(--terracotta)' }}>belong</em> to the view.</>
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p
              className="max-w-md text-[var(--ink-soft)]"
              style={{ fontSize: 'clamp(0.98rem, 1.05vw, 1.05rem)', lineHeight: 1.75 }}
            >
              {isAr
                ? 'كلّ غرفةٍ مفتوحةٌ على الطبيعة — هواءُ الجبل، صوتُ الشجر، ونومٌ هانئ. خياراتٌ لكلّ ضيف، من غرفةٍ بسيطة إلى جناحٍ على السطح.'
                : 'Every room opens onto the landscape — mountain air, the sound of pines, and uninterrupted sleep. Choices for every guest, from a simple room to a rooftop suite.'}
            </p>
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
          {rooms.map((room) => (
            <article key={room.id} className="group">
              <div className="relative overflow-hidden bg-[var(--linen)] aspect-[4/5]">
                <img
                  src={room.image}
                  alt={room.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                />
                {/* darken on hover */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 40%, rgba(10, 35, 49, 0.55) 100%)',
                  }}
                />

                {/* corner numeral */}
                <span
                  className="absolute top-4 left-4 text-[10px] tracking-[0.32em] uppercase text-white/85 bg-black/15 backdrop-blur-sm border border-white/25 px-2 py-1"
                >
                  · {room.number}
                </span>

                {/* tagline on hover */}
                <span
                  className="absolute left-4 right-4 bottom-4 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={
                    isAr
                      ? { fontFamily: 'var(--font-accent-ar)', fontWeight: 400, fontSize: '0.98rem' }
                      : {
                          fontFamily: 'var(--font-italic)',
                          fontStyle: 'italic',
                          fontVariationSettings: "'SOFT' 100, 'opsz' 144",
                        }
                  }
                >
                  “{room.tagline}”
                </span>
              </div>

              {/* card body — sits below image, type-led */}
              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3
                    className="text-[var(--ink)] leading-tight"
                    style={
                      isAr
                        ? {
                            fontFamily: 'var(--font-display-ar)',
                            fontWeight: 600,
                            fontSize: '1.4rem',
                          }
                        : {
                            fontFamily: 'var(--font-display)',
                            fontVariationSettings: "'SOFT' 60, 'opsz' 144",
                            fontWeight: 460,
                            fontSize: '1.45rem',
                            letterSpacing: '-0.012em',
                          }
                    }
                  >
                    {room.name}
                  </h3>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--terracotta)] whitespace-nowrap">
                    {isAr ? 'من' : 'from'}
                  </span>
                </div>

                <p className="mt-1 text-[var(--ink-faded)] text-sm">
                  {room.tagline}
                </p>

                <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                  {room.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]"
                    >
                      <span
                        className="inline-block w-1 h-1 rounded-full"
                        style={{ background: 'var(--terracotta)' }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-end justify-between gap-3 pt-4 border-t border-[var(--hairline)]">
                  <div>
                    <span
                      className="block text-[var(--ink)] leading-none"
                      style={
                        isAr
                          ? {
                              fontFamily: 'var(--font-display-ar)',
                              fontWeight: 600,
                              fontSize: '1.55rem',
                            }
                          : {
                              fontFamily: 'var(--font-display)',
                              fontWeight: 480,
                              fontSize: '1.55rem',
                              letterSpacing: '-0.015em',
                            }
                      }
                    >
                      {room.price}
                      <span className="ml-1 text-xs text-[var(--ink-faded)] tracking-[0.18em]">
                        {room.currency}
                      </span>
                    </span>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--ink-faded)]">
                      {isAr ? 'لليلة' : 'per night'}
                    </span>
                  </div>

                  <a
                    href="#booking"
                    className="link-underline text-sm"
                  >
                    {isAr ? 'احجز' : 'Reserve'}
                    <span aria-hidden>{isAr ? '←' : '→'}</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-[var(--hairline)]">
          <p
            className="text-[var(--ink)] text-balance max-w-md"
            style={
              isAr
                ? {
                    fontFamily: 'var(--font-accent-ar)',
                    fontWeight: 400,
                    fontSize: '1.3rem',
                    lineHeight: 1.7,
                  }
                : {
                    fontFamily: 'var(--font-italic)',
                    fontStyle: 'italic',
                    fontVariationSettings: "'SOFT' 100, 'opsz' 144",
                    fontSize: '1.25rem',
                    lineHeight: 1.4,
                  }
            }
          >
            {isAr
              ? '"كلّ غرفةٍ عندنا تحفظ قصة — تعالوا واكتبوا قصّتكم."'
              : '"Every room here keeps a story — come write yours."'}
          </p>

          <a href="#floor-plan" className="btn-ghost">
            {isAr ? 'مخطّط الطوابق' : 'See the floor plan'}
            <span aria-hidden>{isAr ? '←' : '→'}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

const WaveTop = ({ fill = 'var(--paper)' }) => (
  <svg
    viewBox="0 0 1440 60"
    preserveAspectRatio="none"
    className="absolute top-0 left-0 w-full h-[40px] -translate-y-px"
    style={{ color: fill }}
    aria-hidden
  >
    <path
      d="M0,30 C240,5 480,5 720,30 C960,55 1200,55 1440,30 L1440,60 L0,60 Z"
      fill="currentColor"
    />
  </svg>
);

export default FeaturedRooms;
