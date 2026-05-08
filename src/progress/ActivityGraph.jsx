import React, { useState, useMemo } from 'react'

const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

// Funzioni pure a livello di modulo — non ricreate ad ogni render
// Raggruppa i giorni in settimane, aggiungendo celle null per allineare il primo giorno
function buildGrid(activity) {
  if (!activity.length) return []
  const firstDate = new Date(activity[0].date)
  // JS: 0=dom → convertiamo in 0=lun, 6=dom per allineamento settimanale europeo
  const firstDow = (firstDate.getDay() + 6) % 7
  const padded = [...Array(firstDow).fill(null), ...activity]
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}

// Determina il label del mese da mostrare sopra ogni colonna (solo al cambio mese)
function buildMonthLabels(weeks) {
  const labels = []
  let lastMonth = -1
  for (const week of weeks) {
    const firstReal = week.find(d => d !== null)
    if (firstReal) {
      const month = new Date(firstReal.date).getMonth()
      labels.push(month !== lastMonth ? { label: MONTHS[month] } : null)
      lastMonth = month
    } else {
      labels.push(null)
    }
  }
  return labels
}

// Colore cella in base al numero di step — 5 livelli di intensità
function cellColor(day) {
  if (!day || day.count === 0) return 'var(--bg-tertiary)'
  if (day.count === 1) return '#378ADD33'
  if (day.count === 2) return '#378ADD66'
  if (day.count <= 4) return '#378ADD99'
  return '#378ADD'
}

/* Grafico attività stile GitHub — griglia settimane × giorni */
function ActivityGraph({ activity }) {
  const [tooltip, setTooltip] = useState(null)

  // Memoizzati: ricalcolati solo quando cambia activity (caricamento pagina)
  const weeks = useMemo(() => buildGrid(activity), [activity])
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks])

  return (
    <div style={{ marginTop: 12, position: 'relative' }}>

      {/* Griglia */}
      <div style={{ display: 'flex', gap: 3 }}>

        {/* Label giorni settimana */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{
              width: 12, height: 12,
              fontSize: 9, color: 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {/* Mostra solo Lun, Mer, Ven per non affollare */}
              {[0, 2, 4].includes(i) ? d : ''}
            </div>
          ))}
        </div>

        {/* Colonne settimane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Label mesi */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            {weeks.map((_, wi) => (
              <div key={wi} style={{
                width: 12,
                fontSize: 9, color: 'var(--text-tertiary)',
                whiteSpace: 'nowrap', overflow: 'visible',
              }}>
                {monthLabels[wi]?.label || ''}
              </div>
            ))}
          </div>

          {/* Celle giorni */}
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    style={{
                      width: 12, height: 12,
                      borderRadius: 3,
                      background: cellColor(day),
                      cursor: day?.count > 0 ? 'pointer' : 'default',
                      transition: 'transform 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (day) {
                        e.currentTarget.style.transform = 'scale(1.3)'
                        setTooltip({ day, x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      setTooltip(null)
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda intensità */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Meno</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} style={{
            width: 12, height: 12, borderRadius: 3,
            background: level === 0 ? 'var(--bg-tertiary)'
              : level === 1 ? '#378ADD33'
              : level === 2 ? '#378ADD66'
              : level === 3 ? '#378ADD99'
              : '#378ADD',
          }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Di più</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 36,
          background: 'var(--bg-primary)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '5px 10px',
          fontSize: 11, color: 'var(--text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#378ADD', fontWeight: 600 }}>{tooltip.day.count} step</span>
          {' — '}
          {new Date(tooltip.day.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
        </div>
      )}
    </div>
  )
}

export default ActivityGraph