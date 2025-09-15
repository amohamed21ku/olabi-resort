import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <li><a href="#home">HomePage</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#rooms">Gallery</a></li>
            <li><a href="#directions">Directions</a></li>
            <li><a href="#booking">Booking</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <div className="language-switcher">
            <select>
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
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
              <li><a href="#home">HomePage</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#rooms">Gallery</a></li>
              <li><a href="#directions">Directions</a></li>
              <li><a href="#booking">Booking</a></li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;