import React, { useState, useRef } from 'react'

// collapsed    → valore ritardato (contentCollapsed da Sidebar) — governa la visibilità del label
// labelNow     → valore immediato (collapsed da Sidebar) — il label sparisce subito all'avvio della chiusura
function NavItem({ icon, label, active, onClick, disabled, badge, collapsed, labelNow }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)
  const [tooltipY, setTooltipY] = useState(0)

  const hideLabel = collapsed || labelNow

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 2 }}>
      <div
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => {
          if (collapsed && ref.current) setTooltipY(ref.current.getBoundingClientRect().top + ref.current.getBoundingClientRect().height / 2)
          setHovered(true)
        }}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          background: active ? 'var(--bg-primary)' : hovered ? 'var(--bg-tertiary)' : 'transparent',
          border: active ? '0.5px solid var(--border)' : '0.5px solid transparent',
          transition: 'background 0.15s',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>

        <span style={{
          fontSize: 13,
          opacity: hideLabel ? 0 : 1,
          maxWidth: hideLabel ? 0 : 160,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          display: 'block',
          // opacity veloce (segue subito il gesto), maxWidth più lento (segue la CSS width della sidebar)
          transition: 'opacity 0.1s ease, max-width 0.22s ease',
        }}>
          {label}
        </span>

        {badge && !hideLabel && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, flexShrink: 0,
            color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)',
            padding: '1px 6px', borderRadius: 10,
          }}>{badge}</span>
        )}
      </div>

      {/* Tooltip — solo in modalità collapsed */}
      {collapsed && hovered && !disabled && (
        <div style={{
          position: 'fixed', left: 60, top: tooltipY, transform: 'translateY(-50%)',
          background: 'var(--bg-primary)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '4px 10px',
          fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 1000,
        }}>
          {label}
          {badge && <span style={{ marginLeft: 6, color: 'var(--text-tertiary)' }}>{badge}</span>}
        </div>
      )}
    </div>
  )
}

export default NavItem
