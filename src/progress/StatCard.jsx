import React from 'react'

/* Card statistica singola — label + valore colorato */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '0.5px solid var(--border)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  )
}

export default StatCard