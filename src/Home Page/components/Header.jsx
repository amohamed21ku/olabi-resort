import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import './Header.css';

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

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <img src="/static/images/assets/olabi-logo.jpg" alt="Olabi Resort" className="logo-image" />
        </div>

        <nav className="desktop-nav">
          <ul>
            <li><a href="#home">{t('home')}</a></li>
            <li><a href="#about">{t('about')}</a></li>
            <li><a href="#rooms">{t('gallery')}</a></li>
            <li><a href="#directions">{t('directions')}</a></li>
            <li><a href="#booking">{t('booking')}</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <div className="language-switcher">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">EN</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <nav>
            <ul>
              <li><a href="#home">{t('home')}</a></li>
              <li><a href="#about">{t('about')}</a></li>
              <li><a href="#rooms">{t('gallery')}</a></li>
              <li><a href="#directions">{t('directions')}</a></li>
              <li><a href="#booking">{t('booking')}</a></li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;