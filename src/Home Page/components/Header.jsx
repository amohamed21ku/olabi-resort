import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const isAr = language === 'ar';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const nav = isAr
    ? [
        { href: '#home',       label: 'الرئيسية' },
        { href: '#about',      label: 'القصة' },
        { href: '#rooms',      label: 'الغرف' },
        { href: '#floor-plan', label: 'المخطّط' },
        { href: '#directions', label: 'الطريق إلينا' },
      ]
    : [
        { href: '#home',       label: 'Home' },
        { href: '#about',      label: 'Story' },
        { href: '#rooms',      label: 'Rooms' },
        { href: '#floor-plan', label: 'Floor plan' },
        { href: '#directions', label: 'Directions' },
      ];

  // Two visual states: floating-on-hero (transparent dark bg) OR scrolled (cream bar)
  const onDark = !scrolled;

  return (
    <>
      {/* === SLIM TOP MARQUEE === (transparent over hero, solid on scroll) */}
      <div
        className={`fixed top-0 inset-x-0 z-[60] text-[10px] tracking-[0.32em] uppercase transition-all duration-500 pointer-events-none ${
          onDark
            ? 'bg-transparent text-white/80'
            : 'bg-[var(--ink)] text-white/85 border-b border-[var(--hairline-strong)] pointer-events-auto'
        }`}
        style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.12em', fontWeight: 500 } : {}}
      >
        <div className="container-resort flex items-center justify-between h-8">
          <span className="hidden sm:inline">
            {isAr ? '☎ +٩٠ ٥٥٢ ٨٩٥ ٧٥ ٤١' : '☎ +90 552 895 75 41'}
          </span>
          <span className="hidden md:inline">
            {isAr ? 'الموسم · مايو ← أكتوبر' : 'Season · May → October'}
          </span>
          <span>
            {isAr ? '✶ نرحّب بكم في كسب' : '✶ Welcome to Kasab'}
          </span>
        </div>
      </div>

      {/* === MAIN HEADER === */}
      <header
        className={`fixed inset-x-0 top-8 z-50 transition-all duration-500 ${
          onDark ? 'bg-transparent' : 'bg-[var(--shell)]/95 backdrop-blur-xl'
        }`}
        style={
          onDark
            ? undefined
            : { boxShadow: '0 1px 0 var(--hairline)', borderBottom: '1px solid var(--hairline)' }
        }
      >
        <div className="container-resort">
          <div className="flex items-center justify-between gap-4 h-[72px] lg:h-[88px]">
            {/* === LOGO LOCKUP === */}
            <a href="#home" className="flex items-center group focus-ring">
              <div
                className={`transition-all duration-500 rounded-xl overflow-hidden ${
                  onDark
                    ? 'bg-white px-3 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.28)] border border-white/20'
                    : 'bg-white px-2 py-1 shadow-sm border border-[var(--hairline-strong)]'
                } group-hover:scale-105 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.22)]`}
              >
                <img
                  src="/static/images/assets/olabi-logo.jpg"
                  alt="Olabi Resort Kasab"
                  className="h-11 lg:h-14 w-auto object-contain"
                />
              </div>
            </a>

            {/* === DESKTOP NAV === */}
            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 transition-colors duration-300 group ${
                    onDark ? 'text-white/90 hover:text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                  style={
                    isAr
                      ? { fontFamily: 'var(--font-sans-ar)', fontWeight: 500, fontSize: '0.98rem' }
                      : { fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.01em' }
                  }
                >
                  <span>{link.label}</span>
                  {/* Hand-drawn underline on hover */}
                  <span
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[6px] w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 6' preserveAspectRatio='none'><path d='M0 3 Q 7.5 0 15 3 T 30 3 T 45 3 T 60 3' fill='none' stroke='%23C56B47' stroke-width='1.8' stroke-linecap='round'/></svg>\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '100% 100%',
                    }}
                  />
                </a>
              ))}
            </nav>

            {/* === RIGHT CLUSTER === */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Lang pill */}
              <div
                className={`hidden sm:flex items-center rounded-full overflow-hidden transition-colors ${
                  onDark ? 'border border-white/35' : 'border border-[var(--hairline-strong)]'
                }`}
              >
                {[
                  { code: 'ar', label: 'عربي' },
                  { code: 'en', label: 'EN' },
                ].map(({ code, label }) => {
                  const active = language === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`px-3 py-1.5 text-[11px] transition-all ${
                        active
                          ? onDark
                            ? 'bg-white text-[var(--ink)]'
                            : 'bg-[var(--ink)] text-[var(--paper)]'
                          : onDark
                            ? 'text-white/85 hover:text-white'
                            : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                      }`}
                      style={
                        code === 'ar'
                          ? { fontFamily: 'var(--font-display-ar)', fontWeight: 600, fontSize: '0.92rem' }
                          : { letterSpacing: '0.2em', fontWeight: 600 }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Desktop reserve CTA */}
              <a
                href="#booking"
                className={`hidden md:inline-flex items-center gap-2 rounded-full px-5 py-2.5 transition-all duration-300 ${
                  onDark
                    ? 'bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-deep)] shadow-[0_6px_20px_rgba(197,107,71,0.45)]'
                    : 'bg-[var(--ink)] text-white hover:bg-[var(--aegean)]'
                }`}
                style={
                  isAr
                    ? { fontFamily: 'var(--font-sans-ar)', fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0' }
                    : { fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }
                }
              >
                {isAr ? 'احجز الآن' : 'Reserve'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                  style={isAr ? { transform: 'scaleX(-1)' } : undefined}>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </a>

              {/* Mobile menu trigger */}
              <button
                className={`lg:hidden grid place-items-center w-11 h-11 rounded-full transition-colors ${
                  onDark
                    ? 'bg-white/10 text-white border border-white/35 backdrop-blur-sm'
                    : 'bg-[var(--paper)] text-[var(--ink)] border border-[var(--hairline-strong)]'
                }`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-[5px]">
                  <span className={`block w-4 h-px bg-current rounded-full transition-transform duration-300 ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
                  <span className={`block w-4 h-px bg-current rounded-full transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                  <span className={`block w-4 h-px bg-current rounded-full transition-transform duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* === MOBILE FULLSCREEN MENU === */}
      <div
        className={`lg:hidden fixed inset-0 z-[55] transition-all duration-500 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'var(--shell)' }}
      >
        {/* Subtle paper grain on menu */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.18 0 0 0 0 0.22 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative h-full flex flex-col">
          {/* head */}
          <div className="container-resort flex items-center justify-between h-[72px] pt-8 pb-2">
            <span
              className="text-[10px] tracking-[0.3em] uppercase text-[var(--terracotta)]"
              style={isAr ? { fontFamily: 'var(--font-sans-ar)', textTransform: 'none', letterSpacing: '0.12em', fontWeight: 600 } : {}}
            >
              {isAr ? 'القائمة' : 'Menu'}
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="grid place-items-center w-11 h-11 rounded-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--hairline-strong)]"
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Nav list */}
          <nav className="container-resort flex-1 flex flex-col justify-center">
            <ul className="space-y-2">
              {nav.map((link, i) => (
                <li key={link.href} className="overflow-hidden border-b border-[var(--hairline)]">
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-baseline gap-4 py-4 group"
                  >
                    <span className="text-[11px] tracking-[0.3em] text-[var(--terracotta)] tabular-nums w-6">
                      0{i + 1}
                    </span>
                    <span
                      className="text-[var(--ink)] group-hover:text-[var(--terracotta)] transition-colors"
                      style={
                        isAr
                          ? { fontFamily: 'var(--font-display-ar)', fontWeight: 600, fontSize: '2rem', letterSpacing: '0' }
                          : { fontFamily: 'var(--font-display)', fontVariationSettings: "'SOFT' 80, 'opsz' 144", fontWeight: 440, fontSize: '2.1rem', letterSpacing: '-0.02em' }
                      }
                    >
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* footer of menu — lang + CTA */}
          <div className="container-resort pb-10 pt-6 border-t border-[var(--hairline)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center rounded-full border border-[var(--hairline-strong)] overflow-hidden">
                {[
                  { code: 'ar', label: 'عربي' },
                  { code: 'en', label: 'EN' },
                ].map(({ code, label }) => {
                  const active = language === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`px-4 py-2 text-sm transition-all ${
                        active ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--ink-soft)]'
                      }`}
                      style={
                        code === 'ar'
                          ? { fontFamily: 'var(--font-display-ar)', fontWeight: 600 }
                          : { letterSpacing: '0.2em', fontWeight: 600 }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <a
                href="#booking"
                onClick={() => setMobileOpen(false)}
                className="btn-clay py-2.5 px-5 text-[0.8rem]"
                style={isAr ? { letterSpacing: '0' } : { letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                {isAr ? 'احجز الآن' : 'Reserve'}
              </a>
            </div>

            <p
              className="mt-6 text-xs text-[var(--ink-faded)]"
              style={isAr ? { fontFamily: 'var(--font-sans-ar)' } : {}}
            >
              {isAr ? '☎ +٩٠ ٥٥٢ ٨٩٥ ٧٥ ٤١' : '☎ +90 552 895 75 41'}
              <span className="mx-2 opacity-50">·</span>
              {isAr ? 'الموسم: مايو ← أكتوبر' : 'May → October'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
