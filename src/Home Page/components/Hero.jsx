import React from 'react';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Discover Olabi Resort</h1>
          <p className="hero-subtitle">Where Syrian mountains meet Mediterranean luxury in beautiful Kasab</p>
          <p className="hero-description">Experience the perfect blend of natural beauty and luxury accommodation in the heart of Kasab's stunning mountain landscape.</p>
        </div>

        <div className="hero-actions">
          <button className="hero-btn book-now-btn" onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}>
            Book Now
          </button>
          <button className="hero-btn directions-btn" onClick={() => document.getElementById('directions')?.scrollIntoView({ behavior: 'smooth' })}>
            Directions
          </button>
        </div>
      </div>

      <div className="scroll-indicator">
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