import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./FloorPlan.css"

const FloorPlan = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [cardPersisted, setCardPersisted] = useState(false);
  const [initialScrollY, setInitialScrollY] = useState(0);
  const navigate = useNavigate();

  const floors = {
    1: {
      name: "Ground Floor",
      rooms: [
        {
          id: "101",
          position: { x: 50, y: 50 },
          status: "available",
          type: "1 Bedroom",
          price: "18,000 SYP/night",
          image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Mountain View", "Private Balcony", "Mini Bar"],
          size: "45 sqm"
        },
        {
          id: "102",
          position: { x: 250, y: 50 },
          status: "occupied",
          type: "2 Bedroom",
          price: "28,000 SYP/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "Sea View", "Living Room", "Kitchenette"],
          size: "75 sqm"
        },
        {
          id: "103",
          position: { x: 50, y: 200 },
          status: "available",
          type: "3 Bedroom",
          price: "38,000 SYP/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 King Beds", "Garden View", "Full Kitchen", "Dining Area"],
          size: "95 sqm"
        },
        {
          id: "104",
          position: { x: 250, y: 200 },
          status: "available",
          type: "4 Bedroom",
          price: "48,000 SYP/night",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400",
          amenities: ["4 King Beds", "Panoramic View", "Full Kitchen", "2 Bathrooms"],
          size: "120 sqm"
        }
      ]
    },
    2: {
      name: "First Floor",
      rooms: [
        {
          id: "201",
          position: { x: 50, y: 50 },
          status: "available",
          type: "Honeymoon Suite",
          price: "55,000 SYP/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Romantic Setup", "Champagne Service"],
          size: "60 sqm"
        },
        {
          id: "202",
          position: { x: 250, y: 50 },
          status: "available",
          type: "2 Bedroom",
          price: "32,000 SYP/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 Queen Beds", "Mountain View", "Living Room", "Mini Bar"],
          size: "80 sqm"
        },
        {
          id: "203",
          position: { x: 50, y: 200 },
          status: "occupied",
          type: "3 Bedroom",
          price: "42,000 SYP/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 Queen Beds", "Sea View", "Full Kitchen", "Terrace"],
          size: "100 sqm"
        },
        {
          id: "204",
          position: { x: 250, y: 200 },
          status: "available",
          type: "1 Bedroom",
          price: "22,000 SYP/night",
          image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&w=400",
          amenities: ["Queen Bed", "City View", "Work Desk", "Coffee Machine"],
          size: "50 sqm"
        }
      ]
    },
    3: {
      name: "Second Floor",
      rooms: [
        {
          id: "301",
          position: { x: 50, y: 50 },
          status: "available",
          type: "Honeymoon Suite",
          price: "58,000 SYP/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Private Terrace", "Butler Service"],
          size: "70 sqm"
        },
        {
          id: "302",
          position: { x: 250, y: 50 },
          status: "available",
          type: "4 Bedroom",
          price: "52,000 SYP/night",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400",
          amenities: ["4 Queen Beds", "Sea View", "Full Kitchen", "Living Room"],
          size: "125 sqm"
        },
        {
          id: "303",
          position: { x: 50, y: 200 },
          status: "available",
          type: "2 Bedroom",
          price: "35,000 SYP/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "Mountain View", "Balcony", "Room Service"],
          size: "85 sqm"
        },
        {
          id: "304",
          position: { x: 250, y: 200 },
          status: "maintenance",
          type: "1 Bedroom",
          price: "20,000 SYP/night",
          image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&w=400",
          amenities: ["Queen Bed", "Garden View", "Work Area", "Mini Fridge"],
          size: "45 sqm"
        }
      ]
    },
    4: {
      name: "Third Floor",
      rooms: [
        {
          id: "401",
          position: { x: 50, y: 50 },
          status: "available",
          type: "Honeymoon Suite",
          price: "65,000 SYP/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Rooftop Access", "Concierge Service"],
          size: "80 sqm"
        },
        {
          id: "402",
          position: { x: 250, y: 50 },
          status: "available",
          type: "4 Bedroom",
          price: "58,000 SYP/night",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400",
          amenities: ["4 King Beds", "Panoramic View", "Full Kitchen", "3 Bathrooms"],
          size: "140 sqm"
        },
        {
          id: "403",
          position: { x: 50, y: 200 },
          status: "available",
          type: "3 Bedroom",
          price: "48,000 SYP/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 King Beds", "Sea View", "Full Kitchen", "Private Terrace"],
          size: "110 sqm"
        },
        {
          id: "404",
          position: { x: 250, y: 200 },
          status: "available",
          type: "2 Bedroom",
          price: "38,000 SYP/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "City View", "Living Room", "Premium Service"],
          size: "90 sqm"
        }
      ]
    }
  };

  const currentFloor = floors[selectedFloor];

  const handleRoomClick = (room) => {
    const isMobile = window.innerWidth <= 768;

    if (room.status === 'available') {
      if (isMobile) {
        // On mobile, first click shows the card, second click (on card) goes to room
        if (hoveredRoom && hoveredRoom.id === room.id) {
          // Card is already shown, this click should close it
          setHoveredRoom(null);
          setCardPersisted(false);
        } else {
          // Show the card with fixed positioning for mobile
          setHoveredRoom(room);
          setInitialScrollY(window.scrollY); // Record initial scroll position
          const viewportWidth = window.innerWidth;
          const cardWidth = 240;
          const x = Math.max(10, Math.min(viewportWidth - cardWidth - 10, (viewportWidth - cardWidth) / 2));
          const y = window.innerHeight / 2 - 90; // Center vertically on screen

          setHoverPosition({
            x: x,
            y: y,
            isLeftSide: room.position.x < 150,
            fixed: true
          });
          setCardPersisted(true);
        }
      } else {
        // On desktop, direct navigation
        navigate(`/room/${room.id}`);
      }
    }
  };

  const handleRoomHover = (room, event) => {
    if (room.status === 'available') {
      setHoveredRoom(room);
      setInitialScrollY(window.scrollY); // Record initial scroll position
      const rect = event.currentTarget.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 768;
      const cardWidth = isMobile ? 240 : 260; // Smaller cards overall

      // Determine if room is on left or right side based on SVG coordinates
      const isLeftSide = room.position.x < 150; // Middle is at 150px in SVG coordinates

      // Calculate optimal position
      let x, y;

      if (isMobile) {
        // On mobile, center the card horizontally with margins
        x = Math.max(10, Math.min(viewportWidth - cardWidth - 10, (viewportWidth - cardWidth) / 2));
        y = rect.bottom + 10; // Position below the room on mobile
      } else {
        if (isLeftSide) {
          // Room is on left side - show card on the right
          x = rect.right + 10; // 10px gap from room
          // If card would go off screen, position it to the left instead
          if (x + cardWidth > viewportWidth - 20) {
            x = rect.left - cardWidth - 10;
          }
        } else {
          // Room is on right side - show card on the left
          x = rect.left - cardWidth - 10; // 10px gap from room
          // If card would go off screen, position it to the right instead
          if (x < 20) {
            x = rect.right + 10;
          }
        }

        // Center card vertically relative to the room
        y = rect.top + (rect.height / 2);
      }

      // Ensure card doesn't go off screen
      const cardHeight = isMobile ? 180 : 200; // Smaller card heights
      if (y - (cardHeight / 2) < 20) {
        y = 20 + (cardHeight / 2);
      } else if (y + (cardHeight / 2) > window.innerHeight - 20) {
        y = window.innerHeight - 20 - (cardHeight / 2);
      }

      setHoverPosition({
        x: x,
        y: y - (isMobile ? cardHeight / 2 : 0), // Adjust for mobile positioning
        isLeftSide: isLeftSide,
        fixed: true // Mark position as fixed
      });
    }
  };

  const handleRoomLeave = () => {
    const isMobile = window.innerWidth <= 768;
    // On desktop, persist the card after hover ends
    // On mobile, only hide if not manually persisted
    if (!isMobile) {
      setCardPersisted(true);
    } else if (!cardPersisted) {
      setHoveredRoom(null);
    }
  };

  const handleHoverCardClick = () => {
    if (hoveredRoom) {
      navigate(`/room/${hoveredRoom.id}`);
    }
  };

  const handleCardClose = () => {
    setHoveredRoom(null);
    setCardPersisted(false);
  };

  // Close card when clicking outside or scrolling
  const handleOutsideClick = (e) => {
    if (hoveredRoom && !e.target.closest('.room-hover-card') && !e.target.closest('.room-rect')) {
      setHoveredRoom(null);
      setCardPersisted(false);
    }
  };

  const handleScroll = () => {
    if (hoveredRoom) {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 30; // pixels

      // Only hide card if user scrolled more than threshold
      if (Math.abs(currentScrollY - initialScrollY) > scrollThreshold) {
        setHoveredRoom(null);
        setCardPersisted(false);
      }
    }
  };

  React.useEffect(() => {
    if (hoveredRoom) {
      document.addEventListener('click', handleOutsideClick);
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        document.removeEventListener('click', handleOutsideClick);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hoveredRoom]);

  const handleBookRoom = () => {
    if (selectedRoom) {
      navigate(`/room/${selectedRoom.id}`);
    }
  };

  const getRoomColor = (status) => {
    switch (status) {
      case 'available': return 'var(--primary-green)';
      case 'occupied': return 'var(--medium-gray)';
      case 'maintenance': return 'var(--soft-bronze)';
      default: return 'var(--primary-green)';
    }
  };

  return (
    <div className="floor-plan-container">
      <div className="floor-plan-header">
        <h2>Interactive Room Selection</h2>
        <p>Choose your room from our luxury floor plan</p>

        <div className="floor-selector">
          {Object.keys(floors).map(floorNum => (
            <button
              key={floorNum}
              className={`floor-btn ${selectedFloor == floorNum ? 'active' : ''}`}
              onClick={() => setSelectedFloor(floorNum)}
            >
              {floors[floorNum].name}
            </button>
          ))}
        </div>
      </div>

      <div className="floor-plan-main">
        <div className="floor-plan-svg-container">
          <svg width="500" height="375" viewBox="0 0 400 300" className="floor-plan-svg">
            {/* Building outline */}
            <rect x="20" y="20" width="360" height="260"
                  fill="none"
                  stroke="var(--charcoal)"
                  strokeWidth="3"
                  rx="10" />

            {/* Central corridor */}
            <rect x="150" y="20" width="100" height="260"
                  fill="var(--light-gray)"
                  stroke="var(--medium-gray)"
                  strokeWidth="1" />

            {/* Elevator */}
            <rect x="180" y="130" width="40" height="40"
                  fill="var(--deep-teal)"
                  rx="5" />
            <text x="200" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              LIFT
            </text>

            {/* Stairs */}
            <g>
              <rect x="160" y="50" width="80" height="30"
                    fill="var(--beige)"
                    stroke="var(--charcoal)"
                    strokeWidth="1" />
              <text x="200" y="70" textAnchor="middle" fontSize="10" fill="var(--charcoal)">
                STAIRS
              </text>
            </g>

            {/* Reception area for ground floor */}
            {selectedFloor == 1 && (
              <g>
                <rect x="160" y="220" width="80" height="40"
                      fill="var(--luxury-gold)"
                      stroke="var(--charcoal)"
                      strokeWidth="1"
                      rx="5" />
                <text x="200" y="245" textAnchor="middle" fontSize="10" fill="var(--charcoal)">
                  RECEPTION
                </text>
              </g>
            )}

            {/* Rooms */}
            {currentFloor.rooms.map(room => (
              <g key={room.id}>
                <rect
                  x={room.position.x}
                  y={room.position.y}
                  width="80"
                  height="80"
                  fill={getRoomColor(room.status)}
                  stroke="var(--charcoal)"
                  strokeWidth="2"
                  rx="8"
                  className={`room-rect ${room.status === 'available' ? 'clickable' : ''}`}
                  onClick={() => handleRoomClick(room)}
                  onMouseEnter={(e) => {
                    const isMobile = window.innerWidth <= 768;
                    if (!isMobile) handleRoomHover(room, e);
                  }}
                  onMouseLeave={() => {
                    const isMobile = window.innerWidth <= 768;
                    if (!isMobile) handleRoomLeave();
                  }}
                  style={{ cursor: room.status === 'available' ? 'pointer' : 'not-allowed' }}
                />
                <text x={room.position.x + 40} y={room.position.y + 30}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}>
                  {room.id}
                </text>
                <text x={room.position.x + 40} y={room.position.y + 50}
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      style={{ pointerEvents: 'none' }}>
                  {room.type}
                </text>
                <text x={room.position.x + 40} y={room.position.y + 65}
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      style={{ pointerEvents: 'none' }}>
                  {room.price}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="availability-indicators">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color occupied"></div>
            <span>Occupied</span>
          </div>
        </div>
      </div>

      {/* Hover Card */}
      {hoveredRoom && (
        <div
          className="room-hover-card clickable"
          style={{
            position: 'fixed',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: window.innerWidth <= 768 ? 'translate(0, 0)' : 'translate(0, -50%)',
            zIndex: 9999,
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
          onClick={handleHoverCardClick}
        >
          <div className="hover-card-content">
            <img src={hoveredRoom.image} alt={hoveredRoom.type} className="hover-card-image" />
            <div className="hover-card-info">
              <h4>Room {hoveredRoom.id}</h4>
              <p className="room-type">{hoveredRoom.type}</p>
              <p className="room-price">{hoveredRoom.price}</p>
              <p className="room-size">{hoveredRoom.size}</p>
              <div className="amenities-preview">
                {hoveredRoom.amenities.slice(0, 2).map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
                {hoveredRoom.amenities.length > 2 && (
                  <span className="more-amenities">+{hoveredRoom.amenities.length - 2} more</span>
                )}
              </div>
              <div className="click-to-view">Click to view room</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlan;