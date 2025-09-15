import React, { useState } from 'react';

const BookingWidget = () => {
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    roomType: '',
    guests: 2
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    console.log('Booking data:', bookingData);
    // Here you would integrate with your booking system
  };

  return (
    <section className="booking-section">
      <div className="booking-container">
        <div className="booking-header">
          <h2>Book Your Perfect Stay</h2>
          <p>Complete your reservation with our easy booking system</p>
        </div>

        <div className="booking-widget-standalone">
          <form onSubmit={handleBookingSubmit} className="booking-form">
            <div className="booking-row">
              <div className="form-group">
                <label>Check-in</label>
                <input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => setBookingData({...bookingData, checkIn: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Check-out</label>
                <input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData({...bookingData, checkOut: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Room Type</label>
                <select
                  value={bookingData.roomType}
                  onChange={(e) => setBookingData({...bookingData, roomType: e.target.value})}
                  required
                >
                  <option value="">Select Room Type</option>
                  <option value="1-bedroom">1 Bedroom</option>
                  <option value="2-bedroom">2 Bedroom</option>
                  <option value="3-bedroom">3 Bedroom</option>
                  <option value="4-bedroom">4 Bedroom</option>
                  <option value="honeymoon">Honeymoon Suite</option>
                </select>
              </div>

              <div className="form-group">
                <label>Guests</label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>

              <button type="submit" className="booking-submit">
                <span>Search Rooms</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className="booking-features">
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="9"/>
            </svg>
            <span>Free Cancellation</span>
          </div>
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Best Price Guarantee</span>
          </div>
          <div className="feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingWidget;