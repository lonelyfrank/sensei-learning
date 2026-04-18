import React, { useEffect, useState } from 'react'

function Home({ onSelectCourse }) {
  // Lista dei corsi caricati dal database
  const [courses, setCourses] = useState([])

  // Carica i corsi dal database quando il componente si monta
  useEffect(() => {
    loadCourses()
  }, [])

  // Legge i corsi dal database tramite IPC
  const loadCourses = async () => {
    const result = await window.sensei.getCourses()
    setCourses(result)
  }

  // Gestisce l'importazione di un nuovo corso
  const handleImport = async () => {
    // Apre il dialog di sistema per scegliere un file .jsx
    const result = await window.sensei.openFileDialog()

    // Se l'utente ha annullato, non fare nulla
    if (result.canceled) return

    const filePath = result.filePaths[0]

    // Copia il file nella cartella /courses e lo registra nel database
    await window.sensei.importCourse(filePath)

    // Ricarica la lista corsi per mostrare il nuovo corso
    loadCourses()
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1>Sensei</h1>
      <p>La tua piattaforma di apprendimento locale.</p>

      {/* Bottone per importare un nuovo corso */}
      <button onClick={handleImport}>
        + Importa corso
      </button>

      {/* Lista dei corsi */}
      <div style={{ marginTop: '40px' }}>
        {/* Messaggio se non ci sono corsi */}
        {courses.length === 0 && (
          <p>Nessun corso caricato. Importa il tuo primo corso!</p>
        )}

        {/* Card per ogni corso */}
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            style={{ cursor: 'pointer', padding: '20px', border: '1px solid #ccc', marginBottom: '12px' }}
          >
            <h3>{course.name}</h3>
            <p>{course.filename}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home