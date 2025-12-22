import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import heroVideo from '/static/images/assets/hero-bg.MP4';
import olabiLogo from '/static/images/assets/olabi-resort.png';

const Hero = () => {
  const { t, language } = useLanguage();

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
    <section className="relative h-screen flex items-center justify-center overflow-hidden" id="home">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Dark Overlay for better content visibility */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--deep-ocean)]/60 via-[var(--primary-ocean)]/40 to-[var(--luxury-gold)]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <img
            src={olabiLogo}
            alt="Olabi Resort"
            className="h-45 sm:h-40 lg:h-45 w-auto "
            style={{
              filter: 'drop-shadow(2px 4px 10px rgba(0, 0, 0, 0.3))'
            }}
          />
        </div>

        {/* Kasab Badge */}
        <span className="inline-block px-6 py-2 rounded-full text-sm font-semibold mb-4 tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, var(--luxury-gold), #f4d03f)',
            color: 'var(--charcoal)',
            letterSpacing: '0.1em'
          }}
        >
          {language === 'ar' ? 'اكتشف الجنة المخفية' : 'Discover Hidden Paradise'}
        </span>

        {/* Main Title - Kasab */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 font-serif"
          style={{
            color: 'white',
            textShadow: '2px 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          {language === 'ar' ? 'صيف و كيف بلا مكيف' : ''}
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl lg:text-2xl font-medium mb-6 font-sans"
          style={{
            background: 'linear-gradient(135deg, var(--champagne) 0%, var(--luxury-gold) 50%, var(--soft-gold) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))'
          }}
        >
          {language === 'ar'
            ? ' أهلاً وسهلاً بكم في منتجع العلبي العائلي في كسب'
 
            : 'Where majestic mountains meet turquoise waters in a breathtaking spectacle'}
        </p>

  <p className="text-lg sm:text-xl lg:text-2xl font-medium mb-6 font-sans"
          style={{
            background: 'linear-gradient(135deg, var(--champagne) 0%, var(--luxury-gold) 50%, var(--soft-gold) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))'
          }}
        >
          {language === 'ar'
            ? '  المكان الذي يجمع بين جمال الجبال، نقاء الهواء، وراحة الإقامة العائلية. '

            : 'Where majestic mountains meet turquoise waters in a breathtaking spectacle'}
        </p>


        {/* Action Buttons */}
        <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => scrollToSection('booking')}
            aria-label={t('bookNow')}
            className="group relative px-10 py-4 rounded-full font-bold text-[var(--charcoal)] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:scale-105 min-w-[200px]"
            style={{
              background: 'var(--gradient-gold)',
              boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              {language === 'ar' ? 'احجز إقامتك الآن' : 'Book Your Stay Now'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ocean)] to-[var(--secondary-ocean)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => scrollToSection('directions')}
            aria-label={t('directions')}
            className="group relative px-10 py-4 rounded-full font-semibold text-white overflow-hidden transition-all duration-500 hover:-translate-y-1 min-w-[180px] backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              {language === 'ar' ? 'كيف تصل إلينا' : 'How to Get Here'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ocean)] to-[var(--secondary-ocean)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer animate-bounce text-white"
        onClick={() => scrollToSection('about')}
        role="button"
        tabIndex={0}
        aria-label="Scroll to next section"
        onKeyDown={(e) => e.key === 'Enter' && scrollToSection('about')}
      >
        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--luxury-gold)]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-[var(--primary-ocean)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default Hero;
