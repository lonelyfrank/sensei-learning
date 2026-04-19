import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import UserSection from '../settings/UserSection.jsx'
import ThemesSection from '../settings/ThemesSection.jsx'

const SECTIONS = [
  { id: 'user',   label: 'Profilo' },
  { id: 'themes', label: 'Aspetto' },
]

function Settings({ onBack, onSave }) {
  const [section, setSection] = useState('user')
  const { theme, applyTheme } = useTheme()

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── SIDEBAR SINISTRA ── */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: '0.5px solid var(--border)',
        padding: '28px 12px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
            marginBottom: 20, width: 'fit-content',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Indietro
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4 }}>
          Impostazioni
        </p>

        {SECTIONS.map(s => (
          <div
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: section === s.id ? 'var(--bg-tertiary)' : 'transparent',
              color: section === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: section === s.id ? 500 : 400,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (section !== s.id) e.currentTarget.style.background = 'var(--bg-secondary)' }}
            onMouseLeave={e => { if (section !== s.id) e.currentTarget.style.background = 'transparent' }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* ── CONTENUTO DESTRA ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '28px 32px', display: 'flex', flexDirection: 'column' }}>
        {section === 'user' && <UserSection onSave={onSave} />}
        {section === 'themes' && <ThemesSection currentTheme={theme} onApplyTheme={applyTheme} />}
      </div>

    </div>
  )
}

export default Settings