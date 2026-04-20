import React, { useState } from 'react'

// Template del prompt base — invariabile, contiene le specifiche tecniche di Sensei
const PROMPT_BASE = `Crea un sentiero interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX come sentieri interattivi.
Un sentiero può essere qualsiasi tipo di percorso strutturato: un corso di studio, un progetto,
un percorso benessere, una formazione aziendale, un piano personale — qualsiasi cosa abbia
una progressione e un obiettivo.
I sentieri girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Specifiche tecniche obbligatorie

**Struttura del file:**
- Un singolo file .jsx
- Un componente React come export default
- Nessun import di librerie esterne oltre a react e lucide-react
- Tailwind CSS disponibile globalmente per lo styling
- Non usare: new Map(), new Set(), o altri costruttori JS nativi come variabili — 
  collidono con le icone Lucide dello stesso nome

**Storage dei progressi (OBBLIGATORIO):**
\`\`\`js
// Salva
await window.storage.set('chiave', JSON.stringify(valore))
// Leggi
const result = await window.storage.get('chiave')
const valore = result ? JSON.parse(result.value) : defaultValue
\`\`\`
La chiave 'completed' deve contenere un oggetto con chiavi numeriche e valori booleani:
{ "1": true, "2": false, ... } — questo permette a Sensei di tracciare il progresso automaticamente.

**Pattern import:**
\`\`\`jsx
import React, { useState, useEffect, useMemo } from 'react'
import { NomeIcona } from 'lucide-react'
\`\`\`

**Export:**
\`\`\`jsx
export default function NomeSentiero() { ... }
\`\`\`

## Struttura contenuto
Il sentiero deve avere una vista panoramica e una vista dettaglio per ogni step.
Ogni step deve avere almeno:
- Titolo e obiettivo chiaro
- Contenuto principale (teoria, istruzioni, piano, esercizi — dipende dal tipo)
- Azione concreta da compiere
- Modo per segnare lo step come completato

## Design
Crea un design unico e originale coerente con il tema e il tipo del sentiero.
Usa colori, tipografia e layout che riflettano la natura del contenuto.
Il sentiero deve essere visivamente distintivo — niente template generici.
Può avere un tema fisso (dark o light) coerente con il contenuto.

## Navigazione
- Vista panoramica con tutti gli step e il progresso complessivo
- Vista dettaglio per ogni step
- Bottone per segnare ogni step come completato
- Possibilità di tornare alla panoramica`

const LEVELS = ['Principiante', 'Intermedio', 'Avanzato']

function CreateWithAI({ onBack }) {
  const [step, setStep] = useState('info')
  const [form, setForm] = useState({
    topic: '',
    type: '',
    days: '',
    level: 'Principiante',
    description: '',
  })
  const [userSection, setUserSection] = useState('')
  const [copied, setCopied] = useState(false)

  // Genera la sezione personale dal form — editabile dall'utente nello step 2
  const generateUserSection = () => {
    return `## Il sentiero da creare

**Argomento:** ${form.topic}
**Tipo di sentiero:** ${form.type || 'Non specificato'}
**Numero di step:** ${form.days}
**Livello:** ${form.level}
**Descrizione e obiettivi:** ${form.description}`
  }

  const handleGenerate = () => {
    setUserSection(generateUserSection())
    setStep('output')
  }

  const fullPrompt = `${PROMPT_BASE}\n\n${userSection}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Topic, days e description sono obbligatori
  const isValid = form.topic.trim() && form.days.toString().trim() && form.description.trim()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 680 }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Crea con AI</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Genera un prompt ottimizzato da dare a Claude
          </p>
        </div>
      </div>

      {step === 'info' ? (

        /* ── STEP 1: Form ── */
        <div>

          {/* Argomento — obbligatorio */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Argomento *
            </label>
            <input
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="es. Python per data science, smettere di fumare, onboarding aziendale..."
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13,
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
          </div>

          {/* Tipo di sentiero — opzionale */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Tipo di sentiero
            </label>
            <input
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              placeholder="es. corso di studio, progetto, percorso benessere, formazione aziendale..."
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13,
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
          </div>

          {/* Step e Livello affiancati */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>

            {/* Numero di step — obbligatorio */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Numero di step *
              </label>
              <input
                value={form.days}
                onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
                placeholder="es. 7, 14, 30..."
                type="number"
                min="1"
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13,
                  color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                  border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Livello */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Livello
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setForm(f => ({ ...f, level: l }))}
                    style={{
                      flex: 1, padding: '9px 4px', fontSize: 12,
                      borderRadius: 'var(--radius-md)',
                      border: form.level === l ? '0.5px solid #378ADD' : '0.5px solid var(--border)',
                      background: form.level === l ? '#378ADD18' : 'var(--bg-secondary)',
                      color: form.level === l ? '#378ADD' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Descrizione — obbligatoria */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Descrizione e obiettivi *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrivi cosa vuoi ottenere, il tuo background, gli obiettivi specifici del sentiero..."
              rows={5}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13,
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Bottone genera */}
          <button
            onClick={handleGenerate}
            disabled={!isValid}
            style={{
              width: '100%', padding: '11px', fontSize: 14, fontWeight: 500,
              color: isValid ? '#fff' : 'var(--text-tertiary)',
              background: isValid ? '#378ADD' : 'var(--bg-tertiary)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: isValid ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (isValid) e.currentTarget.style.background = '#2a6fb5' }}
            onMouseLeave={e => { if (isValid) e.currentTarget.style.background = isValid ? '#378ADD' : 'var(--bg-tertiary)' }}
          >
            Genera prompt →
          </button>
        </div>

      ) : (

        /* ── STEP 2: Output ── */
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

          {/* Sezione personale — editabile */}
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
              onClick={() => setStep('info')}
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
      )}
    </div>
  )
}

export default CreateWithAI