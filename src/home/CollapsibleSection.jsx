import React from 'react'

/* Sezione collassabile con chevron animato — stato persistito in localStorage */
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 10 : 0 }}>
        <div
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
        >
          {/* Chevron animato */}
          <svg
            width="10" height="10" viewBox="0 0 16 16" fill="none"
            style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
        </div>
        {action && open && action}
      </div>
      {open && children}
    </div>
  )
}

export default CollapsibleSection