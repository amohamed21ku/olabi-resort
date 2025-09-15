import React, { useState, useEffect } from 'react';

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
          <img src="/src/assets/olabi-logo.jpg" alt="Olabi Resort" className="logo-image" />
          <div className="logo-text">
            <h1>Olabi Resort</h1>
            <p className="logo-subtitle">Kasab, Syria</p>
          </div>
        </div>

        <nav className="desktop-nav">
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#rooms">Rooms & Suites</a></li>
            <li><a href="#experiences">Experiences</a></li>
            <li><a href="#dining">Dining</a></li>
            <li><a href="#spa">Spa & Wellness</a></li>
            <li><a href="#contact">Contact</a></li>
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
          <button className="booking-btn">Book Now</button>
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
              <li><a href="#home">Home</a></li>
              <li><a href="#rooms">Rooms & Suites</a></li>
              <li><a href="#experiences">Experiences</a></li>
              <li><a href="#dining">Dining</a></li>
              <li><a href="#spa">Spa & Wellness</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <button className="mobile-booking-btn">Book Now</button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;