import React from 'react'

const LEVELS = ['Principiante', 'Intermedio', 'Avanzato']

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  color: 'var(--text-primary)', background: 'var(--bg-primary)',
  border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
  outline: 'none', boxSizing: 'border-box',
}

function Row({ label, hint, children, last }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: last ? 'none' : '0.5px solid var(--border)' }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px' }}>{label}</p>
      {hint && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '0 0 10px', lineHeight: 1.4 }}>{hint}</p>}
      {!hint && <div style={{ marginBottom: 10 }} />}
      {children}
    </div>
  )
}

function SentieroAIForm({ form, setForm, onGenerate }) {
  const isValid = form.topic.trim() && form.days.toString().trim() && form.description.trim()

  return (
    <div style={{ maxWidth: 580, width: '100%', margin: '0 auto' }}>

      {/* Card campi */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 20,
      }}>

        <Row label="Argomento" hint="Su cosa si concentra il sentiero?">
          <input
            value={form.topic}
            onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            placeholder="es. Python per data science, smettere di fumare, onboarding aziendale…"
            style={inputStyle}
          />
        </Row>

        <Row label="Tipo di sentiero" hint="Corso, progetto, percorso benessere, formazione… (opzionale)">
          <input
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            placeholder="es. corso di studio, percorso benessere, formazione aziendale…"
            style={inputStyle}
          />
        </Row>

        <Row label="Step e livello" hint="Quanti step e qual è il livello di partenza?">
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={form.days}
              onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
              placeholder="Numero di step (es. 7, 14, 30)"
              type="number"
              min="1"
              style={{ ...inputStyle, flex: 1 }}
            />
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setForm(f => ({ ...f, level: l }))}
                  style={{
                    flex: 1, padding: '8px 4px', fontSize: 12,
                    borderRadius: 'var(--radius-md)',
                    border: form.level === l ? '0.5px solid #378ADD' : '0.5px solid var(--border)',
                    background: form.level === l ? '#378ADD18' : 'var(--bg-primary)',
                    color: form.level === l ? '#378ADD' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </Row>

        <Row
          label="Descrizione e obiettivi"
          hint="Background, obiettivi specifici, vincoli particolari — più dettagli, migliore il risultato"
          last
        >
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrivi cosa vuoi ottenere, il tuo background, gli obiettivi specifici del sentiero…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </Row>

      </div>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onGenerate}
          disabled={!isValid}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', fontSize: 13, fontWeight: 500,
            color: isValid ? '#fff' : 'var(--text-tertiary)',
            background: isValid ? '#378ADD' : 'var(--bg-tertiary)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: isValid ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (isValid) e.currentTarget.style.background = '#2a6fb5' }}
          onMouseLeave={e => { if (isValid) e.currentTarget.style.background = isValid ? '#378ADD' : 'var(--bg-tertiary)' }}
        >
          Genera sentiero
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  )
}

export default SentieroAIForm
