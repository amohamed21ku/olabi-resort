import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const BookingSection = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [roomType, setRoomType] = useState('1');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking:', { checkIn, checkOut, guests, roomType });
  };

  return (
    <section
      id="booking"
      className="section relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, var(--paper) 0%, var(--shell) 60%, var(--linen) 100%)',
      }}
    >
      <WaveTop fill="var(--paper)" />

      <span className="side-numeral hidden lg:block">— 04 · {isAr ? 'احجز' : 'Reserve'}</span>

      <div className="container-resort relative">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">
              {isAr ? 'بطاقة الحجز' : 'Reservation card'}
            </p>
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
                <>اِجمع <em style={{ color: 'var(--terracotta)' }}>تواريخك</em>،<br />ودَع الباقي علينا.</>
              ) : (
                <>Pick your <em style={{ color: 'var(--terracotta)' }}>dates</em>,<br />we’ll keep the doors open.</>
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p
              className="text-[var(--ink-soft)] max-w-md"
              style={{ fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              {isAr
                ? 'فريقنا الصغير يردّ على كلّ حجزٍ شخصيًّا — لا قوائم انتظار طويلة، فقط ضيافة.'
                : 'Our small team replies to every booking personally — no waiting lists, just hospitality.'}
            </p>
          </div>
        </div>

        {/* Postcard booking card */}
        <div
          className="relative bg-[var(--paper)] p-6 sm:p-10 lg:p-12 animate-fade-in-up"
          style={{
            border: '1px solid var(--hairline-strong)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          {/* Postage stamp corner */}
          <div
            className="absolute top-5 right-5 hidden md:flex flex-col items-center justify-center w-[78px] h-[92px] border-2 border-dashed text-center"
            style={{ borderColor: 'var(--terracotta-soft)', color: 'var(--terracotta-deep)' }}
          >
            <span
              className="text-[1rem] leading-none"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 460 }}
            >
              ✶
            </span>
            <span className="text-[9px] tracking-[0.18em] uppercase mt-1.5">
              {isAr ? 'منذ' : 'Est'}
            </span>
            <span className="text-[14px] mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              1985
            </span>
            <span className="text-[9px] tracking-[0.18em] uppercase mt-1.5">
              Kasab
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6 lg:items-end">
            <div className="field-resort">
              <label htmlFor="checkin">{isAr ? 'تاريخ الوصول' : 'Check-in'}</label>
              <input
                id="checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="field-resort">
              <label htmlFor="checkout">{isAr ? 'تاريخ المغادرة' : 'Check-out'}</label>
              <input
                id="checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>

            <div className="field-resort">
              <label htmlFor="guests">{isAr ? 'الضيوف' : 'Guests'}</label>
              <select
                id="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1">1 {isAr ? 'ضيف' : 'guest'}</option>
                <option value="2">2 {isAr ? 'ضيوف' : 'guests'}</option>
                <option value="3">3 {isAr ? 'ضيوف' : 'guests'}</option>
                <option value="4">4 {isAr ? 'ضيوف' : 'guests'}</option>
                <option value="5">5+ {isAr ? 'ضيوف' : 'guests'}</option>
              </select>
            </div>

            <div className="field-resort">
              <label htmlFor="roomtype">{isAr ? 'نوع الغرفة' : 'Room type'}</label>
              <select
                id="roomtype"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                <option value="1">{isAr ? 'غرفة بسيطة' : 'Standard room'}</option>
                <option value="2">{isAr ? 'غرفتان' : '2-bedroom'}</option>
                <option value="3">{isAr ? 'جناح شهر العسل' : 'Honeymoon suite'}</option>
                <option value="4">{isAr ? 'جناح السطح' : 'Penthouse suite'}</option>
              </select>
            </div>

            <div className="lg:col-span-1 sm:col-span-2">
              <button type="submit" className="btn-clay w-full">
                {isAr ? 'ابحث عن إقامة' : 'Find a stay'}
                <SearchIcon />
              </button>
            </div>
          </form>

          {/* Reassurances */}
          <ul className="mt-10 pt-8 border-t border-[var(--hairline)] flex flex-wrap items-center gap-x-8 gap-y-3 text-[var(--ink-soft)] text-sm">
            {[
              isAr ? 'إلغاء مجاني حتى ٤٨ ساعة' : 'Free cancellation up to 48h',
              isAr ? 'أفضل سعر مضمون' : 'Best price guaranteed',
              isAr ? 'تأكيد فوري بالبريد' : 'Instant email confirmation',
            ].map((txt) => (
              <li key={txt} className="flex items-center gap-2.5">
                <span
                  className="grid place-items-center w-5 h-5 rounded-full"
                  style={{ background: 'var(--olive-pale)', color: 'var(--olive-deep)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {txt}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative — small olive branch SVG bottom right */}
        <OliveBranch className="absolute bottom-8 right-4 lg:right-12 w-[90px] h-[90px] text-[var(--olive)] opacity-50" />
      </div>
    </section>
  );
};

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const OliveBranch = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className={className} aria-hidden>
    <path d="M10 90 C 30 60, 50 50, 90 15" />
    {[20, 35, 50, 65, 78].map((p, i) => {
      const x = 10 + (90 - 10) * (p / 100) + (i % 2 ? 5 : -5);
      const y = 90 - (90 - 15) * (p / 100) + (i % 2 ? -5 : 5);
      return (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="5"
          ry="2.5"
          transform={`rotate(${-50 + i * 15} ${x} ${y})`}
          fill="currentColor"
          opacity="0.55"
        />
      );
    })}
  </svg>
);

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

export default BookingSection;
