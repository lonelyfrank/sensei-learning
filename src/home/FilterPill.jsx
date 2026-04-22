import React from 'react'

/* Pill filtro cliccabile */
function FilterPill({ label, active, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
        border: active ? '0.5px solid #378ADD' : '0.5px solid var(--border)',
        color: active ? '#378ADD' : 'var(--text-tertiary)',
        background: active ? '#378ADD11' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </span>
  )
}

export default FilterPill