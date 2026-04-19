import React from 'react'

// Componente NavItem riutilizzabile per la sidebar
function NavItem({ icon, label, active, onClick, disabled, badge }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
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
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
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