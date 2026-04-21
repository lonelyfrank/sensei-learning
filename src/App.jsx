// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Componente radice di Sensei — gestisce routing, stato globale e dialog di importazione

import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Course from './pages/Course.jsx'
import Settings from './pages/Settings.jsx'
import IconPicker from './components/IconPicker.jsx'
import TitleBar from './components/TitleBar.jsx'
import Progress from './pages/Progress.jsx'
import CreateHub from './pages/CreateHub.jsx'
import CreateSentieroAI from './create/sentiero-ai/CreateSentieroAI.jsx'
import CreateLeafletAI from './create/leaflet-ai/CreateLeafletAI.jsx'

// Palette colori di fallback per i sentieri senza colore assegnato
const COURSE_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#639922', '#E24B4A',
]

// Converte un id file (es. "python-base") in un nome leggibile ("Python Base")
function formatCourseName(id) {
  return id
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function App() {
  // ── Stato UI ──
  const [collapsed, setCollapsed] = useState(false)         // sidebar collassata
  const [currentView, setCurrentView] = useState('home')    // vista corrente
  const [currentCreateMode, setCurrentCreateMode] = useState(null) // modalità creazione attiva

  // ── Stato dati ──
  const [selectedCourse, setSelectedCourse] = useState(null) // sentiero/leaflet aperto
  const [courses, setCourses] = useState([])                 // tutti gli artifact
  const [user, setUser] = useState({ name: 'Utente', avatar: null })
  const [importDialog, setImportDialog] = useState(null)     // dati dialog di importazione

  // Carica dati iniziali all'avvio
  useEffect(() => {
    loadCourses()
    loadUser()
  }, [])

  // Carica il profilo utente dal DB
  const loadUser = async () => {
    const result = await window.sensei.getUser()
    if (result) setUser(result)
  }

  // Carica tutti i sentieri/leaflet con i progressi calcolati
  const loadCourses = async () => {
    const result = await window.sensei.getCourses()
    const coursesWithProgress = await Promise.all(
      result.map(async (course, index) => {
        const progress = await window.sensei.getProgress(course.id)
        const completed = progress.filter(p => p.completed).length
        const total = course.total_days || 1
        return {
          ...course,
          // Colore di fallback se non assegnato al momento dell'import
          color: course.color || COURSE_COLORS[index % COURSE_COLORS.length],
          // Percentuale di completamento (0-100)
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedDays: completed,
          totalDays: total,
        }
      })
    )
    setCourses(coursesWithProgress)
  }

  // Naviga tra le viste principali — resetta la modalità creazione
  const handleNavigate = (view, course = null) => {
    setCurrentView(view)
    setSelectedCourse(course)
    setCurrentCreateMode(null)
  }

  // Apre il dialog di sistema per scegliere un file JSX da importare
  const handleImport = async () => {
    const result = await window.sensei.openFileDialog()
    if (result.canceled) return
    const filePath = result.filePaths[0]
    const filename = filePath.split('/').pop()
    const courseId = filename.replace('.jsx', '')
    const suggestedName = formatCourseName(courseId)
    // Mostra il dialog di personalizzazione prima di importare
    setImportDialog({ filePath, suggestedName, icon: 'BookOpen', color: '#378ADD' })
  }

  // Conferma l'importazione con nome, icona e colore scelti dall'utente
  const handleImportConfirm = async (filePath, name, icon, color) => {
    await window.sensei.importCourse(filePath, name, icon, color)
    setImportDialog(null)
    loadCourses() // ricarica la lista con il nuovo artifact
  }

  // Rimuove un sentiero/leaflet dal DB e dal filesystem
  const handleRemove = async (course) => {
    await window.sensei.removeCourse(course.id, course.filename)
    loadCourses()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Barra del titolo custom (draggable, controlli finestra) */}
      <TitleBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar con navigazione, sentieri attivi e profilo */}
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

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Topbar minimale quando la sidebar è collassata — mostra solo il bottone per riaprirla */}
          {collapsed && (
            <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <button
                onClick={() => setCollapsed(false)}
                style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}
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

          {/* ── ROUTING VISTE ─────────────────────────────────────────────── */}

          {/* Dashboard — griglia sentieri e leaflet */}
          {currentView === 'home' && (
            <Home
              courses={courses}
              onSelectCourse={(course) => handleNavigate('course', course)}
              onImport={handleImport}
              onRemove={handleRemove}
            />
          )}

          {/* Visualizzatore artifact — iframe sandboxed */}
          {currentView === 'course' && selectedCourse && (
            <Course
              course={selectedCourse}
              onBack={() => handleNavigate('home')}
              onProgressUpdate={loadCourses}
            />
          )}

          {/* Impostazioni — profilo e aspetto */}
          {currentView === 'settings' && (
            <Settings
              onBack={() => handleNavigate('home')}
              onSave={loadUser}
            />
          )}

          {/* Pagina progressi — XP, livelli, badge, attività */}
          {currentView === 'progress' && (
            <Progress
              onBack={() => handleNavigate('home')}
              courses={courses}
            />
          )}

          {/* CreateHub — landing page con selezione modalità di creazione */}
          {currentView === 'create' && !currentCreateMode && (
            <CreateHub
              onBack={() => handleNavigate('home')}
              onSelectMode={mode => setCurrentCreateMode(mode)}
              onImport={handleImport}
            />
          )}

          {/* Crea Sentiero con AI — percorso progressivo nel tempo */}
          {currentView === 'create' && currentCreateMode === 'sentiero-ai' && (
            <CreateSentieroAI
              onBack={() => setCurrentCreateMode(null)}
            />
          )}

          {/* Crea Leaflet con AI — documento consultabile (ricette, guide, schede) */}
          {currentView === 'create' && currentCreateMode === 'leaflet-ai' && (
            <CreateLeafletAI
              onBack={() => setCurrentCreateMode(null)}
            />
          )}

        </div>
      </div>

      {/* Dialog di importazione — personalizza nome, icona e colore prima di importare */}
      {importDialog && (
        <ImportDialog
          suggestedName={importDialog.suggestedName}
          filePath={importDialog.filePath}
          defaultIcon={importDialog.icon}
          defaultColor={importDialog.color}
          onConfirm={handleImportConfirm}
          onCancel={() => setImportDialog(null)}
        />
      )}

    </div>
  )
}

// Dialog modale per personalizzare un artifact prima dell'importazione
function ImportDialog({ suggestedName, filePath, defaultIcon, defaultColor, onConfirm, onCancel }) {
  const [name, setName] = useState(suggestedName)
  const [icon, setIcon] = useState(defaultIcon)
  const [color, setColor] = useState(defaultColor)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>Importa artifact</h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>Personalizza l'artifact prima di importarlo in Sensei.</p>

        {/* Campo nome */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(filePath, name, icon, color) }}
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', marginBottom: 20 }}
        />

        {/* Selezione icona e colore */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Icona e colore</label>
        <IconPicker selectedIcon={icon} selectedColor={color} onSelectIcon={setIcon} onSelectColor={setColor} />

        {/* Azioni */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onCancel}
            style={{ padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(filePath, name, icon, color)}
            style={{ padding: '7px 16px', fontSize: 13, color: '#fff', background: color, border: 'none', borderRadius: 'var(--radius-md)', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Importa
          </button>
        </div>
      </div>
    </div>
  )
}

export default App