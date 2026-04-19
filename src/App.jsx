import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Course from './pages/Course.jsx'
import Settings from './pages/Settings.jsx'

// Colori assegnati ai corsi in sequenza — si ripetono se ci sono più di 8 corsi
const COURSE_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#639922', '#E24B4A',
]

// Converte il filename in nome leggibile: os-journey → Os Journey
function formatCourseName(id) {
  return id
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function App() {
  const [collapsed, setCollapsed] = useState(false)       // sidebar aperta/chiusa
  const [currentView, setCurrentView] = useState('home')  // vista corrente
  const [selectedCourse, setSelectedCourse] = useState(null) // corso aperto
  const [courses, setCourses] = useState([])               // lista corsi con progressi
  const [user, setUser] = useState({ name: 'Utente', avatar: null }) // profilo utente
  const [importDialog, setImportDialog] = useState(null)  // dati dialog importazione

  // Carica corsi e profilo all'avvio
  useEffect(() => {
    loadCourses()
    loadUser()
  }, [])

  // Legge il profilo utente dal database
  const loadUser = async () => {
    const result = await window.sensei.getUser()
    if (result) setUser(result)
  }

  // Legge tutti i corsi e calcola i progressi per ognuno
  const loadCourses = async () => {
    const result = await window.sensei.getCourses()
    const coursesWithProgress = await Promise.all(
      result.map(async (course, index) => {
        const progress = await window.sensei.getProgress(course.id)
        const completed = progress.filter(p => p.completed).length
        const total = course.total_days || 1
        return {
          ...course,
          color: COURSE_COLORS[index % COURSE_COLORS.length],
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedDays: completed,
          totalDays: total,
        }
      })
    )
    setCourses(coursesWithProgress)
  }

  // Cambia la vista corrente e imposta il corso selezionato se necessario
  const handleNavigate = (view, course = null) => {
    setCurrentView(view)
    setSelectedCourse(course)
  }

  // Apre il dialog di sistema per scegliere un file JSX
  // poi mostra il dialog interno per personalizzare il nome
  const handleImport = async () => {
    const result = await window.sensei.openFileDialog()
    if (result.canceled) return
    const filePath = result.filePaths[0]
    const filename = filePath.split('/').pop()
    const courseId = filename.replace('.jsx', '')
    const suggestedName = formatCourseName(courseId)
    setImportDialog({ filePath, suggestedName })
  }

  // Conferma l'importazione con il nome scelto dall'utente
  const handleImportConfirm = async (filePath, name) => {
    await window.sensei.importCourse(filePath, name)
    setImportDialog(null)
    loadCourses()
  }

  // Rimuove un corso dal database e dal filesystem
  const handleRemove = async (course) => {
    await window.sensei.removeCourse(course.id, course.filename)
    loadCourses()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        courses={courses}
        onImport={handleImport}
        user={user}
        onOpenSettings={() => handleNavigate('settings')}
        onOpenProgress={() => handleNavigate('progress')}
      />

      {/* ── AREA PRINCIPALE ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar — visibile solo quando la sidebar è chiusa
            contiene il bottone per riaprirla senza sovrapposi al contenuto */}
        {collapsed && (
          <div style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '0.5px solid var(--border)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Apri barra laterale"
              style={{
                width: 28, height: 28,
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" opacity="0.4"/>
                <rect x="2" y="2" width="6" height="16" rx="3" fill="currentColor" opacity="0.15"/>
                <path d="M8 7l2.5 3L8 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── VISTE ── */}

        {/* Dashboard principale con lista corsi */}
        {currentView === 'home' && (
          <Home
            courses={courses}
            onSelectCourse={(course) => handleNavigate('course', course)}
            onImport={handleImport}
            onRemove={handleRemove}
          />
        )}

        {/* Visualizzatore corso con iframe sandbox */}
        {currentView === 'course' && selectedCourse && (
          <Course
            course={selectedCourse}
            onBack={() => handleNavigate('home')}
            onProgressUpdate={loadCourses}
          />
        )}

        {/* Impostazioni profilo utente */}
        {currentView === 'settings' && (
          <Settings
            onBack={() => handleNavigate('home')}
            onSave={loadUser}
          />
        )}

        {/* Panoramica progressi — placeholder, da sviluppare */}
        {currentView === 'progress' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <button
                onClick={() => handleNavigate('home')}
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
              <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>Progressi</h1>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              Pagina in costruzione — qui vedremo statistiche e storico apprendimento.
            </p>
          </div>
        )}

      </div>

      {/* ── DIALOG IMPORTAZIONE CORSO ──
          Appare sopra tutto quando l'utente sceglie un file */}
      {importDialog && (
        <ImportDialog
          suggestedName={importDialog.suggestedName}
          filePath={importDialog.filePath}
          onConfirm={handleImportConfirm}
          onCancel={() => setImportDialog(null)}
        />
      )}

    </div>
  )
}

/* Dialog modale per personalizzare il nome del corso all'importazione */
function ImportDialog({ suggestedName, filePath, onConfirm, onCancel }) {
  const [name, setName] = useState(suggestedName)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        width: 360,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Importa corso
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Dai un nome al corso che stai importando.
        </p>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Nome corso
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          // Invio = conferma importazione
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(filePath, name) }}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            marginBottom: 20,
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '7px 16px', fontSize: 13,
              color: 'var(--text-secondary)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(filePath, name)}
            style={{
              padding: '7px 16px', fontSize: 13,
              color: '#fff',
              background: '#378ADD',
              border: 'none',
              borderRadius: 'var(--radius-md)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a6fb5'}
            onMouseLeave={e => e.currentTarget.style.background = '#378ADD'}
          >
            Importa
          </button>
        </div>
      </div>
    </div>
  )
}

export default App