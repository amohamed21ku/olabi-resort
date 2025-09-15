import React from 'react';
import './FeaturedRooms.css';

const FeaturedRooms = () => {
  const rooms = [
    {
      id: 1,
      name: 'Mountain View Suite',
      price: '45,000 SYP',
      period: 'per night',
      image: 'mountain-suite',
      features: ['King Bed', 'Mountain View', 'Private Balcony', 'Spa Bath']
    },
    {
      id: 2,
      name: 'Presidential Villa',
      price: '85,000 SYP',
      period: 'per night',
      image: 'presidential-villa',
      features: ['3 Bedrooms', 'Private Pool', 'Personal Chef', 'Butler Service']
    },
    {
      id: 3,
      name: 'Garden Apartment',
      price: '32,000 SYP',
      period: 'per night',
      image: 'garden-apartment',
      features: ['Garden View', 'Kitchenette', 'Living Area', 'Terrace']
    },
    {
      id: 4,
      name: 'Luxury Penthouse',
      price: '120,000 SYP',
      period: 'per night',
      image: 'luxury-penthouse',
      features: ['Panoramic Views', 'Private Elevator', 'Rooftop Terrace', 'Jacuzzi']
    }
  ];

  return (
    <section className="featured-rooms" id="rooms">
      <div className="rooms-container">
        <div className="section-header">
          <h2>Featured Accommodations</h2>
          <p>Discover our carefully curated selection of luxury suites and villas</p>
        </div>

        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-image">
                <img src="/public/static/images/assets/featured-room.png" alt={room.name} className="room-img" />
                <div className="image-overlay">
                  <span>{room.name}</span>
                </div>
                <div className="room-badge">Featured</div>
              </div>

              <div className="room-content">
                <h3>{room.name}</h3>
                <ul className="room-features">
                  {room.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                <div className="room-footer">
                  <div className="room-price">
                    <span className="price">{room.price}</span>
                    <span className="period">{room.period}</span>
                  </div>
                  <button className="book-room-btn">
                    Book Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rooms-cta">
          <button className="view-all-rooms">
            View All Accommodations
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRooms;