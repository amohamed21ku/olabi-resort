import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../App'

const MAP_URL = 'https://www.google.com/maps/place/%D9%85%D8%AC%D9%85%D8%B9+%D8%A7%D9%84%D8%B9%D9%84%D8%A8%D9%8A%E2%80%AD/@35.9225571,35.9804744,913m/data=!3m2!1e3!4b1!4m6!3m5!1s0x1524290f89b86211:0x4f11b431c197dc0e!8m2!3d35.9225528!4d35.9830493!16s%2Fg%2F11srr8wmc3?entry=ttu&g_ep=EgoyMDI2MDUxMC4wIKXMDSoASAFQAw%3D%3D'
const ROAD = 'M 126,364 C 142,316 166,282 202,252 C 238,222 282,204 330,178 C 378,152 414,118 458,94 C 490,76 526,70 574,78'
const PATH_LEN = 670

const PINS = [
  [126, 364, '#2e83b9'],
  [574, 78, '#c84c2c'],
]

const TREES = [
  [448, 268], [468, 252], [490, 270], [510, 246],
  [532, 266], [552, 252], [574, 272], [594, 256],
]

const textByDir = {
  ar: {
    title: '\u0627\u0641\u062a\u062d \u0641\u064a \u062e\u0631\u0627\u0626\u0637 \u062c\u0648\u062c\u0644',
    aria: '\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0645\u0646\u062a\u062c\u0639 \u0627\u0644\u0639\u0644\u0628\u064a',
    origin: '\u0627\u0644\u0644\u0627\u0630\u0642\u064a\u0629',
    destination: '\u0645\u0646\u062a\u062c\u0639 \u0627\u0644\u0639\u0644\u0628\u064a',
    place: '\u0643\u0633\u0628 \u00b7 \u0633\u0648\u0631\u064a\u0627',
    distance: '\u062d\u0648\u0627\u0644\u064a 60 \u0643\u0645',
    duration: '1.5 \u0633\u0627\u0639\u0629',
    sea: '\u0627\u0644\u0628\u062d\u0631 \u0627\u0644\u0645\u062a\u0648\u0633\u0637',
  },
  en: {
    title: 'Open in Google Maps',
    aria: 'Map to Olabi Resort',
    origin: 'Latakia',
    destination: 'Olabi Resort',
    place: 'Kasab · Syria',
    distance: 'About 60 km',
    duration: '1.5 hours',
    sea: 'Mediterranean Sea',
  },
}

export default function DirectionsMap() {
  const { isRTL } = useLanguage()
  const [animate, setAnimate] = useState(false)
  const ref = useRef(null)
  const copy = isRTL ? textByDir.ar : textByDir.en

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setAnimate(true)
      },
      { threshold: 0.25 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <a
      ref={ref}
      href={MAP_URL}
      target="_blank"
      rel="noreferrer"
      title={copy.title}
      style={{
        display: 'block',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        color: 'inherit',
        boxShadow: '0 14px 48px rgba(20, 32, 22, 0.28)',
        transition: 'box-shadow 0.3s, transform 0.3s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 18px 60px rgba(20, 32, 22, 0.36)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 14px 48px rgba(20, 32, 22, 0.28)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <style>{`
        @keyframes mapPulse {
          0% { transform: scale(0.45); opacity: 0.55; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes mapFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes mapDash {
          from { stroke-dashoffset: 28; }
          to { stroke-dashoffset: 0; }
        }
        .direction-pin-ring {
          transform-box: fill-box;
          transform-origin: center;
        }
        .direction-dash {
          animation: mapDash 1.8s linear infinite;
        }
        .direction-destination {
          animation: mapFloat 2.8s ease-in-out infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 700 430"
        style={{ width: '100%', display: 'block', background: '#eef0e7' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={copy.aria}
      >
        <defs>
          <linearGradient id="mapLand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5efe2" />
            <stop offset="54%" stopColor="#dfe9d6" />
            <stop offset="100%" stopColor="#b8d2b5" />
          </linearGradient>
          <linearGradient id="mapSea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b8d6df" />
            <stop offset="100%" stopColor="#6ea2bf" />
          </linearGradient>
          <linearGradient id="routeStroke" x1="126" y1="364" x2="574" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2e83b9" />
            <stop offset="100%" stopColor="#c84c2c" />
          </linearGradient>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="#1a271b" floodOpacity="0.25" />
          </filter>
          <clipPath id="mapClip">
            <rect width="700" height="430" rx="18" />
          </clipPath>
        </defs>

        <g clipPath="url(#mapClip)">
          <rect width="700" height="430" fill="url(#mapLand)" />

          <path
            d="M0,0 L152,0 C126,54 134,104 118,158 C98,226 74,266 82,342 C86,382 96,410 106,430 L0,430 Z"
            fill="url(#mapSea)"
          />
          <path
            d="M152,0 C126,54 134,104 118,158 C98,226 74,266 82,342 C86,382 96,410 106,430"
            fill="none"
            stroke="#4e87a0"
            strokeDasharray="6 7"
            strokeWidth="2"
            opacity="0.58"
          />

          <g opacity="0.26">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={86 + i * 70} y1="0" x2={46 + i * 70} y2="430" stroke="#ffffff" strokeWidth="1" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={44 + i * 58} x2="700" y2={18 + i * 58} stroke="#ffffff" strokeWidth="1" />
            ))}
          </g>

          <path d="M186,430 C218,360 252,324 320,302 C386,280 436,230 470,176 C502,124 546,80 660,48 L700,34 L700,430 Z" fill="#c7deb9" opacity="0.7" />
          <path d="M236,430 C270,370 316,342 374,318 C444,290 492,238 520,174 C548,110 586,72 700,54 L700,430 Z" fill="#a8c99f" opacity="0.48" />
          <path d="M188,164 C234,154 264,136 304,126 C348,114 374,118 416,96" fill="none" stroke="#d9c18f" strokeWidth="9" strokeLinecap="round" opacity="0.42" />
          <path d="M254,348 C314,330 364,334 420,300 C482,264 524,220 620,212" fill="none" stroke="#d9c18f" strokeWidth="8" strokeLinecap="round" opacity="0.35" />

          <text x="56" y="300" fill="#2f6d88" fontSize="12" textAnchor="middle" fontFamily="system-ui,sans-serif" opacity="0.5" transform="rotate(-75,56,300)">
            {copy.sea}
          </text>

          {TREES.map(([x, y], i) => (
            <g key={i} opacity="0.92">
              <rect x={x - 2} y={y + 9} width="4" height="8" rx="1" fill="#76542f" />
              <path d={`M${x},${y - 12} L${x - 13},${y + 10} L${x + 13},${y + 10} Z`} fill={i % 2 ? '#406f3f' : '#315e35'} />
              <path d={`M${x},${y - 22} L${x - 9},${y - 2} L${x + 9},${y - 2} Z`} fill={i % 2 ? '#4f804a' : '#3d713f'} />
            </g>
          ))}

          <path d={ROAD} fill="none" stroke="#ffffff" strokeWidth="13" strokeLinecap="round" opacity="0.92" filter="url(#softShadow)" />
          <path d={ROAD} fill="none" stroke="#314b30" strokeWidth="7" strokeLinecap="round" opacity="0.72" />
          <path
            d={ROAD}
            fill="none"
            stroke="url(#routeStroke)"
            strokeWidth="5"
            strokeLinecap="round"
            style={{
              strokeDasharray: PATH_LEN,
              strokeDashoffset: animate ? 0 : PATH_LEN,
              transition: 'stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1) 0.35s',
            }}
          />
          <path d={ROAD} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="12 16" className="direction-dash" />

          <g>
            <rect x="286" y="196" width="128" height="56" rx="12" fill="rgba(255,255,255,0.94)" filter="url(#softShadow)" />
            <text x="350" y="218" fill="#2d4429" fontSize="15" textAnchor="middle" fontWeight="800" fontFamily="system-ui,sans-serif">
              {copy.distance}
            </text>
            <text x="350" y="238" fill="#6a6d58" fontSize="12" textAnchor="middle" fontWeight="600" fontFamily="system-ui,sans-serif">
              {copy.duration}
            </text>
          </g>

          {PINS.map(([x, y, color], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="22"
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="direction-pin-ring"
                style={{ animation: animate ? `mapPulse 2.6s ease-out ${i * 0.8}s infinite` : 'none' }}
              />
              <circle cx={x} cy={y} r="10" fill="#ffffff" stroke={color} strokeWidth="4" />
              <circle cx={x} cy={y} r="4" fill={color} />
            </g>
          ))}

          <g className="direction-destination" filter="url(#softShadow)">
            <path d="M574,34 C558,34 546,47 546,63 C546,84 574,110 574,110 C574,110 602,84 602,63 C602,47 590,34 574,34 Z" fill="#c84c2c" />
            <circle cx="574" cy="62" r="10" fill="#ffffff" />
            <circle cx="574" cy="62" r="4" fill="#c84c2c" />
          </g>

          <rect x="78" y="324" width="96" height="28" rx="8" fill="rgba(255,255,255,0.94)" />
          <text x="126" y="343" fill="#254b65" fontSize="13" textAnchor="middle" fontWeight="700" fontFamily="system-ui,sans-serif">
            {copy.origin}
          </text>

          <rect x="494" y="116" width="160" height="58" rx="12" fill="rgba(255,255,255,0.96)" filter="url(#softShadow)" />
          <text x="574" y="139" fill="#243824" fontSize="14" textAnchor="middle" fontWeight="800" fontFamily="system-ui,sans-serif">
            {copy.destination}
          </text>
          <text x="574" y="158" fill="#7a7860" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="system-ui,sans-serif">
            {copy.place}
          </text>

          <g>
            <rect x="254" y="386" width="192" height="30" rx="15" fill="#3d5a3a" />
            <text x="350" y="406" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="700" fontFamily="system-ui,sans-serif">
              {copy.title}
            </text>
          </g>
        </g>
      </svg>
    </a>
  )
}
