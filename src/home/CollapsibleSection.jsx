import React from 'react'

export function getSectionState(key, defaultVal = true) {
  try { return JSON.parse(localStorage.getItem(`sensei-section-${key}`) ?? String(defaultVal)) }
  catch { return defaultVal }
}

export function setSectionState(key, val) {
  localStorage.setItem(`sensei-section-${key}`, JSON.stringify(val))
}

function CollapsibleSection({ title, open, onToggle, action, children }) {
  return (
    <div style={{ marginBottom: 32 }}>

      {/* Header con chevron + titolo + filtri */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: open ? 10 : 0,
        transition: 'margin-bottom 0.25s ease',
      }}>
        <div
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
        >
          <svg
            width="10" height="10" viewBox="0 0 16 16" fill="none"
            style={{ color: 'var(--text-tertiary)', transition: 'transform 0.22s ease', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
        </div>

        {/* Filtri — sfumano insieme all'apertura */}
        <div style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}>
          {action}
        </div>
      </div>

      {/* Grid trick: 0fr → 1fr per uno slide vero senza maxHeight fisso */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        opacity: open ? 1 : 0,
        transition: 'grid-template-rows 0.25s ease, opacity 0.2s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>

    </div>
  )
}

export default CollapsibleSection
