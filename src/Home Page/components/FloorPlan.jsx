import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FloorPlan = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
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
          price: "$180/night",
          image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Mountain View", "Private Balcony", "Mini Bar"],
          size: "45 sqm"
        },
        {
          id: "102",
          position: { x: 250, y: 50 },
          status: "occupied",
          type: "2 Bedroom",
          price: "$280/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "Sea View", "Living Room", "Kitchenette"],
          size: "75 sqm"
        },
        {
          id: "103",
          position: { x: 50, y: 200 },
          status: "available",
          type: "3 Bedroom",
          price: "$380/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 King Beds", "Garden View", "Full Kitchen", "Dining Area"],
          size: "95 sqm"
        },
        {
          id: "104",
          position: { x: 250, y: 200 },
          status: "available",
          type: "4 Bedroom",
          price: "$480/night",
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
          price: "$550/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Romantic Setup", "Champagne Service"],
          size: "60 sqm"
        },
        {
          id: "202",
          position: { x: 250, y: 50 },
          status: "available",
          type: "2 Bedroom",
          price: "$320/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 Queen Beds", "Mountain View", "Living Room", "Mini Bar"],
          size: "80 sqm"
        },
        {
          id: "203",
          position: { x: 50, y: 200 },
          status: "occupied",
          type: "3 Bedroom",
          price: "$420/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 Queen Beds", "Sea View", "Full Kitchen", "Terrace"],
          size: "100 sqm"
        },
        {
          id: "204",
          position: { x: 250, y: 200 },
          status: "available",
          type: "1 Bedroom",
          price: "$220/night",
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
          price: "$580/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Private Terrace", "Butler Service"],
          size: "70 sqm"
        },
        {
          id: "302",
          position: { x: 250, y: 50 },
          status: "available",
          type: "4 Bedroom",
          price: "$520/night",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400",
          amenities: ["4 Queen Beds", "Sea View", "Full Kitchen", "Living Room"],
          size: "125 sqm"
        },
        {
          id: "303",
          position: { x: 50, y: 200 },
          status: "available",
          type: "2 Bedroom",
          price: "$350/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "Mountain View", "Balcony", "Room Service"],
          size: "85 sqm"
        },
        {
          id: "304",
          position: { x: 250, y: 200 },
          status: "maintenance",
          type: "1 Bedroom",
          price: "$200/night",
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
          price: "$650/night",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&w=400",
          amenities: ["King Bed", "Jacuzzi", "Rooftop Access", "Concierge Service"],
          size: "80 sqm"
        },
        {
          id: "402",
          position: { x: 250, y: 50 },
          status: "available",
          type: "4 Bedroom",
          price: "$580/night",
          image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400",
          amenities: ["4 King Beds", "Panoramic View", "Full Kitchen", "3 Bathrooms"],
          size: "140 sqm"
        },
        {
          id: "403",
          position: { x: 50, y: 200 },
          status: "available",
          type: "3 Bedroom",
          price: "$480/night",
          image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&w=400",
          amenities: ["3 King Beds", "Sea View", "Full Kitchen", "Private Terrace"],
          size: "110 sqm"
        },
        {
          id: "404",
          position: { x: 250, y: 200 },
          status: "available",
          type: "2 Bedroom",
          price: "$380/night",
          image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&w=400",
          amenities: ["2 King Beds", "City View", "Living Room", "Premium Service"],
          size: "90 sqm"
        }
      ]
    }
  };

  const currentFloor = floors[selectedFloor];

  const handleRoomClick = (room) => {
    if (room.status === 'available') {
      navigate(`/room/${room.id}`);
    }
  };

  const handleRoomHover = (room, event) => {
    if (room.status === 'available') {
      setHoveredRoom(room);
      const rect = event.currentTarget.getBoundingClientRect();
      setHoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  };

  const handleRoomLeave = () => {
    setHoveredRoom(null);
  };

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
          <svg width="400" height="300" viewBox="0 0 400 300" className="floor-plan-svg">
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
                  fill={selectedRoom?.id === room.id ? 'var(--primary-blue)' : getRoomColor(room.status)}
                  stroke="var(--charcoal)"
                  strokeWidth="2"
                  rx="8"
                  className={`room-rect ${room.status === 'available' ? 'clickable' : ''}`}
                  onClick={() => handleRoomClick(room)}
                  onMouseEnter={(e) => handleRoomHover(room, e)}
                  onMouseLeave={handleRoomLeave}
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

        <div className="room-info-panel">
          {selectedRoom ? (
            <div className="selected-room-info">
              <h3>Room {selectedRoom.id}</h3>
              <div className="room-details">
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedRoom.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value">{selectedRoom.price}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Floor:</span>
                  <span className="value">{currentFloor.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-${selectedRoom.status}`}>
                    {selectedRoom.status.charAt(0).toUpperCase() + selectedRoom.status.slice(1)}
                  </span>
                </div>
              </div>
              <button className="book-selected-room" onClick={handleBookRoom}>
                Book This Room
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="no-room-selected">
              <h3>Select a Room</h3>
              <p>Click on any available room (green) to see details and book.</p>

              <div className="legend">
                <h4>Legend:</h4>
                <div className="legend-item">
                  <div className="legend-color available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color occupied"></div>
                  <span>Occupied</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color maintenance"></div>
                  <span>Maintenance</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color selected"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Card */}
      {hoveredRoom && (
        <div
          className="room-hover-card"
          style={{
            position: 'fixed',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y - 20}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlan;