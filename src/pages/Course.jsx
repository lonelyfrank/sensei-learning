import React, { useEffect, useState, Suspense } from 'react'

function Course({ course, onBack, onProgressUpdate }) {
  const [progress, setProgress] = useState({})
  const [CourseComponent, setCourseComponent] = useState(null)
  const [error, setError] = useState(null)

  // Carica i progressi quando il componente si monta
  useEffect(() => {
    loadProgress()
    loadCourseComponent()
  }, [course.id])

  const loadProgress = async () => {
    const result = await window.sensei.getProgress(course.id)
    const map = {}
    result.forEach(p => { map[p.day_id] = p.completed })
    setProgress(map)
  }

  // Carica il componente JSX del corso dinamicamente
  const loadCourseComponent = async () => {
    try {
      setError(null)
      // Importa il file JSX dalla cartella courses
      const module = await import(/* @vite-ignore */ `../../courses/${course.filename}`)
      setCourseComponent(() => module.default)
    } catch (err) {
      console.error('Errore caricamento corso:', err)
      setError(err.message)
    }
  }

  const completedCount = Object.values(progress).filter(Boolean).length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px',
        height: 52,
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-primary)',
      }}>
        {/* Bottone indietro */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
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

        {/* Nome corso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 10, height: 10, borderRadius: 3,
            background: course.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {course.name}
          </span>
        </div>

        {/* Progressi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {completedCount} / {course.totalDays} giorni
          </span>
          <div style={{ width: 80, height: 3, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
            <div style={{
              width: `${course.progress}%`,
              height: '100%', background: course.color,
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: course.color }}>{course.progress}%</span>
        </div>
      </div>

      {/* Contenuto corso */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <div style={{
            padding: 32, color: '#E24B4A',
            fontSize: 13, textAlign: 'center',
          }}>
            <p>Errore nel caricamento del corso.</p>
            <p style={{ color: 'var(--text-tertiary)', marginTop: 8, fontSize: 12 }}>{error}</p>
          </div>
        )}
        {!error && !CourseComponent && (
          <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
            Caricamento corso...
          </div>
        )}
        {!error && CourseComponent && (
          <Suspense fallback={
            <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
              Caricamento...
            </div>
          }>
            <CourseComponent />
          </Suspense>
        )}
      </div>

    </div>
  )
}

export default Course