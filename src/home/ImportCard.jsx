import React, { useState } from 'react'

/* Card per importare un nuovo artifact — griglia o lista */
function ImportCard({ view, onClick, label = 'Importa' }) {
  const [hovered, setHovered] = useState(false)

  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          border: '0.5px dashed var(--border)', cursor: 'pointer',
          opacity: hovered ? 0.8 : 0.5, transition: 'opacity 0.15s',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>+ {label}</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: '0.5px dashed var(--border)', borderRadius: 'var(--radius-lg)',
        padding: 16, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, minHeight: 110,
        opacity: hovered ? 0.8 : 0.5, transition: 'opacity 0.15s',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

export default ImportCard