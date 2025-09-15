import React, { useState } from 'react';

const BookingSection = () => {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState('1');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle booking submission
    console.log('Booking submitted:', { checkInDate, checkOutDate, guests, rooms });
  };

  return (
    <section className="booking-section" id="booking">
      <div className="booking-container">
        <div className="booking-header">
          <h2>Book Your Stay</h2>
          <p>Reserve your perfect getaway at Olabi Resort</p>
        </div>

        <div className="booking-widget-standalone">
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-row">
              <div className="form-group">
                <label htmlFor="checkin">Check-in Date</label>
                <input
                  type="date"
                  id="checkin"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout">Check-out Date</label>
                <input
                  type="date"
                  id="checkout"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="guests">Guests</label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rooms">Rooms</label>
                <select
                  id="rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                >
                  <option value="1">1 Room</option>
                  <option value="2">2 Rooms</option>
                  <option value="3">3 Rooms</option>
                  <option value="4">4+ Rooms</option>
                </select>
              </div>

              <button type="submit" className="booking-submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
                Search Rooms
              </button>
            </div>
          </form>
        </div>

        <div className="booking-features">
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <span>Free Cancellation</span>
          </div>
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M15 9l-6 6"></path>
              <path d="M9 9l6 6"></path>
            </svg>
            <span>No Hidden Fees</span>
          </div>
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span>Best Rate Guarantee</span>
          </div>
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
            </svg>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;