import React, { useRef, useEffect, useReducer } from 'react'
import SenseiLogo   from '../assets/sensei-logo.svg?react'
import AsteroidIcon from '../assets/game/asteroid.svg?react'
import BombIcon     from '../assets/game/bomb.svg?react'
import CpuIcon      from '../assets/game/cpu.svg?react'
import BatteryIcon  from '../assets/game/battery.svg?react'
import HeartIcon    from '../assets/game/heart.svg?react'
import RocketIcon   from '../assets/game/rocket.svg?react'

// ─── Costanti ────────────────────────────────────────────────────────────────

const LERP       = 0.09   // inerzia del logo sul mouse (0=nessuna, 1=istantaneo)
const SENSEI_R   = 26     // raggio hitbox Sensei (px)
const MAX_LIVES  = 3
const INV_FRAMES = 90     // frame di invincibilità dopo un colpo (~1.5s a 60fps)
const BASE_SPAWN = 85     // frame tra uno spawn e il successivo (si riduce col punteggio)

// ─── Rocket di sfondo ───────────────────────────────────────────────────────
const ROCKET_SPEED     = 0.00055  // percorso completo in ~30s a 60fps
const ROCKET_ANGLE_ADJ = 45       // offset naturale del SVG (punta NE)

// Percorsi variati — waypoint (x,y) relativi al centro del pannello
const ROCKET_PATHS = [
  [[-320, 175], [-140, 75], [10, -5],  [165, -90],  [325, -170]], // BL → TR
  [[ 295,-170], [ 120,-55], [-30, 40], [-185, 110], [-320, 185]], // TR → BL
  [[-325,  55], [-145,-100],[  5,-75], [ 165,  35],  [325,  60]], // L → R ad arco
  [[ 305,-185], [ 110,-55], [-50, 65], [-210, 150], [-310, 200]], // TR → BL diag ripida
  [[  80, 210], [ -30,  80], [-85,-25],[-125,-135],  [-70,-210]], // basso → alto-SX
  [[ 325, 100], [ 145,-45], [  5,-100],[-140,-145], [-285,-180]], // R → curve verso alto
]

// Raggio hitbox, dimensione resa e colore per ogni tipo di oggetto
const RADIUS = { asteroid: 26, bomb: 22, cpu: 18, battery: 18, heart: 18 }
const SIZE   = { asteroid: 52, bomb: 40, cpu: 36, battery: 36, heart: 32 }
// danger = bombe + asteroidi (stesso colore, stessa minaccia)
// collect = cpu + batterie (stesso colore, stesso valore positivo)
// heart = rosso fisso — simbolo vita universale
const COLOR  = {
  asteroid: 'var(--game-danger)',
  bomb:     'var(--game-danger)',
  cpu:      'var(--game-collect)',
  battery:  'var(--game-collect)',
  heart:    '#E24B4A',
}

const ICONS  = { asteroid: AsteroidIcon, bomb: BombIcon, cpu: CpuIcon, battery: BatteryIcon, heart: HeartIcon }

let oid = 0  // ID progressivo per le chiavi React

// ─── Spawn factory ───────────────────────────────────────────────────────────

function makeObject(w, h, lives, score) {
  const r = Math.random()
  let type
  if (lives < MAX_LIVES && r < 0.05)      type = 'heart'
  else if (r < 0.32)                       type = 'bomb'
  else if (r < 0.58)                       type = 'asteroid'
  else if (r < 0.80)                       type = 'cpu'
  else                                     type = 'battery'

  // Spawn da uno dei 4 bordi
  const edge = Math.floor(Math.random() * 4)
  const m    = 70
  let x, y
  if      (edge === 0) { x = Math.random() * w; y = -m      }
  else if (edge === 1) { x = w + m;              y = Math.random() * h }
  else if (edge === 2) { x = Math.random() * w; y = h + m   }
  else                 { x = -m;                 y = Math.random() * h }

  // Direzione verso il centro del pannello (con varianza)
  const tx = w * 0.15 + Math.random() * w * 0.7
  const ty = h * 0.15 + Math.random() * h * 0.7
  const dx = tx - x, dy = ty - y
  const d  = Math.sqrt(dx * dx + dy * dy)
  const spd = 1.2 + Math.random() * 1.5 + score / 600

  const obj = {
    id: oid++, type, x, y,
    vx: (dx / d) * spd, vy: (dy / d) * spd,
    rot: Math.random() * 360,
    rotSpd: (Math.random() - 0.5) * 5,
  }
  if (type === 'asteroid') {
    const sz  = [32, 42, 52][Math.floor(Math.random() * 3)]
    obj.sz   = sz
    obj.hitR = Math.round(sz * 0.5)
  }
  return obj
}

// ─── Componente ──────────────────────────────────────────────────────────────

function SenseiGame({ onExit }) {
  const containerRef = useRef(null)
  const mouseRef     = useRef(null)            // posizione cursore nel pannello
  const posRef       = useRef({ x: 0, y: 0 }) // posizione attuale di Sensei (lerp)
  const gRef         = useRef({
    lives: MAX_LIVES, score: 0, objects: [],
    inv: 0, frame: 0, nextSpawn: 60, cdFrames: 210,
    over: false, w: 0, h: 0,
    rocketT: 0, rocketPathIdx: Math.floor(Math.random() * ROCKET_PATHS.length),
    rocketX: 0, rocketY: 0, rocketAngle: 0, rocketOpacity: 0,
  })
  const rafRef = useRef(null)
  const [, tick] = useReducer(n => n + 1, 0)  // forceUpdate ogni frame

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width: w, height: h } = el.getBoundingClientRect()
    posRef.current   = { x: w / 2, y: h / 2 }
    mouseRef.current = { x: w / 2, y: h / 2 }
    Object.assign(gRef.current, { w, h })

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    el.addEventListener('mousemove', onMove)

    function loop() {
      const g = gRef.current
      const p = posRef.current
      const m = mouseRef.current || p

      if (!g.over) {
        g.frame++
        if (g.cdFrames > 0) g.cdFrames--

        // Sensei segue il mouse con inerzia (anche durante il countdown)
        p.x += (m.x - p.x) * LERP
        p.y += (m.y - p.y) * LERP
        p.x = Math.max(36, Math.min(g.w - 36, p.x))
        p.y = Math.max(36, Math.min(g.h - 36, p.y))

        // Oggetti, collisioni e spawn solo dopo il countdown
        if (g.cdFrames <= 0) {
          if (g.inv > 0) g.inv--

          for (const o of g.objects) { o.x += o.vx; o.y += o.vy; o.rot += o.rotSpd }

          const pad = 120
          g.objects = g.objects.filter(o =>
            o.x > -pad && o.x < g.w + pad && o.y > -pad && o.y < g.h + pad
          )

          const hit = new Set()
          for (const o of g.objects) {
            const r  = o.hitR ?? RADIUS[o.type] ?? 20
            const dx = p.x - o.x, dy = p.y - o.y
            if (dx * dx + dy * dy < (SENSEI_R + r) ** 2) {
              hit.add(o.id)
              if (o.type === 'bomb' || o.type === 'asteroid') {
                if (g.inv === 0) {
                  g.inv = INV_FRAMES
                  if (--g.lives <= 0) { g.lives = 0; g.over = true }
                }
              } else if (o.type === 'cpu')    g.score += 10
              else if  (o.type === 'battery') g.score += 5
              else if  (o.type === 'heart')   g.lives = Math.min(MAX_LIVES, g.lives + 1)
            }
          }
          g.objects = g.objects.filter(o => !hit.has(o.id))

          if (--g.nextSpawn <= 0) {
            g.objects.push(makeObject(g.w, g.h, g.lives, g.score))
            g.nextSpawn = Math.max(22, BASE_SPAWN - Math.floor(g.score / 40))
          }
        }
      }

      // ── Rocket di sfondo (sempre attivo) ──
      if (g.w > 0) {
        g.rocketT += ROCKET_SPEED
        if (g.rocketT >= 1) {
          g.rocketT -= 1
          g.rocketPathIdx = Math.floor(Math.random() * ROCKET_PATHS.length)
        }
        const path = ROCKET_PATHS[g.rocketPathIdx]
        const segs = path.length - 1
        const si   = Math.min(Math.floor(g.rocketT * segs), segs - 1)
        const st   = g.rocketT * segs - si
        const [x0, y0] = path[si], [x1, y1] = path[si + 1]
        g.rocketX = g.w / 2 + x0 + (x1 - x0) * st
        g.rocketY = g.h / 2 + y0 + (y1 - y0) * st
        // angolo: direzione di spostamento, con blend morbido tra segmenti
        let angle = Math.atan2(x1 - x0, -(y1 - y0)) * 180 / Math.PI - ROCKET_ANGLE_ADJ
        if (si + 2 <= segs && st > 0.7) {
          const [x2, y2] = path[si + 2]
          let next = Math.atan2(x2 - x1, -(y2 - y1)) * 180 / Math.PI - ROCKET_ANGLE_ADJ
          let diff = next - angle
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          angle += diff * ((st - 0.7) / 0.3)
        }
        g.rocketAngle = angle
        const fade = 0.07
        g.rocketOpacity = g.rocketT < fade
          ? g.rocketT / fade * 0.28
          : g.rocketT > 1 - fade
            ? (1 - g.rocketT) / fade * 0.28
            : 0.28
      }

      tick()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      el.removeEventListener('mousemove', onMove)
    }
  }, [])

  const restart = () => {
    const el = containerRef.current
    if (!el) return
    const { width: w, height: h } = el.getBoundingClientRect()
    posRef.current   = { x: w / 2, y: h / 2 }
    mouseRef.current = { x: w / 2, y: h / 2 }
    Object.assign(gRef.current, {
      lives: MAX_LIVES, score: 0, objects: [],
      inv: 0, frame: 0, nextSpawn: 60, cdFrames: 210, over: false, w, h,
    })
  }

  const g       = gRef.current
  const p       = posRef.current
  const m       = mouseRef.current || p
  const flicker = g.inv > 0 && Math.floor(g.inv / 6) % 2 === 0
  const tilt    = Math.max(-14, Math.min(14, (m.x - p.x) * 0.22))
  const cd      = g.cdFrames > 150 ? '3' : g.cdFrames > 90 ? '2' : g.cdFrames > 30 ? '1' : g.cdFrames > 0 ? 'GO!' : null
  const cdKey   = g.cdFrames > 150 ? 3   : g.cdFrames > 90 ? 2   : g.cdFrames > 30 ? 1   : 0

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, cursor: g.over ? 'default' : 'none' }}>

      {/* ── HUD ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '14px 18px', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 6, paddingTop: 1 }}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <div key={i} style={{ color: '#E24B4A', opacity: i < g.lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>
              <HeartIcon width={20} height={20} />
            </div>
          ))}
        </div>
        <p style={{ margin: 0, lineHeight: '20px', fontSize: 12, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.12em', color: 'var(--text-tertiary)' }}>
          {String(g.score).padStart(6, '0')}
        </p>
      </div>

      {/* ── Countdown ── */}
      {cd && !g.over && (
        <div style={{
          position: 'absolute', left: '50%', top: '30%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15, pointerEvents: 'none', textAlign: 'center',
        }}>
          <p key={cdKey} style={{
            margin: 0,
            fontSize: cd === 'GO!' ? 60 : 92,
            fontWeight: 900,
            fontFamily: "'Roboto', sans-serif",
            letterSpacing: '0.05em',
            color: 'var(--text-primary)',
            animation: 'countdownPop 0.32s ease-out forwards',
            userSelect: 'none',
          }}>
            {cd}
          </p>
        </div>
      )}

      {/* ── Rocket (sfondo, sotto tutto) ── */}
      <div style={{
        position: 'absolute', left: g.rocketX, top: g.rocketY,
        transform: `translate(-50%, -50%) rotate(${g.rocketAngle}deg)`,
        color: 'var(--text-primary)', opacity: g.rocketOpacity,
        pointerEvents: 'none',
      }}>
        <RocketIcon width={18} height={18} />
      </div>

      {/* ── Oggetti ── */}
      {g.objects.map(o => {
        const Icon = ICONS[o.type]
        return (
          <div
            key={o.id}
            className={o.type === 'bomb' ? 'bomb-obj' : undefined}
            style={{
              position: 'absolute', left: o.x, top: o.y,
              transform: `translate(-50%, -50%) rotate(${o.rot}deg)`,
              color: COLOR[o.type], pointerEvents: 'none',
            }}
          >
            <Icon width={o.sz ?? SIZE[o.type]} height={o.sz ?? SIZE[o.type]} />
          </div>
        )
      })}

      {/* ── Sensei ── */}
      <div style={{
        position: 'absolute', left: p.x, top: p.y,
        transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
        color: 'var(--text-primary)',
        opacity: flicker ? 0.15 : 1,
        pointerEvents: 'none', zIndex: 5,
      }}>
        <div className="sensei-blink" style={{ animation: 'senseiGlow 7s linear infinite' }}>
          <SenseiLogo width={60} height={60} />
        </div>
      </div>

      {/* ── Game Over ── */}
      {g.over && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', gap: 14,
        }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
            GAME OVER
          </p>
          <p style={{ margin: 0, fontSize: 12, fontFamily: "'Courier New', monospace", letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
            SCORE  {String(g.score).padStart(6, '0')}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={restart} style={btnStyle('#378ADD')}>RIPROVA</button>
            <button onClick={onExit}  style={btnStyle('var(--text-tertiary)')}>ESCI</button>
          </div>
        </div>
      )}

      {/* ── ESC ── */}
      {!g.over && (
        <button
          onClick={onExit}
          style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 10, fontFamily: "'Courier New', monospace", color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.4 }}
        >
          ESC
        </button>
      )}
    </div>
  )
}

const btnStyle = (color) => ({
  padding: '7px 18px', fontSize: 11, fontWeight: 700,
  fontFamily: "'Courier New', monospace", letterSpacing: '0.1em',
  background: 'var(--bg-secondary)', border: `0.5px solid ${color}`,
  borderRadius: 'var(--radius-md)', color, cursor: 'pointer',
})

export default SenseiGame
