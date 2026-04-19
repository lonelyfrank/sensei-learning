import React, { useState, useMemo } from 'react'
import { ICONS, ICON_NAMES } from './icons.jsx'

const COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#E24B4A', '#0F6E56',
  '#534AB7', '#993C1D', '#3B6D11', '#185FA5',
]

function IconPicker({ selectedIcon, selectedColor, onSelectIcon, onSelectColor }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return ICON_NAMES
    return ICON_NAMES.filter(name => name.toLowerCase().includes(query))
  }, [search])

  const SelectedIcon = selectedIcon ? ICONS[selectedIcon] : null

  return (
    <div>
      {/* Preview icona e colore selezionati */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: selectedColor + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${selectedColor}44`,
          flexShrink: 0,
        }}>
          {SelectedIcon && <SelectedIcon size={24} color={selectedColor} />}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {selectedIcon || 'Nessuna icona'}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Cerca e seleziona un'icona
          </p>
        </div>
      </div>

      {/* Campo ricerca */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cerca... (es. code, book, rocket)"
        style={{
          width: '100%', padding: '7px 12px', fontSize: 13,
          color: 'var(--text-primary)', background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
          outline: 'none', marginBottom: 10,
        }}
      />

      {/* Griglia icone */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 4, maxHeight: 180, overflowY: 'auto',
        marginBottom: 14, padding: 2,
      }}>
        {filtered.map(name => {
          const Icon = ICONS[name]
          const isSelected = name === selectedIcon
          return (
            <button
              key={name}
              onClick={() => onSelectIcon(name)}
              title={name}
              style={{
                width: '100%', aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? `1.5px solid ${selectedColor}` : '1px solid transparent',
                background: isSelected ? selectedColor + '22' : 'transparent',
                cursor: 'pointer',
                color: isSelected ? selectedColor : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={16} />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '12px 0', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Nessuna icona trovata
          </div>
        )}
      </div>

      {/* Palette colori */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => onSelectColor(color)}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: color,
              border: selectedColor === color ? '2.5px solid var(--text-primary)' : '2px solid transparent',
              cursor: 'pointer', outline: 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default IconPicker