import React from 'react'
import { getLevel, getNextLevel, getLevelProgress } from './xpSystem.jsx'

function LevelCard({ xp }) {
  const level = getLevel(xp)
  const nextLevel = getNextLevel(xp)
  const levelProgress = getLevelProgress(xp)

  return (
    <div style={{
      padding: '20px 24px',
      background: 'var(--bg-secondary)',
      border: `1px solid ${level.color}33`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: 28,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow sfondo */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: level.color, opacity: 0.06,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>

        {/* Icona + Nome — Kanji */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: level.color + '18',
            border: `1.5px solid ${level.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {level.kanji}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Livello attuale
            </p>
            {/* Nome italiano — Kanji */}
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: level.color }}>
              {level.name} <span style={{ fontSize: 14, opacity: 0.7 }}>— {level.kanji}</span>
            </p>
          </div>
        </div>

        {/* XP */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            XP totali
          </p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: level.color }}>
            {xp}
          </p>
        </div>
      </div>

      {/* Barra progresso */}
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
  )
}

export default LevelCard