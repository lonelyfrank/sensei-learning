import React from 'react'
import { evaluateBadges } from './badges.js'

function BadgesSection({ stats }) {
  const badges = evaluateBadges(stats)
  const unlocked = badges.filter(b => b.unlocked)
  const locked = badges.filter(b => !b.unlocked)

  return (
    <div style={{ marginBottom: 32 }}>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Achievement
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        {unlocked.map(badge => (
          <BadgeCard key={badge.id} badge={badge} unlocked />
        ))}
        {locked.map(badge => (
          <BadgeCard key={badge.id} badge={badge} unlocked={false} />
        ))}
      </div>

      {unlocked.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
          Completa il tuo primo step per sbloccare i badge.
        </p>
      )}
    </div>
  )
}

function BadgeCard({ badge, unlocked }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        flexShrink: 0,
        zIndex: hovered ? 100 : 1,
        width: 64, height: 72,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
      }}
    >
      {/* Card visuale — opacity e filter solo qui, non sul wrapper */}
      <div style={{
        width: 64, height: 64,
        borderRadius: 14,
        background: unlocked ? badge.color + '18' : 'var(--bg-secondary)',
        border: `1.5px solid ${unlocked ? badge.color + '44' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default',
        filter: unlocked ? 'none' : 'grayscale(1)',
        opacity: unlocked ? 1 : 0.35,
        transition: 'all 0.15s',
      }}>
        <span style={{ fontSize: 26 }}>{badge.icon}</span>
      </div>

      {/* Nome italiano sotto la card — sempre leggibile */}
      <span style={{
        fontSize: 9, fontWeight: 600, textAlign: 'center',
        color: unlocked ? badge.color : 'var(--text-tertiary)',
        opacity: unlocked ? 1 : 0.5,
        lineHeight: 1.2,
        maxWidth: 64,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {badge.name}
      </span>

      {/* Tooltip — fuori dal div con opacity */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          background: 'var(--bg-primary)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          width: 180,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 200,
          pointerEvents: 'none',
          whiteSpace: 'normal',
          opacity: 1,
          filter: 'none',
        }}>
          {/* Nome italiano */}
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: unlocked ? badge.color : 'var(--text-secondary)' }}>
            {badge.name}
          </p>
          {/* Kanji solo nel tooltip */}
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--text-tertiary)' }}>
            {badge.kanji}
          </p>
          {/* Descrizione */}
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
            {badge.description}
          </p>
          {!unlocked && (
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              🔒 Non ancora sbloccato
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default BadgesSection