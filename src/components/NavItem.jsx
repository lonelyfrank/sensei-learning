import React, { useState, useRef } from 'react'

// Componente NavItem riutilizzabile per la sidebar
// Supporta modalità collapsed (solo icona + tooltip) e modalità espansa (icona + label)
function NavItem({ icon, label, active, onClick, disabled, badge, collapsed }) {
  const [hovered, setHovered] = useState(false)
  const [tooltipY, setTooltipY] = useState(0)
  const ref = useRef(null)

  const handleMouseEnter = () => {
    if (collapsed && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setTooltipY(rect.top + rect.height / 2)
    }
    setHovered(true)
  }

  if (collapsed) {
    // ── Modalità icon-only — icona centrata + tooltip al hover ──
    return (
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div
          ref={ref}
          onClick={disabled ? undefined : onClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            margin: '0 auto 2px',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            background: active ? 'var(--bg-primary)' : hovered ? 'var(--bg-tertiary)' : 'transparent',
            border: active ? '0.5px solid var(--border)' : '0.5px solid transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          {icon}
        </div>

        {/* Tooltip al hover */}
        {hovered && !disabled && (
          <div style={{
            position: 'fixed',
            left: 60,
            top: tooltipY,
            transform: 'translateY(-50%)',
            background: 'var(--bg-primary)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: 12, color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            {label}
            {badge && <span style={{ marginLeft: 6, color: 'var(--text-tertiary)' }}>{badge}</span>}
          </div>
        )}
      </div>
    )
  }

  // ── Modalità espansa — icona + label ──
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px',
        borderRadius: 'var(--radius-md)', marginBottom: 2,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: active ? 'var(--bg-primary)' : 'transparent',
        border: active ? '0.5px solid var(--border)' : '0.5px solid transparent',
        transition: 'background 0.15s',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      {icon}
      <span style={{ fontSize: 13 }}>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: 10,
          color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)',
          padding: '1px 6px', borderRadius: 10,
        }}>{badge}</span>
      )}
    </div>
  )
}

export default NavItem