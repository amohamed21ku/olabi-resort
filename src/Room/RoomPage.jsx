import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Home Page/components/Header';
import Footer from '../Home Page/components/Footer';
import './RoomPage.css';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  });

  // Room data (in a real app, this would come from an API)
  const roomData = {
    "101": {
      id: "101",
      type: "1 Bedroom",
      price: "18,000 SYP/night",
      floor: "Ground Floor",
      size: "45 sqm",
      maxGuests: 2,
      status: "available",
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=800",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=800"
      ],
      amenities: [
        "King Size Bed", "Mountain View", "Private Balcony", "Mini Bar",
        "Air Conditioning", "Free WiFi", "Room Service", "Safe Box",
        "Coffee Machine", "Flat Screen TV"
      ],
      description: "Experience comfort and luxury in our beautifully appointed 1 bedroom suite. Featuring a king-size bed, private balcony with stunning mountain views, and modern amenities to ensure a memorable stay in Kasab.",
      features: [

      ]
    },
    "201": {
      id: "201",
      type: "Honeymoon Suite",
      price: "55,000 SYP/night",
      floor: "First Floor",
      size: "60 sqm",
      maxGuests: 2,
      status: "available",
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=800",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=800"
      ],
      amenities: [
        "King Size Bed", "Jacuzzi", "Romantic Setup", "Champagne Service",
        "Rose Petals", "Candlelight Dinner", "Couple's Massage", "Private Balcony",
        "Premium Bath Amenities", "Luxury Robes"
      ],
      description: "Create unforgettable memories in our romantic Honeymoon Suite. Designed for couples, this suite features a private jacuzzi, romantic ambiance, and exclusive services to make your stay truly special.",
      features: [

      ]
    }
    // Add more room data as needed
  };

  const room = roomData[roomId] || roomData["101"]; // Fallback to room 101 if not found

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    // Handle booking logic here
    alert(`Booking ${room.type} from ${bookingData.checkIn} to ${bookingData.checkOut} for ${bookingData.guests} guests`);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="room-page">
      <Header />

      <div className="room-content">
        <div className="room-container">
          <button className="back-button" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Floor Plan
          </button>

          <div className="room-header">
            <div className="room-title-section">
              <h1>Room {room.id}</h1>
              <p className="room-type">{room.type}</p>
              <p className="room-floor">{room.floor} • {room.size}</p>
            </div>
            <div className="room-price-section">
              <span className="price">{room.price}</span>
              <span className="price-note">per night</span>
            </div>
          </div>

          <div className="room-main">
            <div className="room-gallery">
              <div className="main-image">
                <img
                  src={room.images[selectedImage]}
                  alt={room.type}
                  className="room-main-image"
                />
              </div>
              <div className="image-thumbnails">
                {room.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${room.type} ${index + 1}`}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>

            <div className="room-info">
              <div className="room-description">
                <h3>About This Room</h3>
                <p>{room.description}</p>
              </div>

              <div className="room-features">
                <h3>Key Features</h3>
                <div className="features-grid">
                  {room.features.map((feature, index) => (
                    <div key={index} className="feature-card">
                      <span className="feature-icon">{feature.icon}</span>
                      <div className="feature-content">
                        <h4>{feature.title}</h4>
                        <p>{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

 
            </div>
          </div>

          <div className="booking-section">
            <div className="booking-card">
              <h3>Book This Room</h3>
              <form onSubmit={handleBookingSubmit} className="room-booking-form">
                <div className="form-row">
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
                </div>
                <div className="form-group">
                  <label>Guests</label>
                  <select
                    value={bookingData.guests}
                    onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    {room.maxGuests > 2 && <option value="3">3 Guests</option>}
                    {room.maxGuests > 3 && <option value="4">4 Guests</option>}
                  </select>
                </div>
                <button type="submit" className="book-now-btn">
                  Book Now
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RoomPage;