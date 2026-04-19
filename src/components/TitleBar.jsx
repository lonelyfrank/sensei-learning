import React, { useState, useEffect } from 'react'

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.sensei.windowIsMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize = () => window.sensei.windowMinimize()
  const handleMaximize = async () => {
    await window.sensei.windowMaximize()
    const maximized = await window.sensei.windowIsMaximized()
    setIsMaximized(maximized)
  }
  const handleClose = () => window.sensei.windowClose()

  return (
    <div
      style={{
        WebkitAppRegion: 'drag',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Controlli finestra — no drag su questi bottoni */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, WebkitAppRegion: 'no-drag' }}>

        {/* Minimizza */}
        <WindowButton onClick={handleMinimize} title="Minimizza">
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
            <path d="M0 1h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </WindowButton>

        {/* Massimizza / Ripristina */}
        <WindowButton onClick={handleMaximize} title={isMaximized ? 'Ripristina' : 'Massimizza'}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="0" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M0 2v6a2 2 0 002 2h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.6" y="0.6" width="8.8" height="8.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          )}
        </WindowButton>

        {/* Chiudi */}
        <WindowButton onClick={handleClose} title="Chiudi" danger>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </WindowButton>

      </div>
    </div>
  )
}

function WindowButton({ onClick, title, danger, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered
          ? danger ? '#E24B4A' : 'var(--text-primary)'
          : 'var(--text-tertiary)',
        background: hovered ? 'var(--bg-tertiary)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export default TitleBar