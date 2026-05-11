import React, { useState } from 'react'
import LeafletAIForm from './LeafletAIForm.jsx'
import LeafletAIOutput from './LeafletAIOutput.jsx'

function CreateLeafletAI({ onBack, onImported }) {
  const [step, setStep] = useState('info')
  const [form, setForm] = useState({
    topic: '',
    type: '',
    steps: '',
    description: '',
  })
  const [userSection, setUserSection] = useState('')

  const handleGenerate = () => {
    setUserSection(`## Il leaflet da creare

**Argomento:** ${form.topic}
**Tipo:** ${form.type || 'Non specificato'}
**Numero di passi:** ${form.steps || 'Non specificato'}
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
            <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Leaflet con AI</h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 1 }}>
              Genera una guida, ricetta o scheda consultabile
            </p>
          </div>
        </div>
      )}

      {/* ── CONTENUTO ── */}
      {step === 'info' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <LeafletAIForm
            form={form}
            setForm={setForm}
            onGenerate={handleGenerate}
          />
        </div>
      ) : (
        <LeafletAIOutput
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

export default CreateLeafletAI
