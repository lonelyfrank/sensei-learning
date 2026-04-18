import React, { useState } from 'react'
import Home from './pages/Home.jsx'
import Course from './pages/Course.jsx'

function App() {
  // Corso attualmente selezionato (null = siamo nella Home)
  const [selectedCourse, setSelectedCourse] = useState(null)

  return (
    <div>
      {/* Mostra Home se nessun corso è selezionato, altrimenti il corso */}
      {selectedCourse === null ? (
        <Home onSelectCourse={setSelectedCourse} />
      ) : (
        <Course course={selectedCourse} onBack={() => setSelectedCourse(null)} />
      )}
    </div>
  )
}

export default App