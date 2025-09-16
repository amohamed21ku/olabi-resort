import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import './About.css';

const About = () => {
  const { t } = useLanguage();

  const images = [
    "/static/images/assets/about-image.png",
    "/static/images/assets/featured-room.png",
    "/static/images/assets/hero-bg.png"
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="about-section" id="about">
      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <h2>{t('experienceLuxury')}</h2>
            <p className="lead">
              {t('aboutLead')}
            </p>
            <p>
              {t('aboutBody')}
            </p>
       
          </div>
          <div className="about-image">
            <div className="carousel-container">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Olabi Resort Image ${index + 1}`}
                  className={`about-img carousel-image ${index === currentImageIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="carousel-indicators">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
            <div className="image-overlay">
              <span>{t('resortOverview')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;