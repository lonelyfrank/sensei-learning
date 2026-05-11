// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Orchestratore principale: gestisce navigazione, stato globale e dialoghi modali.
// Tutti i dati (corsi, utente) vivono qui e scendono ai figli via props.

import React, { useState, useEffect, useRef } from 'react'
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
import Toast from './components/Toast.jsx'
import { useToast } from './hooks/useToast.js'
import SenseiLogo from './assets/sensei-logo.svg?react'

// Palette di colori assegnati ai corsi in ordine ciclico quando l'artifact
// non specifica un colore proprio.
const COURSE_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#639922', '#E24B4A',
]

// Trasforma un courseId (es. "react-basics_2024") in un nome leggibile
// capitalizzando ogni parola e normalizzando trattini e underscore.
function formatCourseName(id) {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function App() {
  // ── Stato navigazione ────────────────────────────────────────────────────────
  const [collapsed, setCollapsed]           = useState(false)
  const [currentView, setCurrentView]       = useState('home')
  const [currentCreateMode, setCurrentCreateMode] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  // ── Dati applicazione ────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([])
  const [user, setUser]       = useState({ name: 'Utente', avatar: null })

  // ── Stato dialoghi modali ────────────────────────────────────────────────────
  const [importDialog, setImportDialog]   = useState(null)   // dati del file da importare
  const [confirmDelete, setConfirmDelete] = useState(null)   // corso da eliminare

  // ── Feedback utente ──────────────────────────────────────────────────────────
  // justCompleted: id del sentiero appena completato, usato per animare la card in Home
  const [justCompleted, setJustCompleted] = useState(null)
  const [showWelcome, setShowWelcome]     = useState(false)

  // ── Transizione di vista ─────────────────────────────────────────────────────
  // Fade-out (150ms) → cambio vista → fade-in. Il ref evita timeout sovrapposti
  // se l'utente naviga velocemente prima che la transizione sia completa.
  const [viewOpacity, setViewOpacity]   = useState(1)
  const viewTransitionRef               = useRef(null)

  const [importing, setImporting] = useState(false)
  const [importErrors, setImportErrors] = useState([])

  const { toasts, removeToast, toastComplete, toastError, toastSuccess } = useToast()

  useEffect(() => {
    loadCourses()
    loadUser()
    window.sensei.getWelcomed().then(seen => { if (!seen) setShowWelcome(true) })
  }, [])

  const loadUser = async () => {
    const result = await window.sensei.getUser()
    if (result) setUser(result)
  }

  // Carica tutti i corsi dal DB e arricchisce ogni elemento con il progresso
  // calcolato (percentuale, giorni completati, giorni totali) e un colore di default.
  const loadCourses = async () => {
    try {
      const result = await window.sensei.getCourses()
      if (!result) return
      const coursesWithProgress = await Promise.all(
        result.map(async (course, index) => {
          const progress  = (await window.sensei.getProgress(course.id)) ?? []
          const completed = progress.filter(p => p.completed).length
          const total     = course.total_days || 1
          return {
            ...course,
            color:         course.color || COURSE_COLORS[index % COURSE_COLORS.length],
            progress:      total > 0 ? Math.round((completed / total) * 100) : 0,
            completedDays: completed,
            totalDays:     total,
          }
        })
      )
      setCourses(coursesWithProgress)
    } catch {
      toastError('Errore', 'Impossibile caricare gli artifact')
    }
  }

  // Naviga verso una vista con fade-out/fade-in da 150ms.
  // Cancella eventuali transizioni già in corso prima di avviarne una nuova.
  const handleNavigate = (view, course = null) => {
    clearTimeout(viewTransitionRef.current)
    setViewOpacity(0)
    viewTransitionRef.current = setTimeout(() => {
      setCurrentView(view)
      setSelectedCourse(course)
      setCurrentCreateMode(null)
      setViewOpacity(1)
    }, 150)
  }

  // Notifica il completamento di un sentiero: mostra il toast e avvia
  // l'animazione della card in Home. Il flag si resetta dopo 2s (durata animazione).
  const handleComplete = (courseName, courseId) => {
    toastComplete(courseName)
    setJustCompleted(courseId)
    setTimeout(() => setJustCompleted(null), 2000)
  }

  // Apre il dialog di sistema per selezionare un file .jsx.
  // Usa regex /[\\/]/ per estrarre il basename in modo cross-platform
  // (Windows usa \ come separatore, macOS/Linux usano /).
  const handleImport = async () => {
    const result = await window.sensei.openFileDialog()
    if (result.canceled) return
    const filePath       = result.filePaths[0]
    const filename       = filePath.split(/[\\/]/).pop()
    const courseId       = filename.replace('.jsx', '')
    const suggestedName  = formatCourseName(courseId)
    setImportErrors([])
    setImportDialog({ filePath, suggestedName, icon: 'BookOpen', color: '#378ADD' })
  }

  const handleImportConfirm = async (filePath, name, icon, color) => {
    setImporting(true)
    try {
      const result = await window.sensei.importCourse(filePath, name, icon, color)

      if (result?.errors?.length) {
        // Validazione fallita — mantieni il dialog aperto e mostra gli errori
        setImportErrors(result.errors)
        window.sensei.logArtifactError({
          filename: filePath.split(/[\\/]/).pop(),
          errors:   result.errors,
          source:   'manual',
          timestamp: new Date().toISOString(),
        }).catch(() => {})
        return
      }

      if (!result?.success) {
        toastError('Import fallito', result?.error || "Errore durante l'importazione")
        setImportDialog(null)
        return
      }

      if (result.warnings?.length) {
        window.sensei.logArtifactError({
          filename:  filePath.split(/[\\/]/).pop(),
          errors:    [],
          warnings:  result.warnings,
          source:    'manual',
          timestamp: new Date().toISOString(),
        }).catch(() => {})
      }
      toastSuccess('Artifact importato', name)
      setImportErrors([])
      setImportDialog(null)
      loadCourses()
    } catch (err) {
      toastError('Import fallito', err.message)
      setImportDialog(null)
    } finally {
      setImporting(false)
    }
  }

  const handleExportSingle = async (course) => {
    const result = await window.sensei.exportArtifact(course.filename)
    if (result?.success) toastSuccess('Artifact esportato', result.path.split(/[\\/]/).pop())
    else if (result && !result.canceled) toastError('Export fallito', result.error || '')
  }

  const handleExportMultiple = async (selectedCourses) => {
    const artifacts = selectedCourses.map(c => ({
      filename: c.filename,
      name:     c.name,
      type:     c.type || 'sentiero',
      tags:     c.tags,
      xp:       c.xp || 0,
    }))
    const result = await window.sensei.exportArtifacts(artifacts)
    if (result?.success) toastSuccess(`${result.count} artifact esportati`, result.path.split(/[\\/]/).pop())
    else if (result && !result.canceled) toastError('Export fallito', result.error || '')
  }

  const handleExportProgress = async () => {
    const result = await window.sensei.exportProgress()
    if (result?.success) toastSuccess('Progresso esportato', result.path.split(/[\\/]/).pop())
    else if (result && !result.canceled) toastError('Export fallito', result.error || '')
  }

  const handleImportZip = async () => {
    const result = await window.sensei.importZip()
    if (result?.success) {
      const msg = result.skipped?.length
        ? `${result.skipped.length} file saltati`
        : `${result.imported} importati`
      toastSuccess(`${result.imported} artifact importati`, msg)
      loadCourses()
    } else if (result && !result.canceled) {
      toastError('Import fallito', result.error || '')
    }
  }

  const handleRemove = (course) => setConfirmDelete(course)

  const handleRemoveConfirm = async () => {
    try {
      await window.sensei.removeCourse(confirmDelete.id, confirmDelete.filename)
      loadCourses()
    } catch {
      toastError('Errore', 'Impossibile eliminare l\'artifact')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      <TitleBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(true)}
          onExpand={() => setCollapsed(false)}
          onNavigate={handleNavigate}
          currentView={currentView}
          courses={courses}
          onImport={handleImport}
          user={user}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenProgress={() => handleNavigate('progress')}
        />

        {/* Area contenuto principale — opacità animata durante le transizioni di vista */}
        <ErrorBoundary>
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          opacity: viewOpacity, transition: 'opacity 0.15s ease',
        }}>

          {currentView === 'home' && (
            <Home
              courses={courses}
              onSelectCourse={(course) => handleNavigate('course', course)}
              onImport={handleImport}
              onCreate={() => handleNavigate('create')}
              onRemove={handleRemove}
              justCompleted={justCompleted}
              onExport={handleExportSingle}
              onExportMultiple={handleExportMultiple}
              onImportZip={handleImportZip}
            />
          )}

          {currentView === 'course' && selectedCourse && (
            <Course
              course={selectedCourse}
              onBack={() => handleNavigate('home')}
              onProgressUpdate={loadCourses}
              onComplete={handleComplete}
            />
          )}

          {currentView === 'settings' && (
            <Settings onBack={() => handleNavigate('home')} onSave={loadUser} />
          )}

          {currentView === 'progress' && (
            <Progress onBack={() => handleNavigate('home')} courses={courses} onExportProgress={handleExportProgress} />
          )}

          {currentView === 'create' && !currentCreateMode && (
            <CreateHub
              onBack={() => handleNavigate('home')}
              onSelectMode={mode => setCurrentCreateMode(mode)}
              onImport={handleImport}
            />
          )}

          {currentView === 'create' && currentCreateMode === 'sentiero-ai' && (
            <CreateSentieroAI
              onBack={() => setCurrentCreateMode(null)}
              onImported={() => { loadCourses(); handleNavigate('home') }}
            />
          )}

          {currentView === 'create' && currentCreateMode === 'leaflet-ai' && (
            <CreateLeafletAI
              onBack={() => setCurrentCreateMode(null)}
              onImported={() => { loadCourses(); handleNavigate('home') }}
            />
          )}

        </div>
        </ErrorBoundary>
      </div>

      {/* ── Dialoghi modali ── */}

      {showWelcome && (
        <WelcomeDialog
          onDismiss={() => { window.sensei.setWelcomed(); setShowWelcome(false) }}
          onImport={() => { window.sensei.setWelcomed(); setShowWelcome(false); handleImport() }}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          course={confirmDelete}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {importDialog && (
        <ImportDialog
          suggestedName={importDialog.suggestedName}
          filePath={importDialog.filePath}
          defaultIcon={importDialog.icon}
          defaultColor={importDialog.color}
          onConfirm={handleImportConfirm}
          onCancel={() => { setImportDialog(null); setImportErrors([]) }}
          loading={importing}
          errors={importErrors}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />

    </div>
  )
}

// ─── Dialogo di importazione artifact ────────────────────────────────────────
// Permette di personalizzare nome, icona e colore prima dell'importazione.
// Supporta conferma con Invio e chiusura con Esc.
function ImportDialog({ suggestedName, filePath, defaultIcon, defaultColor, onConfirm, onCancel, loading, errors }) {
  const [name,  setName]  = useState(suggestedName)
  const [icon,  setIcon]  = useState(defaultIcon)
  const [color, setColor] = useState(defaultColor)

  const hasErrors = errors?.length > 0
  const canImport = !loading && !hasErrors

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>Importa artifact</h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>Personalizza l'artifact prima di importarlo in Sensei.</p>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && canImport) onConfirm(filePath, name, icon, color) }}
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', marginBottom: 20 }}
        />

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Icona e colore</label>
        <IconPicker selectedIcon={icon} selectedColor={color} onSelectIcon={setIcon} onSelectColor={setColor} />

        {hasErrors && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#E24B4A12', border: '0.5px solid #E24B4A44' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#E24B4A', margin: '0 0 6px' }}>
              Artifact non valido — correggi il file e riprova
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
              {errors.map((err, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{ padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Annulla
          </button>
          <button
            onClick={() => canImport && onConfirm(filePath, name, icon, color)}
            disabled={!canImport}
            style={{ padding: '7px 16px', fontSize: 13, color: canImport ? '#fff' : 'var(--text-tertiary)', background: canImport ? color : 'var(--bg-secondary)', border: canImport ? 'none' : '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'opacity 0.15s', opacity: loading ? 0.6 : 1, cursor: canImport ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (canImport) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { if (canImport) e.currentTarget.style.opacity = '1' }}
          >
            {loading ? 'Importazione…' : 'Importa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schermata di benvenuto (primo avvio) ─────────────────────────────────────
// Mostrata una sola volta al primo avvio grazie al flag `welcomed` nel DB.
// Introduce i concetti chiave di Sensei con due card descrittive.
function WelcomeDialog({ onDismiss, onImport }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 40px 32px', width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ width: 52, height: 52, marginBottom: 20, color: 'var(--logo-color)' }}>
          <SenseiLogo width={52} height={52} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', textAlign: 'center' }}>
          Benvenuto in Sensei
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.5 }}>
          La tua piattaforma di apprendimento personale.<br />
          Carica artifact JSX interattivi generati con Claude AI.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginBottom: 28 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 14px' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>🧭</div>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Sentieri</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>Percorsi progressivi con step, XP e progressi tracciati nel tempo.</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 14px' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>📄</div>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Leaflet</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>Documenti interattivi da consultare in sessione singola.</p>
          </div>
        </div>

        <button
          onClick={onImport}
          autoFocus
          style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500, color: '#fff', background: '#378ADD', border: 'none', borderRadius: 'var(--radius-md)', marginBottom: 10, transition: 'opacity 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Importa il tuo primo artifact
        </button>
        <button
          onClick={onDismiss}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
        >
          Inizia a esplorare
        </button>

      </div>
    </div>
  )
}

// ─── Dialogo di conferma eliminazione ────────────────────────────────────────
// Richiede conferma esplicita prima di rimuovere un artifact e i suoi progressi.
// Chiude con Esc (annulla) o clic sul pulsante Elimina.
function ConfirmDeleteDialog({ course, onConfirm, onCancel }) {
  const isLeaflet = course.type === 'leaflet'
  const tipo      = isLeaflet ? 'leaflet' : 'sentiero'

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 360 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>Elimina {tipo}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          Sei sicuro di voler eliminare <strong style={{ color: 'var(--text-primary)' }}>{course.name}</strong>?
          {!isLeaflet && <><br /><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>I progressi associati verranno persi.</span></>}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            autoFocus
            style={{ padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '7px 16px', fontSize: 13, color: '#fff', background: '#E24B4A', border: 'none', borderRadius: 'var(--radius-md)', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Qualcosa è andato storto</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, maxWidth: 320, textAlign: 'center' }}>
            {this.state.error?.message || 'Errore sconosciuto'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 6, padding: '7px 16px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            Riprova
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default App
