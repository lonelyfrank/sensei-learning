import React, { useState, useEffect, useRef } from 'react'

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

export default UserSection