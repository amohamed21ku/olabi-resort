import React, { useState } from 'react';
import "./BookingSection.css"

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
              <div className="form-group-Booking">
                <label htmlFor="checkin">Check-in Date</label>
                <input
                  type="date"
                  id="checkin"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-Booking">
                <label htmlFor="checkout">Check-out Date</label>
                <input
                  type="date"
                  id="checkout"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-Booking">
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

              <div className="form-group-Booking">
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

  
      </div>
    </section>
  );
};

export default BookingSection;