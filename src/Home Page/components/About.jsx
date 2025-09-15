import React from 'react';
import './About.css';

const About = () => {
  return (
    <section className="about-section" id="about">
      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <h2>Experience Unparalleled Luxury</h2>
            <p className="lead">
              Nestled in the heart of pristine mountains, Olabi Resort offers an exquisite blend
              of natural beauty and sophisticated comfort. Our resort is designed to provide
              an unforgettable experience where every detail has been carefully curated to
              exceed your expectations.
            </p>
            <p>
              From our world-class spa treatments to our michelin-starred dining experiences,
              every moment at Olabi Resort is crafted to create lasting memories. Whether you're
              seeking a romantic getaway, family adventure, or corporate retreat, our dedicated
              team ensures your stay is nothing short of extraordinary.
            </p>
            <div className="about-stats">
              <div className="stat">
                <h3>50+</h3>
                <p>Luxury Suites</p>
              </div>
              <div className="stat">
                <h3>5</h3>
                <p>Star Rating</p>
              </div>
              <div className="stat">
                <h3>24/7</h3>
                <p>Concierge Service</p>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img src="/public/static/images/assets/about-image.png" alt="Olabi Resort Overview" className="about-img" />
            <div className="image-overlay">
              <span>Resort Overview</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;