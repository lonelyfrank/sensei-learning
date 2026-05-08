import React, { useState } from 'react'
import SenseiLogo from '../assets/sensei-logo.svg?react'
import SenseiGame from './SenseiGame.jsx'

// 28 stelle vicine — cluster attorno al logo
const STARS = [
  { x:   0, y: -72, size: 8, anim: 'twinkle', dur: 2.8, delay: 0.3 },
  { x: -76, y:   0, size: 7, anim: 'twinkle', dur: 3.3, delay: 1.7 },
  { x:  74, y:   2, size: 6, anim: 'twinkle', dur: 2.5, delay: 0.8 },
  { x:   2, y:  72, size: 6, anim: 'twinkle', dur: 3.1, delay: 2.4 },
  { x: -55, y: -56, size: 6, anim: 'twinkle', dur: 2.7, delay: 1.2 },
  { x:  57, y: -54, size: 5, anim: 'twinkle', dur: 3.4, delay: 0.5 },
  { x: -57, y:  53, size: 5, anim: 'twinkle', dur: 2.4, delay: 2.9 },
  { x:  55, y:  55, size: 4, anim: 'twinkle', dur: 3.0, delay: 0.1 },
  { x: -30, y: -78, size: 5, anim: 'twinkle', dur: 2.6, delay: 1.9 },
  { x:  32, y:  78, size: 3, anim: 'twinkle', dur: 3.5, delay: 0.7 },
  { x: -50, y: -48, size: 4, anim: 'driftNW', dur: 3.8, delay: 0.0 },
  { x:  48, y: -50, size: 4, anim: 'driftNE', dur: 4.2, delay: 1.1 },
  { x:  -8, y: -58, size: 4, anim: 'driftN',  dur: 3.6, delay: 2.0 },
  { x:  54, y:  40, size: 5, anim: 'driftSE', dur: 4.0, delay: 0.4 },
  { x: -56, y:  38, size: 3, anim: 'driftSW', dur: 3.9, delay: 2.3 },
  { x:  66, y: -16, size: 4, anim: 'driftE',  dur: 3.7, delay: 0.9 },
  { x: -68, y:  18, size: 3, anim: 'driftW',  dur: 4.1, delay: 1.5 },
  { x:  20, y:  66, size: 4, anim: 'driftS',  dur: 3.5, delay: 2.7 },
  { x: -24, y:  64, size: 3, anim: 'driftSW', dur: 2.6, delay: 0.6 },
  { x:  34, y: -64, size: 2, anim: 'driftNE', dur: 2.4, delay: 1.8 },
  { x: -36, y: -62, size: 2, anim: 'driftNW', dur: 2.7, delay: 0.9 },
  { x:  60, y:  20, size: 2, anim: 'driftE',  dur: 2.3, delay: 3.1 },
  { x: -12, y:  76, size: 2, anim: 'driftS',  dur: 2.5, delay: 1.4 },
  { x:  76, y: -32, size: 2, anim: 'driftE',  dur: 2.8, delay: 0.2 },
  { x: -78, y: -26, size: 3, anim: 'driftW',  dur: 2.6, delay: 2.5 },
  { x:  42, y:  70, size: 2, anim: 'driftSE', dur: 2.9, delay: 0.7 },
  { x: -44, y: -72, size: 3, anim: 'driftNW', dur: 2.4, delay: 1.3 },
  { x:  16, y: -78, size: 2, anim: 'driftN',  dur: 2.7, delay: 3.4 },
]

// 56 stelle extra — si aggiungono dopo 3 click, coprono tutto il pannello
const EXTRA_STARS = [
  // anello medio (90–175 px)
  { x: -118, y:  -95, size: 5, anim: 'twinkle', dur: 3.2, delay: 0.4 },
  { x:  108, y: -125, size: 4, anim: 'driftNE', dur: 3.8, delay: 1.2 },
  { x:  148, y:   42, size: 5, anim: 'twinkle', dur: 2.9, delay: 2.1 },
  { x:  -92, y:  138, size: 4, anim: 'driftS',  dur: 4.1, delay: 0.6 },
  { x:  162, y:  -74, size: 3, anim: 'driftE',  dur: 3.5, delay: 1.8 },
  { x: -158, y:   62, size: 5, anim: 'twinkle', dur: 3.0, delay: 3.2 },
  { x:   88, y:  152, size: 3, anim: 'driftSE', dur: 4.3, delay: 0.9 },
  { x: -135, y: -148, size: 4, anim: 'driftNW', dur: 3.6, delay: 2.4 },
  { x:  112, y:  138, size: 3, anim: 'twinkle', dur: 2.7, delay: 0.2 },
  { x: -102, y: -162, size: 3, anim: 'driftN',  dur: 3.9, delay: 1.5 },
  { x:  142, y: -128, size: 2, anim: 'driftNE', dur: 3.4, delay: 2.8 },
  { x: -165, y:  -88, size: 3, anim: 'twinkle', dur: 3.1, delay: 0.7 },
  { x:  125, y:  162, size: 2, anim: 'driftSE', dur: 4.0, delay: 1.9 },
  { x: -148, y:  118, size: 3, anim: 'driftW',  dur: 3.7, delay: 3.5 },
  { x:   98, y: -148, size: 2, anim: 'twinkle', dur: 2.8, delay: 1.1 },
  { x: -112, y:  148, size: 3, anim: 'driftSW', dur: 4.2, delay: 0.3 },
  { x:  158, y:   28, size: 3, anim: 'driftE',  dur: 3.3, delay: 2.6 },
  { x: -142, y:  -52, size: 2, anim: 'twinkle', dur: 3.8, delay: 1.4 },
  { x:   92, y: -132, size: 3, anim: 'driftN',  dur: 2.9, delay: 0.5 },
  { x: -108, y:  112, size: 2, anim: 'driftW',  dur: 4.4, delay: 2.2 },
  // anello esterno (180–265 px)
  { x: -210, y: -190, size: 4, anim: 'driftNW', dur: 4.8, delay: 0.8 },
  { x:  195, y: -215, size: 4, anim: 'driftNE', dur: 5.0, delay: 2.0 },
  { x:  228, y:  108, size: 3, anim: 'driftE',  dur: 4.5, delay: 1.3 },
  { x: -185, y:  232, size: 3, anim: 'driftSW', dur: 4.9, delay: 3.0 },
  { x:  248, y: -148, size: 2, anim: 'driftNE', dur: 4.6, delay: 0.5 },
  { x: -252, y:  125, size: 4, anim: 'twinkle', dur: 3.8, delay: 1.7 },
  { x:  172, y:  238, size: 2, anim: 'driftSE', dur: 5.1, delay: 2.9 },
  { x: -218, y: -205, size: 2, anim: 'driftNW', dur: 4.7, delay: 0.1 },
  { x:  205, y:  218, size: 2, anim: 'driftSE', dur: 4.3, delay: 1.6 },
  { x: -178, y: -248, size: 4, anim: 'twinkle', dur: 3.5, delay: 2.8 },
  { x:  238, y: -195, size: 2, anim: 'driftNE', dur: 4.9, delay: 0.4 },
  { x: -258, y: -158, size: 2, anim: 'driftW',  dur: 5.2, delay: 3.4 },
  { x:  212, y:  255, size: 2, anim: 'driftSE', dur: 4.4, delay: 1.0 },
  { x: -238, y:  188, size: 2, anim: 'driftSW', dur: 4.6, delay: 2.5 },
  { x:  178, y: -238, size: 2, anim: 'driftN',  dur: 5.0, delay: 0.7 },
  { x: -192, y:  228, size: 2, anim: 'driftS',  dur: 4.8, delay: 1.9 },
  { x:  255, y:   78, size: 2, anim: 'driftE',  dur: 4.2, delay: 3.1 },
  { x: -235, y:  -95, size: 2, anim: 'driftW',  dur: 5.3, delay: 0.6 },
  { x:  168, y: -225, size: 2, anim: 'driftNE', dur: 4.5, delay: 2.3 },
  { x: -198, y:  212, size: 2, anim: 'driftSW', dur: 4.7, delay: 1.2 },
  // bordo pannello (280–380 px)
  { x: -315, y: -280, size: 3, anim: 'driftNW', dur: 5.5, delay: 0.9 },
  { x:  305, y: -310, size: 3, anim: 'driftN',  dur: 5.8, delay: 2.1 },
  { x:  345, y:  155, size: 1, anim: 'driftE',  dur: 5.2, delay: 1.4 },
  { x: -285, y:  325, size: 1, anim: 'driftS',  dur: 5.6, delay: 3.3 },
  { x:  358, y: -208, size: 1, anim: 'driftNE', dur: 5.4, delay: 0.2 },
  { x: -368, y:  188, size: 3, anim: 'twinkle', dur: 4.2, delay: 1.8 },
  { x:  278, y:  338, size: 1, anim: 'driftSE', dur: 5.9, delay: 2.6 },
  { x: -328, y: -298, size: 1, anim: 'driftNW', dur: 5.3, delay: 0.5 },
  { x:  318, y:  315, size: 1, anim: 'driftSE', dur: 5.7, delay: 1.1 },
  { x: -275, y: -348, size: 3, anim: 'twinkle', dur: 3.9, delay: 3.7 },
  { x:  342, y: -278, size: 1, anim: 'driftNE', dur: 5.5, delay: 0.8 },
  { x: -362, y: -222, size: 1, anim: 'driftW',  dur: 5.8, delay: 2.4 },
  { x:  298, y:  355, size: 1, anim: 'driftS',  dur: 5.1, delay: 1.5 },
  { x: -345, y:  272, size: 1, anim: 'driftSW', dur: 5.4, delay: 0.3 },
  { x:  265, y: -342, size: 1, anim: 'driftN',  dur: 5.6, delay: 2.9 },
  { x: -292, y:  328, size: 2, anim: 'driftW',  dur: 4.8, delay: 1.6 },
]

function VersionSection() {
  const [pulseKey, setPulseKey] = useState(0)
  const [clickCount, setClickCount] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [gameActive, setGameActive] = useState(false)

  const handleLogoClick = () => {
    setPulseKey(k => k + 1)
    if (!expanded) {
      const next = clickCount + 1
      if (next >= 3) { setExpanded(true); setGameActive(true) }
      else setClickCount(next)
    }
  }

  const handleGameExit = () => {
    setGameActive(false); setExpanded(false); setClickCount(0)
  }

  // ALL_STARS sempre montate — le extra partono con opacity:0 e fanno fade-in
  // tramite CSS transition quando expanded diventa true, senza remount
  const coreCount = STARS.length

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

      {/* Campo stellare — posizionato rispetto al centro del pannello */}
      {[...STARS, ...EXTRA_STARS].map((s, i) => {
        const isExtra = i >= coreCount
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${s.x}px)`,
              top: `calc(50% + ${s.y}px)`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              opacity: isExtra && !expanded ? 0 : 1,
              transition: isExtra ? 'opacity 1.5s ease' : 'none',
            }}
          >
            <div style={{ animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`, color: 'var(--text-primary)' }}>
              <svg width={s.size} height={s.size} viewBox="-1 -1 2 2">
                <path d="M0 -1 L0.25 -0.25 L1 0 L0.25 0.25 L0 1 L-0.25 0.25 L-1 0 L-0.25 -0.25Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        )
      })}

      {/* Logo Sensei — nascosto durante il gioco */}
      {!gameActive && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ animation: 'senseiTravel 7s linear infinite' }}>
            <div
              className="sensei-blink"
              style={{ color: 'var(--text-primary)', animation: 'senseiGlow 7s linear infinite' }}
              onClick={handleLogoClick}
            >
              <div key={pulseKey} style={{ animation: pulseKey > 0 ? 'logoPulse 0.55s ease forwards' : 'none' }}>
                <SenseiLogo width={100} height={100} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* v: beta — nascosta durante il gioco */}
      {!gameActive && (
        <p style={{
          position: 'absolute', bottom: 0, right: 0,
          margin: 0, fontSize: 11, fontWeight: 700,
          fontFamily: "'Courier New', monospace",
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)', userSelect: 'none',
        }}>
          v: beta
        </p>
      )}

      {/* Minigioco — overlay trasparente sulle stelle espanse */}
      {gameActive && <SenseiGame onExit={handleGameExit} />}

    </div>
  )
}

export default VersionSection
