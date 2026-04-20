import React from 'react'
import { getLevel, getNextLevel, getLevelProgress } from './xpSystem.jsx'

/* Card livello utente — mostra XP, livello attuale e progresso verso il prossimo */
function LevelCard({ xp }) {
  const level = getLevel(xp)
  const nextLevel = getNextLevel(xp)
  const levelProgress = getLevelProgress(xp)

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${level.color}33`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: 28,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'stretch',
    }}>

      {/* ── ICONA SINISTRA — altezza completa ── */}
      <div style={{
        width: 110, flexShrink: 0,
        background: 'var(--bg-icon)',
        borderRight: `1px solid ${level.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 14,
      }}>
        <level.Icon
          width={100}
          height={100}
          style={{ color: 'var(--icon-color)' }}
        />
      </div>

      {/* ── CONTENUTO DESTRA ── */}
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>

        {/* Riga superiore — livello + XP */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Livello attuale
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: level.color }}>
              {level.name} <span style={{ fontSize: 14, opacity: 0.7 }}>— {level.kanji}</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              XP totali
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: level.color }}>
              {xp}
            </p>
          </div>
        </div>

        {/* Barra progresso verso prossimo livello */}
        {nextLevel ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Prossimo: <span style={{ color: nextLevel.color }}>{nextLevel.name} — {nextLevel.kanji}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{levelProgress}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
              <div style={{
                width: `${levelProgress}%`, height: '100%', borderRadius: 3,
                background: `linear-gradient(90deg, ${level.color}, ${nextLevel.color})`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 11, color: level.color }}>Livello massimo raggiunto ✦</span>
            <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, marginTop: 6 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 3, background: level.color }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LevelCard