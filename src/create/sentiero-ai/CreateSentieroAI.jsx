import React, { useState } from 'react'
import SentieroAIForm from './SentieroAIForm.jsx'
import SentieroAIOutput from './SentieroAIOutput.jsx'

function CreateSentieroAI({ onBack, onImported }) {
  const [step, setStep] = useState('info')
  const [form, setForm] = useState({
    topic: '',
    type: '',
    days: '',
    level: 'Principiante',
    description: '',
  })
  const [userSection, setUserSection] = useState('')

  const handleGenerate = () => {
    setUserSection(`## Il sentiero da creare

**Argomento:** ${form.topic}
**Tipo di sentiero:** ${form.type || 'Non specificato'}
**Numero di step:** ${form.days}
**Livello:** ${form.level}
**Descrizione e obiettivi:** ${form.description}`)
    setStep('output')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── HEADER — non scrollabile ── */}
      {step === 'info' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 32px',
          borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
        }}>
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
            <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Sentiero con AI</h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 1 }}>
              Genera un percorso di apprendimento progressivo
            </p>
          </div>
        </div>
      )}

      {/* ── CONTENUTO ── */}
      {step === 'info' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <SentieroAIForm
            form={form}
            setForm={setForm}
            onGenerate={handleGenerate}
          />
        </div>
      ) : (
        <SentieroAIOutput
          userSection={userSection}
          setUserSection={setUserSection}
          suggestedName={form.topic}
          onBack={() => setStep('info')}
          onImported={onImported}
        />
      )}

    </div>
  )
}

export default CreateSentieroAI
