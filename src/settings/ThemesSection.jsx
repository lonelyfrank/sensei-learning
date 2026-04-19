import React from 'react'
import { THEMES_SYSTEM, THEMES_CUSTOM } from '../context/ThemeContext.jsx'
import ThemeCard from './ThemeCard.jsx'

function ThemesSection({ currentTheme, onApplyTheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, flexShrink: 0 }}>Aspetto</h2>

      {/* Area scrollabile — solo questa sezione scrolla */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>

        {/* ── SISTEMA ── */}
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Sistema
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: 10, marginBottom: 28 }}>
          {THEMES_SYSTEM.map(t => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={currentTheme === t.id}
              onApply={() => onApplyTheme(t.id)}
            />
          ))}
        </div>

        {/* ── PERSONALIZZATI ── */}
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Personalizzati
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: 10, paddingBottom: 16 }}>
          {THEMES_CUSTOM.map(t => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={currentTheme === t.id}
              onApply={() => onApplyTheme(t.id)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

export default ThemesSection