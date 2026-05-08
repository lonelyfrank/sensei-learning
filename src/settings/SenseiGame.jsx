import React, { useRef, useEffect, useReducer } from 'react'
import SenseiLogo   from '../assets/sensei-logo.svg?react'
import AsteroidIcon from '../assets/game/asteroid.svg?react'
import BombIcon     from '../assets/game/bomb.svg?react'
import CpuIcon      from '../assets/game/cpu.svg?react'
import BatteryIcon  from '../assets/game/battery.svg?react'
import HeartIcon    from '../assets/game/heart.svg?react'

// ─── Costanti ────────────────────────────────────────────────────────────────

const LERP       = 0.09   // inerzia del logo sul mouse (0=nessuna, 1=istantaneo)
const SENSEI_R   = 26     // raggio hitbox Sensei (px)
const MAX_LIVES  = 3
const INV_FRAMES = 90     // frame di invincibilità dopo un colpo (~1.5s a 60fps)
const BASE_SPAWN = 85     // frame tra uno spawn e il successivo (si riduce col punteggio)

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

  return {
    id: oid++, type, x, y,
    vx: (dx / d) * spd, vy: (dy / d) * spd,
    rot: Math.random() * 360,
    rotSpd: (Math.random() - 0.5) * 5,
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────

function SenseiGame({ onExit }) {
  const containerRef = useRef(null)
  const mouseRef     = useRef(null)            // posizione cursore nel pannello
  const posRef       = useRef({ x: 0, y: 0 }) // posizione attuale di Sensei (lerp)
  const gRef         = useRef({
    lives: MAX_LIVES, score: 0, objects: [],
    inv: 0, frame: 0, nextSpawn: 60,
    over: false, w: 0, h: 0,
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

        // Sensei segue il mouse con inerzia
        p.x += (m.x - p.x) * LERP
        p.y += (m.y - p.y) * LERP
        p.x = Math.max(36, Math.min(g.w - 36, p.x))
        p.y = Math.max(36, Math.min(g.h - 36, p.y))

        if (g.inv > 0) g.inv--

        // Aggiorna posizione e rotazione di ogni oggetto
        for (const o of g.objects) { o.x += o.vx; o.y += o.vy; o.rot += o.rotSpd }

        // Rimuove gli oggetti usciti dal pannello
        const pad = 120
        g.objects = g.objects.filter(o =>
          o.x > -pad && o.x < g.w + pad && o.y > -pad && o.y < g.h + pad
        )

        // Collisioni (distanza tra centri < somma dei raggi)
        const hit = new Set()
        for (const o of g.objects) {
          const r  = RADIUS[o.type] || 20
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

        // Spawn — frequenza aumenta con il punteggio
        if (--g.nextSpawn <= 0) {
          g.objects.push(makeObject(g.w, g.h, g.lives, g.score))
          g.nextSpawn = Math.max(22, BASE_SPAWN - Math.floor(g.score / 40))
        }
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
      inv: 0, frame: 0, nextSpawn: 60, over: false, w, h,
    })
  }

  const g       = gRef.current
  const p       = posRef.current
  // Sensei lampeggia durante l'invincibilità
  const flicker = g.inv > 0 && Math.floor(g.inv / 6) % 2 === 0

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>

      {/* ── HUD ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 18px', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <div key={i} style={{ color: '#E24B4A', opacity: i < g.lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>
              <HeartIcon width={20} height={20} />
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.12em', color: 'var(--text-tertiary)' }}>
          {String(g.score).padStart(6, '0')}
        </p>
      </div>

      {/* ── Oggetti ── */}
      {g.objects.map(o => {
        const Icon = ICONS[o.type]
        return (
          <div
            key={o.id}
            style={{
              position: 'absolute', left: o.x, top: o.y,
              transform: `translate(-50%, -50%) rotate(${o.rot}deg)`,
              color: COLOR[o.type], pointerEvents: 'none',
            }}
          >
            <Icon width={SIZE[o.type]} height={SIZE[o.type]} />
          </div>
        )
      })}

      {/* ── Sensei ── */}
      <div style={{
        position: 'absolute', left: p.x, top: p.y,
        transform: 'translate(-50%, -50%)',
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
