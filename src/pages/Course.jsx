import React, { useEffect, useState } from 'react'

function Course({ course, onBack }) {
  // Progressi del corso caricati dal database
  const [progress, setProgress] = useState([])

  // Carica i progressi quando il componente si monta
  useEffect(() => {
    loadProgress()
  }, [course.id])

  // Legge i progressi dal database tramite IPC
  const loadProgress = async () => {
    const result = await window.sensei.getProgress(course.id)
    setProgress(result)
  }

  // Calcola quanti giorni sono stati completati
  const completedCount = progress.filter(p => p.completed).length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header con nome corso e bottone torna indietro */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack}>← Indietro</button>
        <h2 style={{ margin: 0 }}>{course.name}</h2>
        <span style={{ marginLeft: 'auto' }}>
          {completedCount} giorni completati
        </span>
      </div>

      {/* Iframe sandboxed che carica il corso JSX */}
      {/* allow-scripts: il corso può eseguire JavaScript */}
      {/* allow-same-origin: necessario per comunicare con l'app */}
      <iframe
        style={{ flex: 1, border: 'none' }}
        sandbox="allow-scripts allow-same-origin"
        src={`courses/${course.filename}`}
        title={course.name}
      />

    </div>
  )
}

export default Course