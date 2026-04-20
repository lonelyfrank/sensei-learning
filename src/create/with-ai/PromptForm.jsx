import React from 'react'

const LEVELS = ['Principiante', 'Intermedio', 'Avanzato']

/* Step 1 — form per raccogliere i dati del sentiero */
function PromptForm({ form, setForm, onGenerate }) {
  const isValid = form.topic.trim() && form.days.toString().trim() && form.description.trim()

  return (
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
        onClick={onGenerate}
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
  )
}

export default PromptForm