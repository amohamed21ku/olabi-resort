import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

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
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <section className="py-24 relative overflow-hidden" id="about"
      style={{ background: 'var(--gradient-subtle)' }}>

      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--primary-ocean)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--luxury-gold)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Text Content */}
          <div className="animate-fade-in-left">
            <h2 className="font-luxury text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              style={{
                background: 'var(--gradient-luxury)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
              {t('experienceLuxury')}
            </h2>

            <p className="text-lg lg:text-xl text-[var(--primary-ocean)] font-medium italic mb-4 leading-relaxed font-accent">
              {t('aboutLead')}
            </p>

            <p className="text-base lg:text-lg text-[var(--slate)] leading-relaxed mb-8">
              {t('aboutBody')}
            </p>

          </div>

          {/* Image Carousel */}
          <div className="animate-fade-in-right">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group"
              style={{ boxShadow: 'var(--shadow-luxury)' }}>

              {/* Images with fade transition */}
              <div className="relative w-full h-full">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Resort view ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      index === currentImageIndex
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-105'
                    }`}
                  />
                ))}
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border border-white ${
                      index === currentImageIndex
                        ? 'bg-white scale-125'
                        : 'bg-transparent hover:bg-white/50'
                    }`}
                    onClick={() => goToImage(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-ocean)]/80 to-[var(--light-ocean)]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-white text-xl lg:text-2xl font-luxury font-bold">
                  {t('resortOverview')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
