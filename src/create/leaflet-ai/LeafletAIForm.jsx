import React from 'react'

const TYPES = ['Ricetta', 'Guida / Config', 'Scheda tecnica', 'Minicorso', 'Altro']

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

function LeafletAIForm({ form, setForm, onGenerate }) {
  const isValid = form.topic.trim() && form.description.trim()

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

        <Row label="Argomento" hint="Di cosa parla il leaflet?">
          <input
            value={form.topic}
            onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            placeholder="es. Pasta alla carbonara, Configurare un router, Accordi di chitarra…"
            style={inputStyle}
          />
        </Row>

        <Row label="Tipo" hint="Che formato si adatta meglio al contenuto?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: f.type === t ? '' : t }))}
                style={{
                  padding: '7px 14px', fontSize: 12,
                  borderRadius: 'var(--radius-md)',
                  border: form.type === t ? '0.5px solid #378ADD' : '0.5px solid var(--border)',
                  background: form.type === t ? '#378ADD18' : 'var(--bg-primary)',
                  color: form.type === t ? '#378ADD' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Numero di passi" hint="Quante sezioni o step ha il leaflet? Lascia vuoto se non applicabile.">
          <input
            value={form.steps}
            onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            placeholder="es. 5, 10… oppure lascia vuoto"
            type="number"
            min="0"
            style={{ ...inputStyle, maxWidth: 200 }}
          />
        </Row>

        <Row
          label="Descrizione e obiettivi"
          hint="Informazioni da includere, pubblico di riferimento, dettagli specifici — più dettagli, migliore il risultato"
          last
        >
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrivi cosa deve contenere il leaflet, a chi è rivolto, quali informazioni deve includere…"
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
          Genera leaflet
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  )
}

export default LeafletAIForm
