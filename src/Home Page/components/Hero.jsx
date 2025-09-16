import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import './Hero.css';
import heroVideo from '/static/images/assets/hero-bg.MP4';
import olabiLogo from '/static/images/assets/olabi-resort.png';

const Hero = () => {
  const { t } = useLanguage();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-title">
            <img src={olabiLogo} alt="Olabi Resort" className="resort-logo" />
          </div>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>
          <p className="hero-description">{t('aboutDescription')}</p>
        </div>

        <div className="hero-actions">
          <button
            className="hero-btn book-now-btn"
            onClick={() => scrollToSection('booking')}
            aria-label={t('bookNow')}
          >
            {t('bookNow')}
          </button>
          <button
            className="hero-btn directions-btn"
            onClick={() => scrollToSection('directions')}
            aria-label={t('directions')}
          >
            {t('directions')}
          </button>
        </div>
      </div>

      <div
        className="scroll-indicator"
        onClick={() => scrollToSection('about')}
        role="button"
        tabIndex={0}
        aria-label="Scroll to next section"
      >
        <div className="scroll-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 13l3 3 7-3M7 6l5 5 5-5"/>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;