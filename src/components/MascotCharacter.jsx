import { useState, useEffect, useRef } from 'react'

const SPEECH = {
  welcome:     "Hi! I'm Aria ✨ Let's get you hired!",
  reading:     "Reading your resume carefully... 📖",
  coding:      "Time to show your coding skills! 💻",
  analyzing:   "Comparing your profile to the JD... 🔍",
  coffee:      "Grab a ☕ — crafting your questions!",
  music:       "Getting in the zone 🎵",
  interview:   "Take a breath, think it through 💭",
  thinking:    "Hmm, interesting question... 🤔",
  celebrating: "You're going to get hired! 🎉",
  idle:        "Ready when you are! 🚀",
}

// SVG defs block — gradients shared across all renders
const Defs = () => (
  <defs>
    <radialGradient id="mc-skin" cx="38%" cy="32%" r="65%">
      <stop offset="0%"   stopColor="#FFF0E0"/>
      <stop offset="55%"  stopColor="#FFD4A0"/>
      <stop offset="100%" stopColor="#FFB870"/>
    </radialGradient>
    <linearGradient id="mc-hair" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%"   stopColor="#D946EF"/>
      <stop offset="45%"  stopColor="#A855F7"/>
      <stop offset="100%" stopColor="#EC4899"/>
    </linearGradient>
    <linearGradient id="mc-outfit" x1="0%" y1="0%" x2="30%" y2="100%">
      <stop offset="0%"   stopColor="#93C5FD"/>
      <stop offset="100%" stopColor="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="mc-outfit2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stopColor="#A78BFA"/>
      <stop offset="100%" stopColor="#7C3AED"/>
    </linearGradient>
    <radialGradient id="mc-cheek">
      <stop offset="0%"   stopColor="#FF8FAB" stopOpacity="0.45"/>
      <stop offset="100%" stopColor="#FF8FAB" stopOpacity="0"/>
    </radialGradient>
    <filter id="mc-glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="mc-shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#7C3AED" floodOpacity="0.25"/>
    </filter>
  </defs>
)

// ── Props ──────────────────────────────────────────────────────────────────────

const LaptopProp = () => (
  <g>
    <rect x="50" y="215" width="120" height="66" rx="7" fill="#0F172A"/>
    <rect x="54" y="219" width="112" height="52" rx="5" fill="#1E3A8A"/>
    <text x="60" y="234" fill="#60A5FA" fontSize="6.5" fontFamily="'Courier New',monospace">{'const interview = () => {'}</text>
    <text x="65" y="244" fill="#34D399" fontSize="6.5" fontFamily="'Courier New',monospace">{'  return "I am hired!";'}</text>
    <text x="60" y="254" fill="#60A5FA" fontSize="6.5" fontFamily="'Courier New',monospace">{'}'}</text>
    <rect x="60" y="257" width="5" height="8" fill="#60A5FA">
      <animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/>
    </rect>
    <rect x="50" y="279" width="120" height="5" rx="2.5" fill="#1E293B"/>
    <ellipse cx="110" cy="282" rx="10" ry="2" fill="#334155"/>
  </g>
)

const BookProp = () => (
  <g transform="translate(55, 215)">
    <rect x="0"  y="0" width="55" height="68" rx="4" fill="#7C3AED"/>
    <rect x="55" y="0" width="55" height="68" rx="4" fill="#6D28D9"/>
    <line x1="55" y1="0" x2="55" y2="68" stroke="#C4B5FD" strokeWidth="2.5"/>
    <rect x="0"  y="8"  width="54" height="60" rx="0" fill="rgba(0,0,0,0.12)"/>
    {[0,1,2,3,4,5].map(i => (
      <g key={i}>
        <rect x="6"  y={12+i*9} width={40-i%3*8} height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
        <rect x="61" y={12+i*9} width={38-i%2*7} height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      </g>
    ))}
    <ellipse cx="55" cy="34" rx="4" ry="34" fill="rgba(0,0,0,0.2)"/>
  </g>
)

const CoffeeProp = () => (
  <g transform="translate(148, 202)">
    {[0,12].map((x,i) => (
      <path key={i} d={`M${x} 5 Q${x-6} -8 ${x} -18`}
        stroke="#CBD5E1" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65">
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-7;0,0" dur={`${1.8+i*0.6}s`} repeatCount="indefinite"/>
      </path>
    ))}
    <path d="M0 14 L6 58 L30 58 L36 14 Z" fill="#0F172A"/>
    <rect x="0" y="10" width="36" height="7" rx="3.5" fill="#1E293B"/>
    <ellipse cx="18" cy="13" rx="15" ry="4" fill="#78350F"/>
    <ellipse cx="18" cy="13" rx="10" ry="2.5" fill="#92400E"/>
    <path d="M36 22 Q48 22 48 32 Q48 42 36 42" stroke="#1E293B" strokeWidth="4" fill="none"/>
  </g>
)

const HeadphonesProp = () => (
  <g>
    <path d="M56 112 Q56 68 110 68 Q164 68 164 112" stroke="#7C3AED" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <rect x="44" y="107" width="24" height="32" rx="9" fill="#7C3AED"/>
    <rect x="48" y="111" width="16" height="24" rx="6" fill="#1E293B"/>
    <rect x="152" y="107" width="24" height="32" rx="9" fill="#7C3AED"/>
    <rect x="156" y="111" width="16" height="24" rx="6" fill="#1E293B"/>
    <text x="28"  y="100" fill="#A78BFA" fontSize="18" fontFamily="serif">♪</text>
    <text x="168" y="88"  fill="#F472B6" fontSize="14" fontFamily="serif">♫</text>
    <text x="90"  y="62"  fill="#60A5FA" fontSize="11" fontFamily="serif">♩</text>
  </g>
)

const CelebrateProp = () => (
  <g style={{ fontSize: 20 }}>
    <text x="22"  y="220">🎉</text>
    <text x="165" y="215">✨</text>
    <text x="155" y="255">⭐</text>
    <text x="30"  y="255">🌟</text>
  </g>
)

const ThinkProp = () => (
  <g>
    {/* hand on chin */}
    <ellipse cx="82" cy="197" rx="14" ry="10" fill="url(#mc-skin)" transform="rotate(-20,82,197)"/>
    {/* thought bubbles */}
    <circle cx="155" cy="80" r="4"  fill="rgba(167,139,250,0.4)"/>
    <circle cx="165" cy="65" r="6"  fill="rgba(167,139,250,0.45)"/>
    <circle cx="178" cy="48" r="9"  fill="rgba(167,139,250,0.35)"/>
    <text x="170" y="53" fill="white" fontSize="8" textAnchor="middle">?</text>
  </g>
)

const PROPS = {
  coding:      LaptopProp,
  interview:   LaptopProp,
  reading:     BookProp,
  coffee:      CoffeeProp,
  analyzing:   CoffeeProp,
  music:       HeadphonesProp,
  celebrating: CelebrateProp,
  welcome:     CelebrateProp,
  thinking:    ThinkProp,
  idle:        null,
}

// ── Main Character ─────────────────────────────────────────────────────────────
export default function MascotCharacter({ theme = 'idle', size = 'md' }) {
  const [blink, setBlink] = useState(false)
  const blinkRef = useRef(null)

  useEffect(() => {
    function scheduleBlink() {
      blinkRef.current = setTimeout(() => {
        setBlink(true)
        blinkRef.current = setTimeout(() => {
          setBlink(false)
          scheduleBlink()
        }, 140)
      }, 2200 + Math.random() * 2800)
    }
    scheduleBlink()
    return () => clearTimeout(blinkRef.current)
  }, [])

  const speech = SPEECH[theme] || SPEECH.idle
  const PropComp = PROPS[theme] || null
  const isCelebrate = theme === 'celebrating' || theme === 'welcome'

  const w = size === 'sm' ? 120 : size === 'lg' ? 280 : 220

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none"
      style={{ width: w }}>

      {/* Speech bubble */}
      <div className="relative mb-2 w-full px-1">
        <div className="rounded-2xl px-3 py-2.5 text-center text-xs text-white/90 leading-relaxed font-medium"
          style={{
            background: 'rgba(8,18,45,0.92)',
            border: '1px solid rgba(167,139,250,0.4)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 30px rgba(124,58,237,0.2)',
          }}>
          {speech}
        </div>
        {/* Arrow */}
        <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
          style={{
            background: 'rgba(8,18,45,0.92)',
            borderRight: '1px solid rgba(167,139,250,0.4)',
            borderBottom: '1px solid rgba(167,139,250,0.4)',
          }}/>
      </div>

      {/* Floating decorative orbs (like Aimm screenshot) */}
      <div className="absolute" style={{ top: 60, right: -8, animation: 'float 3.5s ease-in-out infinite', animationDelay: '0s' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', transform: 'rotate(18deg)', boxShadow: '0 6px 20px rgba(96,165,250,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}/>
      </div>
      <div className="absolute" style={{ top: 100, left: -10, animation: 'float 4.5s ease-in-out infinite', animationDelay: '1.2s' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#f97316)', boxShadow: '0 5px 16px rgba(236,72,153,0.5)' }}/>
      </div>
      <div className="absolute" style={{ top: 180, right: -6, animation: 'float 5s ease-in-out infinite', animationDelay: '0.7s' }}>
        <div style={{ width: 16, height: 16, borderRadius: 5, background: 'linear-gradient(135deg,#10b981,#06b6d4)', transform: 'rotate(-22deg)', boxShadow: '0 4px 14px rgba(16,185,129,0.5)' }}/>
      </div>
      <div className="absolute" style={{ bottom: 80, left: -4, animation: 'float 4s ease-in-out infinite', animationDelay: '2s' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 3px 10px rgba(251,191,36,0.5)' }}/>
      </div>

      {/* Character SVG */}
      <svg
        viewBox="0 0 220 300"
        width={w} height={w * 300 / 220}
        style={{
          filter: 'drop-shadow(0 24px 48px rgba(124,58,237,0.3))',
          animation: 'float 4.2s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      >
        <Defs/>

        {/* Ground shadow */}
        <ellipse cx="110" cy="295" rx="56" ry="9" fill="rgba(0,0,0,0.18)"/>

        {/* ── BODY ── */}
        <rect x="74" y="186" width="72" height="80" rx="24" fill="url(#mc-outfit)" filter="url(#mc-shadow)"/>
        {/* Outfit highlight */}
        <ellipse cx="96" cy="198" rx="20" ry="13" fill="rgba(255,255,255,0.14)"/>
        {/* Collar */}
        <path d="M98 186 Q110 194 122 186" fill="white" opacity="0.12"/>

        {/* ── ARMS ── */}
        <rect x="28" y="190" width="54" height="23" rx="11.5" fill="url(#mc-outfit)"/>
        <circle cx="33"  cy="201" r="13" fill="url(#mc-skin)"/>
        <rect x="138" y="190" width="54" height="23" rx="11.5" fill="url(#mc-outfit)"/>
        <circle cx="187" cy="201" r="13" fill="url(#mc-skin)"/>

        {/* ── PROP ── */}
        {PropComp && <PropComp/>}

        {/* ── NECK ── */}
        <rect x="104" y="175" width="22" height="18" rx="8" fill="url(#mc-skin)"/>

        {/* ── HAIR BACK ── */}
        <path d="M48 112 Q44 54 110 42 Q176 54 172 112 Z" fill="url(#mc-hair)"/>
        {/* Hair volume sides (back) */}
        <path d="M48 112 Q36 148 50 178 Q62 148 62 116 Z" fill="url(#mc-hair)"/>
        <path d="M172 112 Q184 148 170 178 Q158 148 158 116 Z" fill="url(#mc-hair)"/>

        {/* ── HEAD ── */}
        <circle cx="110" cy="122" r="68" fill="url(#mc-skin)" filter="url(#mc-shadow)"/>
        {/* 3D head highlight */}
        <ellipse cx="88" cy="96" rx="24" ry="17" fill="rgba(255,255,255,0.2)" transform="rotate(-25,88,96)"/>

        {/* ── CHEEKS ── */}
        <ellipse cx="72"  cy="138" rx="18" ry="11" fill="url(#mc-cheek)"/>
        <ellipse cx="148" cy="138" rx="18" ry="11" fill="url(#mc-cheek)"/>

        {/* ── EYES ── */}
        {blink ? (
          <g>
            <path d="M78 120 Q93 114 108 120" stroke="#2D1B69" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M112 120 Q127 114 142 120" stroke="#2D1B69" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </g>
        ) : (
          <g>
            {/* Left eye */}
            <ellipse cx="93"  cy="120" rx="14" ry="16" fill="#1E1B4B"/>
            <ellipse cx="93"  cy="120" rx="10" ry="12" fill="#4C1D95"/>
            <ellipse cx="93"  cy="120" rx="6"  ry="8"  fill="#1E1B4B"/>
            <circle  cx="100" cy="111" r="5.5" fill="white"/>
            <circle  cx="86"  cy="127" r="2.2" fill="white" opacity="0.5"/>
            {/* Right eye */}
            <ellipse cx="127" cy="120" rx="14" ry="16" fill="#1E1B4B"/>
            <ellipse cx="127" cy="120" rx="10" ry="12" fill="#4C1D95"/>
            <ellipse cx="127" cy="120" rx="6"  ry="8"  fill="#1E1B4B"/>
            <circle  cx="134" cy="111" r="5.5" fill="white"/>
            <circle  cx="120" cy="127" r="2.2" fill="white" opacity="0.5"/>
          </g>
        )}

        {/* ── NOSE ── */}
        <path d="M106 136 Q110 142 114 136" stroke="#D4916A" strokeWidth="2" fill="none" strokeLinecap="round"/>

        {/* ── MOUTH ── */}
        <path
          d={isCelebrate ? 'M94 152 Q110 168 126 152' : 'M100 150 Q110 160 120 150'}
          stroke="#C87941"
          strokeWidth="3"
          fill={isCelebrate ? 'rgba(255,120,120,0.18)' : 'none'}
          strokeLinecap="round"
        />

        {/* ── HAIR FRONT / BANGS ── */}
        <path d="M48 100 Q58 60 85 68 Q98 50 110 64 Q122 50 135 68 Q158 60 172 100" fill="url(#mc-hair)"/>
        {/* Hair highlight streak */}
        <ellipse cx="86" cy="70" rx="15" ry="7" fill="rgba(255,255,255,0.22)" transform="rotate(-28,86,70)"/>

        {/* ── EARS ── */}
        <ellipse cx="42"  cy="124" rx="8" ry="10" fill="url(#mc-skin)"/>
        <ellipse cx="178" cy="124" rx="8" ry="10" fill="url(#mc-skin)"/>
        {/* Ear inner */}
        <ellipse cx="42"  cy="124" rx="4" ry="6"  fill="#FFB870"/>
        <ellipse cx="178" cy="124" rx="4" ry="6"  fill="#FFB870"/>
        {/* Earrings */}
        <circle cx="42"  cy="132" r="5" fill="#EC4899" filter="url(#mc-glow)"/>
        <circle cx="178" cy="132" r="5" fill="#EC4899" filter="url(#mc-glow)"/>
      </svg>
    </div>
  )
}
