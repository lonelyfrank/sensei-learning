// ─── CreateHub.jsx ───────────────────────────────────────────────────────────
// Landing page della sezione Crea — mostra le modalità disponibili e future

import React from 'react'

// Modalità di creazione attualmente disponibili
const MODES_AVAILABLE = [
  {
    id: 'sentiero-ai',
    icon: '🗺️',
    title: 'Sentiero con AI',
    description: 'Genera un prompt ottimizzato per Claude e crea un percorso progressivo da seguire nel tempo.',
    color: '#378ADD',
  },
  {
    id: 'leaflet-ai',
    icon: '📄',
    title: 'Leaflet con AI',
    description: 'Genera un prompt per creare una guida, ricetta o scheda tecnica da consultare in qualsiasi momento.',
    color: '#1D9E75',
  },
]

// Modalità in arrivo — mostrate disabilitate per anticipare le feature future
const MODES_SOON = [
  {
    id: 'template',
    icon: '⊞',
    title: 'Da template',
    description: 'Parti da un template predefinito e personalizzalo a tuo piacimento.',
    color: '#7F77DD',
  },
  {
    id: 'editor',
    icon: '✎',
    title: 'Editor visuale',
    description: 'Crea il tuo artifact direttamente nell\'app con un editor drag & drop.',
    color: '#D85A30',
  },
]

function CreateHub({ onBack, onSelectMode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Indietro
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Crea</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Scegli come vuoi creare il tuo artifact
          </p>
        </div>
      </div>

      {/* ── MODALITÀ DISPONIBILI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 32 }}>
        {MODES_AVAILABLE.map(mode => (
          <ModeCard
            key={mode.id}
            mode={mode}
            onClick={() => onSelectMode(mode.id)}
          />
        ))}
      </div>

      {/* ── DIVISORE PROSSIMAMENTE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Prossimamente
        </span>
        <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
      </div>

      {/* ── MODALITÀ FUTURE — disabilitate ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {MODES_SOON.map(mode => (
          <ModeCard key={mode.id} mode={mode} soon />
        ))}
      </div>

    </div>
  )
}

// Card singola modalità — cliccabile o disabilitata (soon)
function ModeCard({ mode, onClick, soon }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onClick={soon ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px',
        background: hovered && !soon ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        border: `0.5px solid ${hovered && !soon ? mode.color + '44' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: soon ? 'default' : 'pointer',
        opacity: soon ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {/* Icona modalità */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: mode.color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: mode.color,
        marginBottom: 14,
        border: `0.5px solid ${mode.color}33`,
      }}>
        {mode.icon}
      </div>

      {/* Titolo e descrizione */}
      <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
        {mode.title}
      </h3>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {mode.description}
      </p>
    </div>
  )
}

export default CreateHub