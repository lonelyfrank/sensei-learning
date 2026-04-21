import React from 'react'

const TYPES = ['Ricetta', 'Guida / Configurazione', 'Scheda tecnica', 'Minicorso', 'Altro']

/* Step 1 — form per raccogliere i dati del leaflet */
function LeafletAIForm({ form, setForm, onGenerate }) {
  const isValid = form.topic.trim() && form.description.trim()

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
          placeholder="es. Pasta alla carbonara, Configurare un router TP-Link, Accordi di chitarra..."
          style={{
            width: '100%', padding: '9px 12px', fontSize: 13,
            color: 'var(--text-primary)', background: 'var(--bg-secondary)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
            outline: 'none',
          }}
        />
      </div>

      {/* Tipo di leaflet */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Tipo di leaflet
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, type: t }))}
              style={{
                padding: '7px 12px', fontSize: 12,
                borderRadius: 'var(--radius-md)',
                border: form.type === t ? '0.5px solid #378ADD' : '0.5px solid var(--border)',
                background: form.type === t ? '#378ADD18' : 'var(--bg-secondary)',
                color: form.type === t ? '#378ADD' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Numero di passi — opzionale */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Numero di passi <span style={{ color: 'var(--text-tertiary)' }}>(opzionale — lascia vuoto se non applicabile)</span>
        </label>
        <input
          value={form.steps}
          onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
          placeholder="es. 5, 10... oppure lascia vuoto"
          type="number"
          min="0"
          style={{
            width: '100%', padding: '9px 12px', fontSize: 13,
            color: 'var(--text-primary)', background: 'var(--bg-secondary)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
            outline: 'none',
          }}
        />
      </div>

      {/* Descrizione — obbligatoria */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Descrizione e obiettivi *
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descrivi cosa deve contenere il leaflet, a chi è rivolto, quali informazioni deve includere..."
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

export default LeafletAIForm