import React from 'react'
import { SearchIcon } from './homeIcons.jsx'

/* Barra di ricerca con bottone reset */
function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: 'relative', maxWidth: 220, flex: 1 }}>
      <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
        <SearchIcon />
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Cerca..."
        style={{
          width: '100%', padding: '6px 10px 6px 28px', fontSize: 13,
          color: 'var(--text-primary)', background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
          outline: 'none',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1 }}
        >×</button>
      )}
    </div>
  )
}

export default SearchBar