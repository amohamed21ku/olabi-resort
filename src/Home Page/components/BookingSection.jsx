import React, { useState } from 'react';

const BookingSection = () => {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState('1');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking submitted:', { checkInDate, checkOutDate, guests, rooms });
  };

  return (
    <section className="py-20 lg:py-24 relative overflow-hidden" id="booking"
      style={{
        background: 'linear-gradient(135deg, var(--deep-ocean) 0%, var(--primary-ocean) 50%, var(--slate) 100%)'
      }}>

      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--luxury-gold)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-luxury font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--champagne) 0%, var(--luxury-gold) 50%, var(--soft-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.5))'
            }}>
            Book Your Stay
          </h2>
          <p className="text-lg text-[var(--cream)] font-medium"
            style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.7)' }}>
            Reserve your perfect getaway at Olabi Resort
          </p>
        </div>

        {/* Booking Widget */}
        <div className="backdrop-blur-xl rounded-2xl p-6 sm:p-8 lg:p-10 animate-scale-in"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)'
          }}>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Check-in Date */}
              <div className="flex flex-col">
                <label htmlFor="checkin" className="text-white text-sm font-semibold mb-2 tracking-wide"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
                  Check-in Date
                </label>
                <input
                  type="date"
                  id="checkin"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-base font-medium bg-white/95 text-[var(--charcoal)] border-2 border-[var(--light-ocean)]/40 focus:border-[var(--luxury-gold)] focus:ring-4 focus:ring-[var(--luxury-gold)]/20 outline-none transition-all duration-300"
                  style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}
                />
              </div>

              {/* Check-out Date */}
              <div className="flex flex-col">
                <label htmlFor="checkout" className="text-white text-sm font-semibold mb-2 tracking-wide"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
                  Check-out Date
                </label>
                <input
                  type="date"
                  id="checkout"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-base font-medium bg-white/95 text-[var(--charcoal)] border-2 border-[var(--light-ocean)]/40 focus:border-[var(--luxury-gold)] focus:ring-4 focus:ring-[var(--luxury-gold)]/20 outline-none transition-all duration-300"
                  style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}
                />
              </div>

              {/* Guests */}
              <div className="flex flex-col">
                <label htmlFor="guests" className="text-white text-sm font-semibold mb-2 tracking-wide"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
                  Guests
                </label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-base font-medium bg-white/95 text-[var(--charcoal)] border-2 border-[var(--light-ocean)]/40 focus:border-[var(--luxury-gold)] focus:ring-4 focus:ring-[var(--luxury-gold)]/20 outline-none transition-all duration-300 cursor-pointer"
                  style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>

              {/* Rooms */}
              <div className="flex flex-col">
                <label htmlFor="rooms" className="text-white text-sm font-semibold mb-2 tracking-wide"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
                  Rooms
                </label>
                <select
                  id="rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-base font-medium bg-white/95 text-[var(--charcoal)] border-2 border-[var(--light-ocean)]/40 focus:border-[var(--luxury-gold)] focus:ring-4 focus:ring-[var(--luxury-gold)]/20 outline-none transition-all duration-300 cursor-pointer"
                  style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}
                >
                  <option value="1">1 Room</option>
                  <option value="2">2 Rooms</option>
                  <option value="3">3 Rooms</option>
                  <option value="4">4+ Rooms</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  className="group relative w-full px-6 py-3.5 rounded-xl font-bold text-[var(--charcoal)] uppercase tracking-wider text-sm flex items-center justify-center gap-3 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:scale-105"
                  style={{
                    background: 'var(--gradient-gold)',
                    boxShadow: 'var(--shadow-gold)'
                  }}
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                    Search
                  </span>
                  <svg className="relative z-10 w-5 h-5 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ocean)] to-[var(--secondary-ocean)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 lg:gap-10">
          {[
            { icon: '✓', text: 'Best Price Guarantee' },
            { icon: '✓', text: 'Free Cancellation' },
            { icon: '✓', text: 'Instant Confirmation' }
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-white/90 text-sm">
              <span className="w-5 h-5 rounded-full bg-[var(--luxury-gold)] flex items-center justify-center text-xs text-[var(--charcoal)] font-bold">
                {feature.icon}
              </span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
