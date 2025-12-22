import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: t('home') },
    { href: '#about', label: t('about') },
    { href: '#rooms', label: t('gallery') },
    { href: '#directions', label: t('directions') },
    { href: '#booking', label: t('booking') },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/static/images/assets/olabi-resort.png"
                alt="Olabi Resort"
                className="w-14 h-14 lg:w-16 lg:h-16 object-contain rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                style={{
                  filter: 'drop-shadow(0 4px 20px rgba(30, 95, 116, 0.25))'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--luxury-gold)] to-transparent opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-500" />
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-5 py-2.5 text-sm font-semibold tracking-wide text-[var(--charcoal)] hover:text-white rounded-lg transition-all duration-300 group overflow-hidden"
              >
                <span className="relative z-10">{link.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ocean)] to-[var(--secondary-ocean)] opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg transform scale-95 group-hover:scale-100" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[var(--luxury-gold)] to-[var(--bronze)] group-hover:w-4/5 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative group">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white/10 backdrop-blur-md border-2 border-[var(--primary-ocean)] text-[var(--charcoal)] px-4 py-2.5 pr-8 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-[var(--primary-ocean)] hover:to-[var(--secondary-ocean)] hover:text-white hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--luxury-gold)] focus:ring-offset-2"
              >
                <option value="en" className="bg-white text-[var(--charcoal)]">EN</option>
                <option value="ar" className="bg-white text-[var(--charcoal)]">العربية</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-[var(--primary-ocean)]/30 hover:bg-[var(--primary-ocean)] group transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-0.5 bg-[var(--charcoal)] group-hover:bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-[var(--charcoal)] group-hover:bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-[var(--charcoal)] group-hover:bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl shadow-2xl border-t border-gray-100 transition-all duration-500 ${
        isMobileMenuOpen
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 py-6">
          <ul className="space-y-2">
            {navLinks.map((link, index) => (
              <li key={link.href} style={{ animationDelay: `${index * 50}ms` }} className={isMobileMenuOpen ? 'animate-fade-in-up' : ''}>
                <a
                  href={link.href}
                  className="flex items-center px-5 py-3.5 text-base font-medium text-[var(--charcoal)] hover:text-[var(--primary-ocean)] hover:bg-[var(--primary-ocean)]/5 rounded-xl transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--luxury-gold)] to-[var(--bronze)] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile CTA */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <a
              href="#booking"
              className="flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-[var(--primary-ocean)] to-[var(--secondary-ocean)] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('bookNow')}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
