import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const Footer = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const socials = [
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: '#',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      href: 'https://wa.me/905528957541',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.65-4.95A8 8 0 1 1 8 19.4L3 21z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.5c0 3 2 5 5 5l1.5-1.5-2-1L12 13c-1 0-2-1-2-2l1-.5-1-2L8.5 9z" />
        </svg>
      ),
    },
  ];

  const navLinks = [
    { href: '#home',       label: isAr ? 'الرئيسية'   : 'Home' },
    { href: '#about',      label: isAr ? 'القصة'      : 'Story' },
    { href: '#rooms',      label: isAr ? 'الغرف'      : 'Rooms' },
    { href: '#floor-plan', label: isAr ? 'المخطّط'    : 'Floor plan' },
    { href: '#booking',    label: isAr ? 'الحجز'      : 'Reserve' },
    { href: '#directions', label: isAr ? 'الطريق'     : 'Directions' },
  ];

  return (
    <footer
      id="contact"
      className="relative overflow-hidden"
      style={{ background: 'var(--aegean-night)', color: 'var(--shell)' }}
    >
      {/* Wave divider top */}
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-[40px] -translate-y-px"
        style={{ color: 'var(--shell)' }}
        aria-hidden
      >
        <path
          d="M0,30 C240,5 480,5 720,30 C960,55 1200,55 1440,30 L1440,0 L0,0 Z"
          fill="currentColor"
        />
      </svg>

      {/* Decorative big sun on the right */}
      <SunEmblem className="absolute -bottom-20 -right-20 w-[420px] h-[420px] text-[var(--lemon)]/10 animate-spin-slow pointer-events-none" />

      <div className="container-resort relative pt-24 pb-10">
        {/* Big italic farewell */}
        <div className="max-w-3xl mb-16">
          <p className="eyebrow mb-5" style={{ color: 'var(--sand)' }}>
            <span style={{ background: 'var(--sand)' }} className="opacity-100" />
            {isAr ? 'ندعوكم' : 'Until next summer'}
          </p>
          <h2
            className="text-white text-balance"
            style={
              isAr
                ? {
                    fontFamily: 'var(--font-display-ar)',
                    fontWeight: 600,
                    fontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)',
                    lineHeight: 1.25,
                  }
                : {
                    fontFamily: 'var(--font-display)',
                    fontVariationSettings: "'SOFT' 80, 'opsz' 144",
                    fontWeight: 380,
                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                    lineHeight: 1.02,
                    letterSpacing: '-0.025em',
                  }
            }
          >
            {isAr ? (
              <>تشرّفنا <em style={{ color: 'var(--sand)' }}>زيارتكم</em><br /> ونحنُ بانتظاركم.</>
            ) : (
              <>The doors are <em style={{ color: 'var(--sand)' }}>always</em><br /> open here.</>
            )}
          </h2>
        </div>

        {/* Grid: identity · contact · nav · social */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/static/images/assets/olabi-resort.png"
                alt="Olabi"
                className="w-12 h-12 object-contain"
              />
              <div className="flex flex-col leading-none">
                <span
                  className="text-white"
                  style={
                    isAr
                      ? { fontFamily: 'var(--font-display-ar)', fontWeight: 600, fontSize: '1.4rem' }
                      : { fontFamily: 'var(--font-display)', fontWeight: 480, fontSize: '1.45rem' }
                  }
                >
                  {isAr ? 'العلبي' : 'Olabi'}
                </span>
                <span className="text-[10px] mt-1 tracking-[0.35em] uppercase text-white/65">
                  Kasab · Resort
                </span>
              </div>
            </div>
            <p className="text-white/75 max-w-md leading-relaxed">
              {isAr
                ? 'مكانٌ صغيرٌ في جبال كسب — تديره عائلةٌ تحبّ ما تفعل، منذ ١٩٨٥.'
                : 'A small place in the mountains of Kasab — run by a family that loves what it does, since 1985.'}
            </p>
          </div>

          {/* Contact */}
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-white/55 mb-5">
              {isAr ? 'تواصل' : 'Contact'}
            </h4>
            <ul className="space-y-3 text-white/85 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--sand)] mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>{isAr ? 'كسب — الساحل السوري' : 'Kasab Mountains, Syria'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--sand)] mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <a href="tel:+905528957541" className="text-white/85 hover:text-[var(--sand)] transition-colors" dir="ltr">
                  +90 552 895 75 41
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--sand)] mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <a href="mailto:reservations@olabiresort.com" className="text-white/85 hover:text-[var(--sand)] transition-colors break-all">
                  reservations@olabiresort.com
                </a>
              </li>
            </ul>
          </div>

          {/* Nav */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-white/55 mb-5">
              {isAr ? 'الموقع' : 'The site'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-white/80 hover:text-[var(--sand)] transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Social */}
          <div className="col-span-2 md:col-span-2">
            <h4 className="text-[10px] tracking-[0.32em] uppercase text-white/55 mb-5">
              {isAr ? 'تابعنا' : 'Follow'}
            </h4>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="grid place-items-center w-10 h-10 rounded-full text-white/80 border border-white/20 hover:text-[var(--ink)] hover:bg-[var(--sand)] hover:border-[var(--sand)] transition-all duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <p className="mt-6 text-[11px] tracking-[0.22em] uppercase text-white/55">
              {isAr ? 'الموسم' : 'Season'} · May → Oct
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/55 text-[12px] tracking-[0.1em]">
            © {new Date().getFullYear()} Olabi Resort · {isAr ? 'كلّ الحقوق محفوظة' : 'All rights reserved'}
          </p>
          <p className="text-white/45 text-[11px] tracking-[0.32em] uppercase flex items-center gap-2">
            <span>✶</span>
            {isAr ? 'صُنع بحُبّ في كسب' : 'Made with care in Kasab'}
            <span>✶</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

const SunEmblem = ({ className }) => (
  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" className={className}>
    <circle cx="60" cy="60" r="22" />
    {[...Array(20)].map((_, i) => {
      const a = (i * Math.PI * 2) / 20;
      const x1 = 60 + Math.cos(a) * 30;
      const y1 = 60 + Math.sin(a) * 30;
      const x2 = 60 + Math.cos(a) * (i % 2 === 0 ? 55 : 44);
      const y2 = 60 + Math.sin(a) * (i % 2 === 0 ? 55 : 44);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
    })}
  </svg>
);

export default Footer;
