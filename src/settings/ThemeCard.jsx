import React, { useState } from 'react'

/* Card tema — preview a tutta altezza, badge nome in overlay in basso a sinistra */
function ThemeCard({ theme: t, isActive, onApply }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onApply}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: `1.5px solid ${isActive ? '#378ADD' : hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.2s',
        overflow: 'hidden', position: 'relative',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
      }}
    >
      {/* ── PREVIEW OCCUPA TUTTA LA CARD ── */}
      <div style={{ height: 100, display: 'flex', background: t.preview[0] }}>

        {/* Sidebar simulata */}
        <div style={{
          width: 36, height: '100%',
          background: t.preview[1],
          borderRight: `1px solid ${t.preview[2]}11`,
          padding: '8px 6px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#378ADD55' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            {[0.9, 0.4, 0.35, 0.25].map((op, i) => (
              <div key={i} style={{ height: 3, borderRadius: 2, background: t.preview[2], opacity: op }} />
            ))}
          </div>
        </div>

        {/* Contenuto simulato */}
        <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ height: 5, width: '38%', borderRadius: 2, background: t.preview[2], opacity: 0.85 }} />
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                flex: 1, borderRadius: 5,
                background: t.preview[1],
                border: `1px solid ${t.preview[2]}15`,
                padding: '6px 7px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ width: 11, height: 11, borderRadius: 3, background: '#378ADD50' }} />
                <div style={{ height: 3, width: '72%', borderRadius: 1, background: t.preview[2], opacity: 0.65 }} />
                <div style={{ height: 2, width: '48%', borderRadius: 1, background: t.preview[2], opacity: 0.3 }} />
                <div style={{ height: 2, borderRadius: 1, background: `${t.preview[2]}20`, marginTop: 2 }}>
                  <div style={{ width: '35%', height: '100%', borderRadius: 1, background: '#378ADD' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BADGE NOME — overlay in basso a sinistra ── */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        borderRadius: 6, padding: '3px 9px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#fff' }}>
          {t.label}
        </span>
        {isActive && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  )
}

export default ThemeCard