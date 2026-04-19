import React, { useState, useEffect, useRef } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext.jsx'

const SECTIONS = [
  { id: 'user',   label: 'Profilo' },
  { id: 'themes', label: 'Aspetto' },
]

function Settings({ onBack, onSave }) {
  const [section, setSection] = useState('user')
  const { theme, applyTheme } = useTheme()

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── SIDEBAR SINISTRA ── */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: '0.5px solid var(--border)',
        padding: '28px 12px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
            marginBottom: 20, width: 'fit-content',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Indietro
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4 }}>
          Impostazioni
        </p>

        {SECTIONS.map(s => (
          <div
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: section === s.id ? 'var(--bg-tertiary)' : 'transparent',
              color: section === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: section === s.id ? 500 : 400,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (section !== s.id) e.currentTarget.style.background = 'var(--bg-secondary)' }}
            onMouseLeave={e => { if (section !== s.id) e.currentTarget.style.background = 'transparent' }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* ── CONTENUTO DESTRA ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 560 }}>
        {section === 'user' && <UserSection onSave={onSave} />}
        {section === 'themes' && <ThemesSection currentTheme={theme} onApplyTheme={applyTheme} />}
      </div>

    </div>
  )
}

/* Sezione modifica profilo utente */
function UserSection({ onSave }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    window.sensei.getUser().then(user => {
      if (user) { setName(user.name); setAvatar(user.avatar) }
    })
  }, [])

  const handleSave = async () => {
    await window.sensei.updateUser(name, avatar)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (onSave) onSave()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Profilo</h2>

      <div style={{ padding: 20, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '0.5px solid var(--border)' }}>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: avatar ? 'transparent' : '#EEEDFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 500, color: '#534AB7',
              cursor: 'pointer', overflow: 'hidden',
              border: '0.5px solid var(--border)', flexShrink: 0,
            }}
          >
            {avatar ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>Foto profilo</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => fileRef.current.click()}
                style={{ fontSize: 12, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 10px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cambia
              </button>
              {avatar && (
                <button
                  onClick={() => setAvatar(null)}
                  style={{ fontSize: 12, color: '#E24B4A', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 10px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        {/* Nome */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome visualizzato</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Il tuo nome"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 13,
            color: 'var(--text-primary)', background: 'var(--bg-primary)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none',
          }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          padding: '9px 20px', fontSize: 13, fontWeight: 500,
          color: saved ? '#1D9E75' : 'var(--text-primary)',
          background: 'var(--bg-secondary)',
          border: `0.5px solid ${saved ? '#1D9E75' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
        }}
      >
        {saved ? '✓ Salvato' : 'Salva modifiche'}
      </button>
    </div>
  )
}

/* Sezione selezione tema */
function ThemesSection({ currentTheme, onApplyTheme }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Aspetto</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {THEMES.map(t => (
          <ThemeCard
            key={t.id}
            theme={t}
            isActive={currentTheme === t.id}
            onApply={() => onApplyTheme(t.id)}
          />
        ))}
      </div>
    </div>
  )
}

/* Card tema — preview a tutta altezza, badge nome in overlay in basso a sinistra */
function ThemeCard({ theme: t, isActive, onApply }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onApply}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: `1.5px solid ${isActive ? '#378ADD' : hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.2s',
        overflow: 'hidden', position: 'relative',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
      }}
    >
      {/* ── PREVIEW OCCUPA TUTTA LA CARD ── */}
      <div style={{ height: 130, display: 'flex', background: t.preview[0] }}>

        {/* Sidebar simulata */}
        <div style={{
          width: 36, height: '100%',
          background: t.preview[1],
          borderRight: `1px solid ${t.preview[2]}11`,
          padding: '8px 6px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {/* Logo */}
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#378ADD55' }} />
          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            {[0.9, 0.4, 0.35, 0.25].map((op, i) => (
              <div key={i} style={{ height: 3, borderRadius: 2, background: t.preview[2], opacity: op }} />
            ))}
          </div>
        </div>

        {/* Contenuto simulato */}
        <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Titolo pagina */}
          <div style={{ height: 5, width: '38%', borderRadius: 2, background: t.preview[2], opacity: 0.85 }} />
          {/* Card sentieri */}
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                flex: 1, borderRadius: 5,
                background: t.preview[1],
                border: `1px solid ${t.preview[2]}15`,
                padding: '6px 7px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {/* Icona sentiero */}
                <div style={{ width: 11, height: 11, borderRadius: 3, background: '#378ADD50' }} />
                {/* Nome sentiero */}
                <div style={{ height: 3, width: '72%', borderRadius: 1, background: t.preview[2], opacity: 0.65 }} />
                {/* Giorni */}
                <div style={{ height: 2, width: '48%', borderRadius: 1, background: t.preview[2], opacity: 0.3 }} />
                {/* Barra progresso */}
                <div style={{ height: 2, borderRadius: 1, background: `${t.preview[2]}20`, marginTop: 2 }}>
                  <div style={{ width: '35%', height: '100%', borderRadius: 1, background: '#378ADD' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BADGE NOME — overlay in basso a sinistra ── */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        borderRadius: 6, padding: '3px 9px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#fff' }}>
          {t.label}
        </span>
        {/* Segno di spunta se tema attivo */}
        {isActive && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  )
}

export default Settings