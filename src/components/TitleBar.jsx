// ─── TitleBar.jsx ────────────────────────────────────────────────────────────
// Barra del titolo personalizzata (frame: false in Electron).
// Layout: logo a sinistra, titolo centrato, controlli stile GNOME a destra.

import React, { useState, useEffect } from 'react'
import SenseiLogo from '../assets/sensei-logo.svg?react'

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.sensei.windowIsMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize = () => window.sensei.windowMinimize()
  const handleMaximize = async () => {
    await window.sensei.windowMaximize()
    setIsMaximized(await window.sensei.windowIsMaximized())
  }
  const handleClose = () => window.sensei.windowClose()

  return (
    <div style={{
      WebkitAppRegion: 'drag',
      height: 40,
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px 0 14px',
      background: 'var(--bg-secondary)',
      borderBottom: '0.5px solid var(--border)',
      flexShrink: 0,
      userSelect: 'none',
    }}>

      {/* Spacer sinistro — bilancia i controlli per centrare logo+nome */}
      <div style={{ width: 82, flexShrink: 0 }} />

      {/* Logo + nome centrati insieme, stile Discord */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 7, pointerEvents: 'none',
      }}>
        <SenseiLogo style={{ width: 22, height: 22, color: 'var(--logo-color)', flexShrink: 0 }} />
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          letterSpacing: '-0.2px',
        }}>
          Sensei
        </span>
      </div>

      {/* Controlli stile GNOME — cerchi neutri, close in rosso all'hover */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, WebkitAppRegion: 'no-drag' }}>
        <GnomeButton onClick={handleMinimize} title="Minimizza">
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
            <path d="M1 1h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </GnomeButton>

        <GnomeButton onClick={handleMaximize} title={isMaximized ? 'Ripristina' : 'Massimizza'}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M0.5 2.5v5a2 2 0 002 2h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.7" y="0.7" width="8.6" height="8.6" rx="1.6" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          )}
        </GnomeButton>

        <GnomeButton onClick={handleClose} title="Chiudi" isClose>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </GnomeButton>
      </div>

    </div>
  )
}

// Bottone circolare stile GNOME Adwaita:
// sfondo neutro all'hover, close diventa rosso per segnalare azione distruttiva.
function GnomeButton({ onClick, title, isClose, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 26, height: 26,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered
          ? isClose ? 'rgba(226,75,74,0.18)' : 'var(--bg-tertiary)'
          : 'transparent',
        color: hovered
          ? isClose ? '#E24B4A' : 'var(--text-primary)'
          : 'var(--text-tertiary)',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  )
}

export default TitleBar
