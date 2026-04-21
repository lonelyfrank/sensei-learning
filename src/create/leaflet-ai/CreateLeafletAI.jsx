import React, { useState } from 'react'
import LeafletAIForm from './LeafletAIForm.jsx'
import LeafletAIOutput from './LeafletAIOutput.jsx'

/* Pagina Crea Leaflet con AI — genera un prompt ottimizzato per documenti consultabili */
function CreateLeafletAI({ onBack }) {
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
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Leaflet con AI</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Genera un prompt ottimizzato per creare una guida, ricetta o scheda consultabile
          </p>
        </div>
      </div>

      {/* ── STEP 1: Form ── */}
      {step === 'info' && (
        <LeafletAIForm
          form={form}
          setForm={setForm}
          onGenerate={handleGenerate}
        />
      )}

      {/* ── STEP 2: Output ── */}
      {step === 'output' && (
        <LeafletAIOutput
          userSection={userSection}
          setUserSection={setUserSection}
          onBack={() => setStep('info')}
        />
      )}

    </div>
  )
}

export default CreateLeafletAI