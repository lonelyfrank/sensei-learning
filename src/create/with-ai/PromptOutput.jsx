import React, { useState } from 'react'
import { PROMPT_BASE } from './promptBase.js'

/* Step 2 — mostra il prompt generato, permette di modificarlo e copiarlo */
function PromptOutput({ userSection, setUserSection, onBack }) {
  const [copied, setCopied] = useState(false)

  const fullPrompt = `${PROMPT_BASE}\n\n${userSection}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>

      {/* Specifiche tecniche Sensei — read only */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Specifiche tecniche Sensei
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
              — non modificare
            </span>
          </div>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
            read only
          </span>
        </div>
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--text-tertiary)',
          fontFamily: 'monospace', lineHeight: 1.7,
          maxHeight: 180, overflowY: 'auto',
          whiteSpace: 'pre-wrap', opacity: 0.7,
        }}>
          {PROMPT_BASE}
        </div>
      </div>

      {/* Sezione personale — editabile dall'utente */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Il tuo sentiero
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
            — puoi modificare
          </span>
        </div>
        <textarea
          value={userSection}
          onChange={e => setUserSection(e.target.value)}
          rows={8}
          style={{
            width: '100%', padding: '12px 14px', fontSize: 12,
            color: 'var(--text-primary)', background: 'var(--bg-secondary)',
            border: '0.5px solid #378ADD44', borderRadius: 'var(--radius-md)',
            outline: 'none', resize: 'vertical',
            fontFamily: 'monospace', lineHeight: 1.7,
          }}
        />
      </div>

      {/* Bottoni azione */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 18px', fontSize: 13,
            color: 'var(--text-secondary)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ← Modifica
        </button>

        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: '10px 18px', fontSize: 13, fontWeight: 500,
            color: copied ? '#1D9E75' : '#fff',
            background: copied ? '#1D9E7518' : '#378ADD',
            border: copied ? '0.5px solid #1D9E75' : 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copiato — incollalo in Claude' : 'Copia prompt completo'}
        </button>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
        Incolla il prompt in Claude, ricevi il file JSX generato,<br/>
        salvalo e importalo in Sensei con "Importa".
      </p>
    </div>
  )
}

export default PromptOutput