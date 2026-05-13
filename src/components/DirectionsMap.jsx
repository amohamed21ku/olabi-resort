import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../App'

const DIR_URL = 'https://www.google.com/maps/dir/Latakia,+Syria/35.925035,35.9854387'
const ROAD = 'M 150,370 C 145,318 148,278 158,248 C 168,218 190,194 215,174 C 240,154 278,138 310,124 C 342,110 380,97 415,87 C 450,77 492,71 530,77'
const PATH_LEN = 720

const TREES = [
  [458,258],[474,244],[491,261],[507,246],[524,263],
  [540,250],[557,265],[574,254],[591,268],
]

const STARS = [
  [92,22],[150,13],[222,38],[312,17],[388,29],
  [452,9],[512,23],[578,39],[642,15],[667,34],
]

export default function DirectionsMap() {
  const { isRTL } = useLanguage()
  const [go, setGo] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setGo(true) },
      { threshold: 0.25 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      onClick={() => window.open(DIR_URL, '_blank')}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && window.open(DIR_URL, '_blank')}
      title={isRTL ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        transition: 'box-shadow 0.3s, transform 0.3s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 14px 55px rgba(0,0,0,0.48)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.35)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <style>{`
        @keyframes dmPulse {
          0%   { transform: scale(0.3); opacity: 0.85; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes dmBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes dmSway {
          0%, 100% { transform: rotate(-1.3deg); }
          50%       { transform: rotate(1.3deg); }
        }
        .dm-ring {
          transform-box: fill-box;
          transform-origin: center;
        }
        .dm-pin-bounce {
          animation: dmBounce 2.8s ease-in-out infinite;
        }
        .dm-tree {
          transform-box: fill-box;
          transform-origin: bottom center;
        }
      `}</style>

      <svg
        viewBox="0 0 700 440"
        style={{ width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={isRTL ? 'خريطة الوصول إلى منتجع العلبي' : 'Map to Olabi Resort'}
      >
        <defs>
          <linearGradient id="dmSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#07100a" />
            <stop offset="100%" stopColor="#101e12" />
          </linearGradient>
          <linearGradient id="dmSea" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#0d2a48" />
            <stop offset="100%" stopColor="#040e18" />
          </linearGradient>
          <linearGradient id="dmRoad" gradientUnits="userSpaceOnUse"
            x1="150" y1="370" x2="530" y2="77">
            <stop offset="0%"   stopColor="#5ab0e0" />
            <stop offset="100%" stopColor="#e06438" />
          </linearGradient>
          <filter id="dmGlw" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="dmHalo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="dmClip">
            <rect width="700" height="440" rx="16" />
          </clipPath>
        </defs>

        <g clipPath="url(#dmClip)">
          {/* Sky */}
          <rect width="700" height="440" fill="url(#dmSky)" />

          {/* Stars */}
          {STARS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.2 : 0.8}
              fill="#fff" opacity={0.2 + (i % 4) * 0.08} />
          ))}

          {/* Mountains — deep */}
          <polygon points="265,440 365,140 465,440" fill="#0c1e0d" />
          <polygon points="345,440 445,108 545,440" fill="#0e2110" />
          <polygon points="432,440 522,84 612,440"  fill="#102412" />
          <polygon points="514,440 604,68 694,440"  fill="#122714" />

          {/* Mountains — mid */}
          <polygon points="200,440 298,200 396,440" fill="#122510" />
          <polygon points="286,440 378,176 470,440" fill="#152912" />
          <polygon points="368,440 455,160 542,440" fill="#182d15" />
          <polygon points="448,440 530,148 612,440" fill="#1b3118" />

          {/* Mountains — fore */}
          <polygon points="318,440 388,246 458,440" fill="#1e361f" />
          <polygon points="398,440 466,228 534,440" fill="#203b21" />
          <polygon points="478,440 542,212 606,440" fill="#234024" />

          {/* Ground */}
          <path d="M 130,440 C 185,416 250,410 320,406 C 390,402 455,398 530,395 C 605,392 660,391 700,390 L 700,440 Z"
            fill="#1c3320" />

          {/* Sea */}
          <path d="M 0,0 L 0,440 L 138,440 C 130,408 125,370 127,322 C 129,274 140,234 136,184 C 132,134 115,86 100,38 L 76,0 Z"
            fill="url(#dmSea)" />

          {/* Coastline */}
          <path d="M 76,0 C 100,38 115,86 136,184 C 140,234 129,274 127,322 C 125,370 130,408 138,440"
            stroke="#1a4d80" strokeWidth="1.5" fill="none" strokeDasharray="4 4" opacity="0.5" />

          {/* Sea shimmer */}
          {[[18,162,60],[28,202,52],[16,242,66],[26,282,56],[20,322,64],[28,362,55]].map(([x,y,w],i) => (
            <line key={i} x1={x} y1={y} x2={x+w} y2={y}
              stroke="#4088b0" strokeWidth="0.8" opacity="0.2" />
          ))}

          {/* Mediterranean label */}
          <text x="60" y="315" fill="rgba(65,125,185,0.38)" fontSize="7.5"
            textAnchor="middle" fontFamily="Georgia,serif" letterSpacing="1.5"
            transform="rotate(-75,60,315)">
            MEDITERRANEAN SEA
          </text>

          {/* Pine trees near resort */}
          {TREES.map(([x, y], i) => (
            <g key={i} className="dm-tree" style={{
              animationName: 'dmSway',
              animationDuration: `${2.8 + i * 0.15}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: `${i * 0.22}s`,
            }}>
              <rect x={x-2.5} y={y+9} width="5" height="8" rx="1" fill="#3a2010" />
              <polygon points={`${x},${y-5} ${x-13},${y+10} ${x+13},${y+10}`} fill="#153c17" />
              <polygon points={`${x},${y-13} ${x-10},${y+1} ${x+10},${y+1}`}  fill="#1a4a1c" />
              <polygon points={`${x},${y-20} ${x-7},${y-7} ${x+7},${y-7}`}    fill="#205524" />
            </g>
          ))}

          {/* Road — shadow */}
          <path d={ROAD} stroke="#000" strokeWidth="7" fill="none"
            strokeLinecap="round" opacity="0.28" />
          {/* Road — base */}
          <path d={ROAD} stroke="#180e06" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Road — animated gradient */}
          <path
            d={ROAD}
            fill="none"
            strokeLinecap="round"
            filter="url(#dmGlw)"
            style={{
              stroke: 'url(#dmRoad)',
              strokeWidth: 3.5,
              strokeDasharray: PATH_LEN,
              strokeDashoffset: go ? 0 : PATH_LEN,
              transition: 'stroke-dashoffset 2.8s cubic-bezier(0.4,0,0.2,1) 0.5s',
            }}
          />
          {/* Road — center dashes */}
          <path
            d={ROAD}
            fill="none"
            strokeLinecap="butt"
            style={{
              stroke: 'rgba(255,228,130,0.48)',
              strokeWidth: 1.2,
              strokeDasharray: '10 10',
              strokeDashoffset: go ? 0 : PATH_LEN,
              transition: 'stroke-dashoffset 2.8s cubic-bezier(0.4,0,0.2,1) 0.5s',
            }}
          />

          {/* Distance badge */}
          <g style={{ opacity: go ? 1 : 0, transition: 'opacity 0.7s ease 3.4s' }}>
            <rect x="292" y="194" width="106" height="42" rx="8"
              fill="rgba(4,10,4,0.88)" />
            <rect x="292" y="194" width="106" height="42" rx="8"
              stroke="rgba(200,120,50,0.4)" strokeWidth="1" fill="none" />
            <text x="345" y="212" fill="#e8c560" fontSize="12.5"
              textAnchor="middle" fontWeight="700" fontFamily="system-ui,sans-serif">
              ~90 كم
            </text>
            <text x="345" y="228" fill="rgba(255,255,255,0.6)" fontSize="9.5"
              textAnchor="middle" fontFamily="system-ui,sans-serif">
              1.5 – 2 ساعة
            </text>
          </g>

          {/* Latakia — pulse rings */}
          <circle cx="150" cy="370" r="22" fill="none" stroke="#4a90c0" strokeWidth="1.5"
            className="dm-ring"
            style={{ animation: go ? 'dmPulse 2.4s ease-out 0.5s infinite' : 'none' }} />
          <circle cx="150" cy="370" r="15" fill="none" stroke="#4a90c0" strokeWidth="1"
            className="dm-ring"
            style={{ animation: go ? 'dmPulse 2.4s ease-out 1.1s infinite' : 'none' }} />
          {/* Latakia — dot */}
          <circle cx="150" cy="370" r="9" fill="#0b2638" stroke="#5aaad8" strokeWidth="2.5" />
          <circle cx="150" cy="370" r="4" fill="#7abce0" />
          {/* Latakia — label */}
          <rect x="106" y="342" width="88" height="22" rx="5" fill="rgba(3,10,20,0.9)" />
          <text x="150" y="357.5" fill="#fff" fontSize="11" textAnchor="middle"
            fontWeight="600" fontFamily="system-ui,sans-serif">
            اللاذقية
          </text>

          {/* Olabi — pulse rings (outside bounce) */}
          <circle cx="530" cy="80" r="32" fill="none" stroke="#d85c38" strokeWidth="1.5"
            className="dm-ring"
            style={{ animation: go ? 'dmPulse 2.4s ease-out 3.4s infinite' : 'none' }} />
          <circle cx="530" cy="80" r="21" fill="none" stroke="#d85c38" strokeWidth="1"
            className="dm-ring"
            style={{ animation: go ? 'dmPulse 2.4s ease-out 4.0s infinite' : 'none' }} />

          {/* Olabi — bouncing pin */}
          <g className="dm-pin-bounce" filter="url(#dmHalo)">
            <path
              d="M 530,46 C 515,46 505,58 505,71 C 505,90 530,112 530,112 C 530,112 555,90 555,71 C 555,58 545,46 530,46 Z"
              fill="#c84c2c"
            />
            <path
              d="M 530,46 C 515,46 505,58 505,71 C 505,90 530,112 530,112 C 530,112 555,90 555,71 C 555,58 545,46 530,46 Z"
              stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none"
            />
            <circle cx="530" cy="70" r="9" fill="#fff" />
            <circle cx="530" cy="70" r="4" fill="#c84c2c" />
          </g>

          {/* Olabi — label */}
          <rect x="480" y="116" width="100" height="40" rx="6" fill="rgba(3,10,3,0.92)" />
          <rect x="480" y="116" width="100" height="40" rx="6"
            stroke="rgba(200,76,44,0.38)" strokeWidth="1" fill="none" />
          <text x="530" y="132" fill="#fff" fontSize="11.5" textAnchor="middle"
            fontWeight="700" fontFamily="system-ui,sans-serif">
            منتجع العلبي
          </text>
          <text x="530" y="148" fill="rgba(215,155,135,0.88)" fontSize="9"
            textAnchor="middle" fontFamily="system-ui,sans-serif">
            كسب · 1200م
          </text>

          {/* Bottom CTA */}
          <g style={{ opacity: go ? 1 : 0, transition: 'opacity 0.7s ease 4.2s' }}>
            <rect x="250" y="403" width="200" height="30" rx="15"
              fill="rgba(200,76,44,0.92)" />
            <text x="350" y="422.5" fill="#fff" fontSize="11.5" textAnchor="middle"
              fontWeight="600" fontFamily="system-ui,sans-serif">
              {isRTL ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}
            </text>
          </g>
        </g>
      </svg>
    </div>
  )
}
