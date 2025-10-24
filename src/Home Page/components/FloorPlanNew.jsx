import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import './FloorPlan.css';

const FloorPlanNew = () => {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const floors = {
    1: {
      name: "1st Floor",
      rooms: [
        {
          id: "101",
          position: { x: 12, y: 22, w: 22, h: 22 },
          status: "available",
          type: "1 Bedroom",
          price: "18,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["King Bed", "Mountain View", "Private Balcony", "Mini Bar"],
          size: "45 sqm",
          capacity: 2
        },
        {
          id: "102",
          position: { x: 66, y: 22, w: 22, h: 22 },
          status: "occupied",
          type: "2 Bedroom",
          price: "28,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["2 King Beds", "Sea View", "Living Room", "Kitchenette"],
          size: "75 sqm",
          capacity: 4
        },
        {
          id: "103",
          position: { x: 12, y: 58, w: 22, h: 22 },
          status: "available",
          type: "3 Bedroom",
          price: "38,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["3 King Beds", "Garden View", "Full Kitchen", "Dining Area"],
          size: "95 sqm",
          capacity: 6
        },
        {
          id: "104",
          position: { x: 66, y: 58, w: 22, h: 22 },
          status: "available",
          type: "4 Bedroom",
          price: "48,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["4 King Beds", "Panoramic View", "Full Kitchen", "2 Bathrooms"],
          size: "120 sqm",
          capacity: 8
        }
      ]
    },
    2: {
      name: "2nd Floor",
      rooms: [
        {
          id: "201",
          position: { x: 12, y: 22, w: 22, h: 22 },
          status: "available",
          type: "Honeymoon Suite",
          price: "55,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["King Bed", "Jacuzzi", "Romantic Setup", "Champagne Service"],
          size: "60 sqm",
          capacity: 2
        },
        {
          id: "202",
          position: { x: 66, y: 22, w: 22, h: 22 },
          status: "available",
          type: "2 Bedroom",
          price: "32,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["2 Queen Beds", "Mountain View", "Living Room", "Mini Bar"],
          size: "80 sqm",
          capacity: 4
        },
        {
          id: "203",
          position: { x: 12, y: 58, w: 22, h: 22 },
          status: "occupied",
          type: "3 Bedroom",
          price: "42,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["3 Queen Beds", "Sea View", "Full Kitchen", "Terrace"],
          size: "100 sqm",
          capacity: 5
        },
        {
          id: "204",
          position: { x: 66, y: 58, w: 22, h: 22 },
          status: "available",
          type: "1 Bedroom",
          price: "22,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["Queen Bed", "City View", "Work Desk", "Coffee Machine"],
          size: "50 sqm",
          capacity: 2
        }
      ]
    },
    3: {
      name: "3rd Floor",
      rooms: [
        {
          id: "301",
          position: { x: 12, y: 22, w: 22, h: 22 },
          status: "available",
          type: "Honeymoon Suite",
          price: "58,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["King Bed", "Jacuzzi", "Private Terrace", "Butler Service"],
          size: "70 sqm",
          capacity: 2
        },
        {
          id: "302",
          position: { x: 66, y: 22, w: 22, h: 22 },
          status: "available",
          type: "4 Bedroom",
          price: "52,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["4 Queen Beds", "Sea View", "Full Kitchen", "Living Room"],
          size: "125 sqm",
          capacity: 8
        },
        {
          id: "303",
          position: { x: 12, y: 58, w: 22, h: 22 },
          status: "available",
          type: "2 Bedroom",
          price: "35,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["2 King Beds", "Mountain View", "Balcony", "Room Service"],
          size: "85 sqm",
          capacity: 4
        },
        {
          id: "304",
          position: { x: 66, y: 58, w: 22, h: 22 },
          status: "maintenance",
          type: "1 Bedroom",
          price: "20,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["Queen Bed", "Garden View", "Work Area", "Mini Fridge"],
          size: "45 sqm",
          capacity: 2
        }
      ]
    },
    4: {
      name: "4th Floor",
      rooms: [
        {
          id: "401",
          position: { x: 12, y: 22, w: 22, h: 22 },
          status: "available",
          type: "Honeymoon Suite",
          price: "65,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["King Bed", "Jacuzzi", "Rooftop Access", "Concierge Service"],
          size: "80 sqm",
          capacity: 2
        },
        {
          id: "402",
          position: { x: 66, y: 22, w: 22, h: 22 },
          status: "available",
          type: "4 Bedroom",
          price: "58,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["4 King Beds", "Panoramic View", "Full Kitchen", "3 Bathrooms"],
          size: "140 sqm",
          capacity: 8
        },
        {
          id: "403",
          position: { x: 12, y: 58, w: 22, h: 22 },
          status: "available",
          type: "3 Bedroom",
          price: "48,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["3 King Beds", "Sea View", "Full Kitchen", "Private Terrace"],
          size: "110 sqm",
          capacity: 6
        },
        {
          id: "404",
          position: { x: 66, y: 58, w: 22, h: 22 },
          status: "available",
          type: "2 Bedroom",
          price: "38,000 SYP/night",
          image: "/static/images/assets/featured-room.png",
          amenities: ["2 King Beds", "City View", "Living Room", "Premium Service"],
          size: "90 sqm",
          capacity: 4
        }
      ]
    }
  };

  const currentFloor = floors[selectedFloor];

  // Detect if mobile/touch device
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const handleRoomInteraction = (room) => {
    if (room.status !== 'available') return;

    if (isTouchDevice()) {
      // Mobile: First tap shows preview, second tap opens details
      if (selectedRoom?.id === room.id && previewMode) {
        navigate(`/room/${room.id}`);
      } else {
        setSelectedRoom(room);
        setPreviewMode(true);
      }
    } else {
      // Desktop: Hover shows preview, click opens details
      setSelectedRoom(room);
      setPreviewMode(true);
    }
  };

  const handleRoomHover = (room) => {
    if (!isTouchDevice() && room.status === 'available') {
      setSelectedRoom(room);
      setPreviewMode(true);
    }
  };

  const handleRoomLeave = () => {
    if (!isTouchDevice()) {
      // On desktop, delay slightly before hiding
      setTimeout(() => {
        setPreviewMode(false);
      }, 150);
    }
  };

  const handlePreviewClick = () => {
    if (selectedRoom && selectedRoom.status === 'available') {
      navigate(`/room/${selectedRoom.id}`);
    }
  };

  return (
    <div className="floor-plan-container" ref={containerRef}>
      {/* Header */}
      <motion.div
        className="floor-plan-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Interactive Room Selection</h2>
        <p>Choose your perfect room from our luxury floor plan</p>
      </motion.div>

      {/* Room Preview Section - Shows first on mobile */}
      <div className="room-preview-space">
        <AnimatePresence mode="wait">
          {selectedRoom && previewMode ? (
            <motion.div
              ref={cardRef}
              className="room-preview-card"
              initial={{ opacity: 0, y: 30, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 30, height: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25
              }}
              onClick={handlePreviewClick}
            >
              <div className="preview-card-content">
                <motion.div
                  className="preview-card-image-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <img
                    src={selectedRoom.image}
                    alt={selectedRoom.type}
                    className="preview-card-image"
                  />
                  <div className="preview-image-overlay">
                    <span className="room-number-badge">Room {selectedRoom.id}</span>
                  </div>
                </motion.div>

                <motion.div
                  className="preview-card-info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="preview-header">
                    <h3>{selectedRoom.type}</h3>
                    <p className="preview-price">{selectedRoom.price}</p>
                  </div>

                  <div className="preview-details">
                    <span className="preview-size">{selectedRoom.size}</span>
                    <span className="preview-divider">•</span>
                    <span className="preview-capacity">{selectedRoom.capacity} guests</span>
                  </div>

                  <div className="preview-amenities">
                    {selectedRoom.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="preview-amenity-tag">{amenity}</span>
                    ))}
                    {selectedRoom.amenities.length > 4 && (
                      <span className="preview-amenity-more">+{selectedRoom.amenities.length - 4} more</span>
                    )}
                  </div>

                  <motion.button
                    className="preview-cta-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View Full Details & Book →
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="room-preview-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="placeholder-content">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>Hover over or tap a room to preview details</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Floor Plan with Vertical Floor Selector */}
      <div className="floor-plan-main">
        {/* Floor Selector - Vertical on Left */}
        <div className="floor-selector-vertical">
          {Object.keys(floors).map(floorNum => (
            <motion.button
              key={floorNum}
              className={`floor-btn-vertical ${selectedFloor == floorNum ? 'active' : ''}`}
              onClick={() => {
                setSelectedFloor(floorNum);
                setSelectedRoom(null);
                setPreviewMode(false);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {floors[floorNum].name}
            </motion.button>
          ))}
        </div>

        <motion.div
          className="floor-plan-svg-wrapper"
          key={selectedFloor}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <svg viewBox="0 0 100 100" className="floor-plan-svg-large">
            <defs>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
              </filter>
              <linearGradient id="hallGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(236 253 245)" />
                <stop offset="100%" stopColor="rgb(224 242 254)" />
              </linearGradient>
            </defs>

            {/* Building outline */}
            <rect
              x="6" y="6" width="88" height="88"
              rx="6"
              fill="url(#hallGrad)"
              stroke="rgba(2,6,23,0.12)"
              strokeWidth="0.8"
              filter="url(#softShadow)"
            />

            {/* Central corridor */}
            <rect
              x="45" y="20" width="10" height="60"
              rx="2"
              fill="white"
              stroke="rgba(2,6,23,0.12)"
              strokeWidth="0.6"
            />

            {/* Stairs Icon */}
            <g>
              <rect x="47" y="22" width="2" height="2" fill="#1E5F74" />
              <rect x="47" y="24" width="4" height="2" fill="#1E5F74" />
              <rect x="47" y="26" width="6" height="2" fill="#1E5F74" />
              <line x1="47" y1="28" x2="53" y2="22" stroke="#0f172a" strokeWidth="0.4" />
            </g>

            {/* Elevator Icon */}
            <g>
              <rect x="47" y="45" width="6" height="10" rx="1.2" fill="#1E5F74" stroke="#154D5C" strokeWidth="0.4" />
              <rect x="48.5" y="46.5" width="3" height="4" rx="0.5" fill="white" opacity="0.9" />
              <line x1="48.5" y1="52" x2="51.5" y2="52" stroke="white" strokeWidth="0.3" opacity="0.8" />
              <circle cx="50" cy="53" r="0.4" fill="#D4AF37" />
            </g>

            {/* Rooms */}
            {currentFloor.rooms.map((room) => (
              <RoomRect
                key={room.id}
                room={room}
                onHover={handleRoomHover}
                onLeave={handleRoomLeave}
                onClick={handleRoomInteraction}
                isSelected={selectedRoom?.id === room.id}
              />
            ))}
          </svg>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="availability-indicators"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
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
        </motion.div>
      </div>
    </div>
  );
};

// Room Rectangle Component with Framer Motion
const RoomRect = ({ room, onHover, onLeave, onClick, isSelected }) => {
  const { x, y, w, h } = room.position;
  const isClickable = room.status === 'available';

  return (
    <g className="room-rect-interactive">
      <motion.rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={`url(#room-${room.id})`}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.4"
        style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
        initial={{ scale: 1 }}
        animate={{
          scale: isSelected ? 1.08 : 1,
          filter: isSelected ? 'drop-shadow(0px 4px 12px rgba(30, 95, 116, 0.5))' : 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.2))'
        }}
        whileHover={isClickable ? { scale: 1.08 } : {}}
        whileTap={isClickable ? { scale: 0.98 } : {}}
        onMouseEnter={() => onHover(room)}
        onMouseLeave={onLeave}
        onClick={() => onClick(room)}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      />

      <defs>
        <linearGradient id={`room-${room.id}`} x1="0" y1="0" x2="0" y2="1">
          {room.status === 'available' && (
            <>
              <stop offset="0%" stopColor="#40916C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.95" />
            </>
          )}
          {room.status === 'occupied' && (
            <>
              <stop offset="0%" stopColor="#718096" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4A5568" stopOpacity="0.9" />
            </>
          )}
          {room.status === 'maintenance' && (
            <>
              <stop offset="0%" stopColor="#FFA726" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FB8C00" stopOpacity="0.9" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Room info text */}
      <text x={x + w/2} y={y + h/2 - 3} textAnchor="middle" fontSize="2.5" fill="white" opacity="0.9" fontWeight="300" pointerEvents="none">
        ROOM
      </text>
      <text x={x + w/2} y={y + h/2 + 2} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold" pointerEvents="none">
        {room.id}
      </text>
      <text x={x + w/2} y={y + h/2 + 6} textAnchor="middle" fontSize="2" fill="white" opacity="0.95" pointerEvents="none">
        {room.type}
      </text>
      <text x={x + w/2} y={y + h/2 + 9} textAnchor="middle" fontSize="2" fill="white" opacity="0.9" pointerEvents="none">
        {room.price}
      </text>
    </g>
  );
};

export default FloorPlanNew;
