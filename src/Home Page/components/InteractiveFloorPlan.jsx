import React, { useState } from 'react';
import './InteractiveFloorPlan.css';

const ROOM_CONFIG = {
  101: { name: 'غرفة 101', nameEn: 'Room 101', href: '#room-101' },
  102: { name: 'غرفة 102', nameEn: 'Room 102', href: '#room-102' },
  103: { name: 'غرفة 103', nameEn: 'Room 103', href: '#room-103' },
  104: { name: 'غرفة 104', nameEn: 'Room 104', href: '#room-104' }
};

const InteractiveFloorPlan = ({ onRoomSelect }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleRoomClick = (roomId) => {
    const cfg = ROOM_CONFIG[roomId];
    setSelectedRoom(roomId);

    // Fire callback if provided
    if (onRoomSelect) {
      onRoomSelect({ id: roomId, ...cfg });
    }

    // Navigate to hash
    if (cfg?.href) {
      window.location.hash = cfg.href;
    }
  };

  const handleKeyDown = (e, roomId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRoomClick(roomId);
    }
  };

  return (
    <div className="interactive-floor-plan-wrap">
      <h2 className="floor-plan-title">مخطط الطابق التفاعلي</h2>
      <p className="floor-plan-desc">انقر على غرفة لتحديدها. استخدم Tab للتنقل واضغط Enter أو مسافة للاختيار.</p>

      <svg viewBox="0 0 1600 700" role="img" aria-labelledby="title desc" className="floor-plan-svg" preserveAspectRatio="xMidYMid meet">
        <title id="title">مخطط طابق الفندق مع أربع غرف في الزوايا ومصاعد مركزية</title>
        <desc id="desc">أربع غرف في كل زاوية، ممرات على شكل صليب، ومنطقة مركزية تحتوي على مصعدين ودرج.</desc>

        {/* Outer shell */}
        <rect className="outline" x="10" y="10" width="1580" height="680" rx="18"/>

        {/* Corridors (cross) */}
        <rect className="corridor" x="10" y="320" width="1580" height="60" rx="8"/>
        <rect className="corridor" x="770" y="10" width="60" height="680" rx="8"/>

        {/* Central core (elevators + stairs) */}
        <g className="core" transform="translate(700,250)">
          <rect x="0" y="0" width="200" height="200" rx="14"/>
          {/* Elevators */}
          <g className="elevator">
            <rect x="18" y="24" width="70" height="140" rx="10"/>
            <rect x="112" y="24" width="70" height="140" rx="10"/>
            <text x="100" y="187" textAnchor="middle" className="label-small">مصاعد</text>
          </g>
          {/* Stairs */}
          <g className="stairs">
            <rect x="60" y="80" width="80" height="80" rx="8" fillOpacity="0.35" stroke="#586173"/>
            <path d="M70 150 h15 v-10 h15 v-10 h15 v-10 h15 v-10 h15" fill="none" stroke="#9fb3cc" strokeWidth="3"/>
            <text x="100" y="68" textAnchor="middle" className="label-small">درج</text>
          </g>
        </g>

        {/* ROOMS */}
        {/* Top-Left Room 101 */}
        <g
          className={`room ${selectedRoom === '101' ? 'selected' : ''}`}
          tabIndex="0"
          data-room-id="101"
          role="button"
          aria-label="اختر الغرفة 101"
          transform="translate(15,15)"
          onClick={() => handleRoomClick('101')}
          onKeyDown={(e) => handleKeyDown(e, '101')}
        >
          <title>غرفة 101</title>
          <rect x="0" y="0" width="745" height="295" rx="12"/>
          <text x="372" y="160" textAnchor="middle" className="label">101</text>
        </g>

        {/* Top-Right Room 102 */}
        <g
          className={`room ${selectedRoom === '102' ? 'selected' : ''}`}
          tabIndex="0"
          data-room-id="102"
          role="button"
          aria-label="اختر الغرفة 102"
          transform="translate(840,15)"
          onClick={() => handleRoomClick('102')}
          onKeyDown={(e) => handleKeyDown(e, '102')}
        >
          <title>غرفة 102</title>
          <rect x="0" y="0" width="745" height="295" rx="12"/>
          <text x="372" y="160" textAnchor="middle" className="label">102</text>
        </g>

        {/* Bottom-Left Room 103 */}
        <g
          className={`room ${selectedRoom === '103' ? 'selected' : ''}`}
          tabIndex="0"
          data-room-id="103"
          role="button"
          aria-label="اختر الغرفة 103"
          transform="translate(15,390)"
          onClick={() => handleRoomClick('103')}
          onKeyDown={(e) => handleKeyDown(e, '103')}
        >
          <title>غرفة 103</title>
          <rect x="0" y="0" width="745" height="295" rx="12"/>
          <text x="372" y="160" textAnchor="middle" className="label">103</text>
        </g>

        {/* Bottom-Right Room 104 */}
        <g
          className={`room ${selectedRoom === '104' ? 'selected' : ''}`}
          tabIndex="0"
          data-room-id="104"
          role="button"
          aria-label="اختر الغرفة 104"
          transform="translate(840,390)"
          onClick={() => handleRoomClick('104')}
          onKeyDown={(e) => handleKeyDown(e, '104')}
        >
          <title>غرفة 104</title>
          <rect x="0" y="0" width="745" height="295" rx="12"/>
          <text x="372" y="160" textAnchor="middle" className="label">104</text>
        </g>

        <text x="800" y="35" textAnchor="middle" className="label-small">شمال</text>
      </svg>

      <div className="legend" aria-hidden="true">
        <span><i className="i-room"></i>غرفة</span>
        <span><i className="i-core"></i>المركز (مصاعد ودرج)</span>
      </div>
    </div>
  );
};

export default InteractiveFloorPlan;
