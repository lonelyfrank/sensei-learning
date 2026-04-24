import React, { useEffect, useState } from 'react'

/* Sistema toast globale — notifiche temporanee in basso a destra */
function Toast({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Entra con animazione
    requestAnimationFrame(() => setVisible(true))
    // Esce dopo duration
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: 'var(--bg-primary)',
      border: `0.5px solid ${toast.color || 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      pointerEvents: 'auto',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      maxWidth: 320,
    }}>
      {toast.icon && (
        <span style={{ fontSize: 20, flexShrink: 0 }}>{toast.icon}</span>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      {toast.color && (
        <div style={{ width: 3, height: '100%', background: toast.color, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch' }} />
      )}
    </div>
  )
}

export default Toast