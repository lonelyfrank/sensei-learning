import React, { useState, useEffect } from 'react'

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function AnthropicSection() {
  const [key,     setKey]     = useState('')
  const [showKey, setShowKey] = useState(false)
  const [hasKey,  setHasKey]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    window.sensei.anthropic.hasKey().then(setHasKey)
  }, [])

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    setError(null)
    const result = await window.sensei.anthropic.saveKey(key.trim())
    setSaving(false)
    if (result.success) {
      setHasKey(true)
      setSaved(true)
      setKey('')
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError(result.error)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
        Anthropic API Key
      </h2>

      <div style={{
        padding: 20,
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}>

        {/* Stato */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 20, paddingBottom: 20,
          borderBottom: '0.5px solid var(--border)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: hasKey ? '#1D9E75' : 'var(--text-tertiary)',
          }} />
          <span style={{ fontSize: 13, color: hasKey ? '#1D9E75' : 'var(--text-tertiary)' }}>
            {hasKey ? 'Configurata' : 'Non configurata'}
          </span>
        </div>

        {/* Input key */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          {hasKey ? 'Sostituisci API Key' : 'API Key'}
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: error ? 8 : 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder="sk-ant-api03-..."
              style={{
                width: '100%', padding: '8px 36px 8px 12px', fontSize: 13,
                color: 'var(--text-primary)', background: 'var(--bg-primary)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none', fontFamily: 'monospace', letterSpacing: '0.02em',
              }}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              {showKey ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!key.trim() || saving}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 500,
              color: saved ? '#1D9E75' : 'var(--text-primary)',
              background: 'var(--bg-tertiary)',
              border: `0.5px solid ${saved ? '#1D9E75' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              opacity: !key.trim() || saving ? 0.5 : 1,
              cursor: !key.trim() || saving ? 'default' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {saved ? '✓ Salvata' : saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#E24B4A', marginBottom: 12 }}>{error}</p>
        )}

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
          La key viene cifrata con le API di sicurezza del sistema operativo e non lascia mai il dispositivo.
          {' '}
          <span
            onClick={() => window.sensei.openExternal('https://console.anthropic.com/settings/keys')}
            style={{ color: '#378ADD', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Ottieni la tua key su console.anthropic.com →
          </span>
        </p>
      </div>

      {hasKey && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6,
        }}>
          Con la key configurata puoi generare sentieri e leaflet direttamente da <strong style={{ color: 'var(--text-secondary)' }}>Crea → Crea con AI</strong> senza aprire Claude.
        </div>
      )}
    </div>
  )
}

export default AnthropicSection
