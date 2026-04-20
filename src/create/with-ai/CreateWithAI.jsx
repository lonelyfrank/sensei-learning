import React, { useState } from 'react'
import PromptForm from './PromptForm.jsx'
import PromptOutput from './PromptOutput.jsx'

/* Pagina Crea con AI — genera un prompt ottimizzato per Claude */
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

  // Genera la sezione personale dal form e passa allo step 2
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

      {/* ── STEP 1: Form ── */}
      {step === 'info' && (
        <PromptForm
          form={form}
          setForm={setForm}
          onGenerate={handleGenerate}
        />
      )}

      {/* ── STEP 2: Output ── */}
      {step === 'output' && (
        <PromptOutput
          userSection={userSection}
          setUserSection={setUserSection}
          onBack={() => setStep('info')}
        />
      )}

    </div>
  )
}

export default CreateWithAI