import React, { useState, useEffect, useRef } from 'react'

function Settings({ onBack, onSave }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  // Carica il profilo utente al mount
  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const user = await window.sensei.getUser()
    if (user) {
      setName(user.name)
      setAvatar(user.avatar)
    }
  }

  const handleSave = async () => {
    await window.sensei.updateUser(name, avatar)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Aggiorna il profilo nell'app senza riavvio
    if (onSave) onSave()
  }

  // Converte l'immagine selezionata in base64
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  // Genera le iniziali dal nome
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 480 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
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
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>Impostazioni</h1>
      </div>

      {/* Sezione profilo */}
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Profilo
        </span>

        <div style={{
          marginTop: 12,
          padding: 20,
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: avatar ? 'transparent' : '#EEEDFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 500, color: '#534AB7',
                cursor: 'pointer',
                overflow: 'hidden',
                border: '0.5px solid var(--border)',
                flexShrink: 0,
              }}
            >
              {avatar
                ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
                Foto profilo
              </p>
              <button
                onClick={() => fileRef.current.click()}
                style={{
                  fontSize: 12, color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 10px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cambia immagine
              </button>
              {avatar && (
                <button
                  onClick={() => setAvatar(null)}
                  style={{
                    fontSize: 12, color: '#E24B4A',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px 10px',
                    marginLeft: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Rimuovi
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Nome visualizzato
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Il tuo nome"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
          </div>

        </div>
      </div>

      {/* Bottone salva */}
      <button
        onClick={handleSave}
        style={{
          padding: '9px 20px',
          fontSize: 13,
          fontWeight: 500,
          color: saved ? '#1D9E75' : 'var(--text-primary)',
          background: 'var(--bg-secondary)',
          border: `0.5px solid ${saved ? '#1D9E75' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s',
        }}
      >
        {saved ? '✓ Salvato' : 'Salva modifiche'}
      </button>

    </div>
  )
}

export default Settings