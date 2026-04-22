import React from 'react'

/* Lista progressi per ogni sentiero/leaflet */
function CourseProgressList({ allProgress }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Per sentiero
      </span>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allProgress.map(({ course, progress }) => {
          const completed = progress.filter(p => p.completed).length
          const total = course.total_days || 1
          const pct = Math.round((completed / total) * 100)
          const lastDone = progress
            .filter(p => p.completed && p.completed_at)
            .sort((a, b) => b.completed_at - a.completed_at)[0]

          return (
            <div key={course.id} style={{
              padding: '14px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Pallino colore + badge tipo */}
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: course.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{course.name}</span>
                  {course.type === 'leaflet' && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 99,
                      background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
                      fontWeight: 500, letterSpacing: '0.03em',
                    }}>
                      leaflet
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {completed} / {total} step · {pct}%
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: pct === 100 ? '#1D9E75' : course.color,
                  borderRadius: 2, transition: 'width 0.5s ease',
                }} />
              </div>
              {lastDone && (
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Ultimo aggiornamento: {new Date(lastDone.completed_at).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseProgressList