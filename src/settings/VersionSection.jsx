import React from 'react'
import SenseiLogo from '../assets/sensei-logo.svg?react'

const STARS = [
  { x:   0, y: -72, size: 7, anim: 'twinkle', dur: 2.8, delay: 0.3 },
  { x: -76, y:   0, size: 6, anim: 'twinkle', dur: 3.3, delay: 1.7 },
  { x:  74, y:   2, size: 6, anim: 'twinkle', dur: 2.5, delay: 0.8 },
  { x:   2, y:  72, size: 6, anim: 'twinkle', dur: 3.1, delay: 2.4 },
  { x: -55, y: -56, size: 5, anim: 'twinkle', dur: 2.7, delay: 1.2 },
  { x:  57, y: -54, size: 5, anim: 'twinkle', dur: 3.4, delay: 0.5 },
  { x: -57, y:  53, size: 4, anim: 'twinkle', dur: 2.4, delay: 2.9 },
  { x:  55, y:  55, size: 4, anim: 'twinkle', dur: 3.0, delay: 0.1 },
  { x: -30, y: -78, size: 4, anim: 'twinkle', dur: 2.6, delay: 1.9 },
  { x:  32, y:  78, size: 3, anim: 'twinkle', dur: 3.5, delay: 0.7 },
  { x: -50, y: -48, size: 4, anim: 'driftNW', dur: 3.8, delay: 0.0 },
  { x:  48, y: -50, size: 4, anim: 'driftNE', dur: 4.2, delay: 1.1 },
  { x:  -8, y: -58, size: 3, anim: 'driftN',  dur: 3.6, delay: 2.0 },
  { x:  54, y:  40, size: 4, anim: 'driftSE', dur: 4.0, delay: 0.4 },
  { x: -56, y:  38, size: 3, anim: 'driftSW', dur: 3.9, delay: 2.3 },
  { x:  66, y: -16, size: 4, anim: 'driftE',  dur: 3.7, delay: 0.9 },
  { x: -68, y:  18, size: 3, anim: 'driftW',  dur: 4.1, delay: 1.5 },
  { x:  20, y:  66, size: 3, anim: 'driftS',  dur: 3.5, delay: 2.7 },
  { x: -24, y:  64, size: 2, anim: 'driftSW', dur: 2.6, delay: 0.6 },
  { x:  34, y: -64, size: 2, anim: 'driftNE', dur: 2.4, delay: 1.8 },
  { x: -36, y: -62, size: 2, anim: 'driftNW', dur: 2.7, delay: 0.9 },
  { x:  60, y:  20, size: 2, anim: 'driftE',  dur: 2.3, delay: 3.1 },
  { x: -12, y:  76, size: 2, anim: 'driftS',  dur: 2.5, delay: 1.4 },
  { x:  76, y: -32, size: 2, anim: 'driftE',  dur: 2.8, delay: 0.2 },
  { x: -78, y: -26, size: 2, anim: 'driftW',  dur: 2.6, delay: 2.5 },
  { x:  42, y:  70, size: 2, anim: 'driftSE', dur: 2.9, delay: 0.7 },
  { x: -44, y: -72, size: 2, anim: 'driftNW', dur: 2.4, delay: 1.3 },
  { x:  16, y: -78, size: 2, anim: 'driftN',  dur: 2.7, delay: 3.4 },
]

function VersionSection() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'relative', width: 240, height: 240, flexShrink: 0 }}>
        {STARS.map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <div style={{ animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`, color: 'var(--text-primary)' }}>
              <svg width={s.size} height={s.size} viewBox="-1 -1 2 2">
                <path d="M0 -1 L0.25 -0.25 L1 0 L0.25 0.25 L0 1 L-0.25 0.25 L-1 0 L-0.25 -0.25Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ animation: 'senseiTravel 7s linear infinite' }}>
            <div className="sensei-blink" style={{ color: 'var(--text-primary)', animation: 'senseiGlow 7s linear infinite' }}>
              <SenseiLogo width={100} height={100} />
            </div>
          </div>
        </div>
      </div>

      <p style={{
        position: 'absolute', bottom: 0, right: 0,
        margin: 0, fontSize: 11, fontWeight: 700,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}>
        v: beta
      </p>
    </div>
  )
}

export default VersionSection
