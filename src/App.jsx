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
import { Route, BookOpen, Sparkles, Check } from 'lucide-react'

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

// ─── Onboarding primo avvio ───────────────────────────────────────────────────

const ONBOARDING_STARS = [
  { x:   0, y: -56, size: 6, anim: 'twinkle', dur: 2.8, delay: 0.3 },
  { x: -58, y:   0, size: 5, anim: 'twinkle', dur: 3.3, delay: 1.7 },
  { x:  56, y:   2, size: 5, anim: 'twinkle', dur: 2.5, delay: 0.8 },
  { x:   2, y:  56, size: 5, anim: 'twinkle', dur: 3.1, delay: 2.4 },
  { x: -42, y: -42, size: 4, anim: 'twinkle', dur: 2.7, delay: 1.2 },
  { x:  44, y: -42, size: 4, anim: 'twinkle', dur: 3.4, delay: 0.5 },
  { x: -42, y:  40, size: 3, anim: 'twinkle', dur: 2.4, delay: 2.9 },
  { x:  42, y:  42, size: 3, anim: 'twinkle', dur: 3.0, delay: 0.1 },
  { x: -36, y: -36, size: 3, anim: 'driftNW', dur: 3.8, delay: 0.0 },
  { x:  36, y: -38, size: 3, anim: 'driftNE', dur: 4.2, delay: 1.1 },
  { x:  42, y:  30, size: 3, anim: 'driftSE', dur: 4.0, delay: 0.4 },
  { x: -44, y:  28, size: 3, anim: 'driftSW', dur: 3.9, delay: 2.3 },
  { x:  -8, y: -52, size: 2, anim: 'driftN',  dur: 3.6, delay: 2.0 },
  { x:  52, y: -14, size: 2, anim: 'driftE',  dur: 3.7, delay: 0.9 },
]

function StarDot({ s }) {
  return (
    <div style={{ position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
      <div style={{ animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`, color: 'var(--text-primary)' }}>
        <svg width={s.size} height={s.size} viewBox="-1 -1 2 2">
          <path d="M0 -1 L0.25 -0.25 L1 0 L0.25 0.25 L0 1 L-0.25 0.25 L-1 0 L-0.25 -0.25Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}

function OnboardingStepWelcome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150, marginBottom: 20, flexShrink: 0 }}>
        {ONBOARDING_STARS.map((s, i) => <StarDot key={i} s={s} />)}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ animation: 'senseiTravel 7s linear infinite' }}>
            <div className="sensei-blink" style={{ color: 'var(--logo-color)', animation: 'senseiGlow 7s linear infinite' }}>
              <SenseiLogo width={72} height={72} />
            </div>
          </div>
        </div>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', textAlign: 'center', letterSpacing: '-0.3px' }}>
        Benvenuto in Sensei
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, textAlign: 'center', lineHeight: 1.65, maxWidth: 320 }}>
        La tua piattaforma di apprendimento personale.<br />
        Artifact interattivi generati con Claude AI, su misura per te.
      </p>
    </div>
  )
}

function SentieriSlideSteps() {
  const steps = [
    { label: 'Introduzione ai concetti', done: true },
    { label: 'Esercizi pratici guidati', done: true },
    { label: 'Progetto finale', active: true },
    { label: 'Quiz e riepilogo', done: false },
  ]
  return (
    <div style={{ width: '100%', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < steps.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, flexShrink: 0, background: s.done ? '#378ADD' : s.active ? 'transparent' : 'var(--bg-tertiary)', border: s.active ? '1.5px solid #378ADD' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {s.done && <Check size={11} color="#fff" strokeWidth={3} />}
            {s.active && <div style={{ width: 7, height: 7, borderRadius: 4, background: '#378ADD' }} />}
          </div>
          <span style={{ fontSize: 12, color: s.done ? 'var(--text-tertiary)' : s.active ? 'var(--text-primary)' : 'var(--text-tertiary)', textDecoration: s.done ? 'line-through' : 'none', fontWeight: s.active ? 500 : 400 }}>
            {s.label}
          </span>
          {s.active && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#378ADD', fontWeight: 500 }}>in corso</span>}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
          <div style={{ width: '50%', height: '100%', background: '#378ADD', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>2 / 4 step</span>
      </div>
    </div>
  )
}

function SentieriSlideXP() {
  const [xp, setXp] = useState(0)
  useEffect(() => {
    const target = 120, frames = 45
    let frame = 0
    const t = setInterval(() => {
      frame++
      setXp(Math.round((frame / frames) * target))
      if (frame >= frames) clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 46, fontWeight: 800, color: '#378ADD', lineHeight: 1, letterSpacing: '-2px' }}>{xp}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>XP guadagnati</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { val: '7', label: '🔥 Streak' },
          { val: '3',  label: 'Sentieri' },
          { val: '12', label: 'Step fatti' },
        ].map(({ val, label }) => (
          <div key={label} style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Livello 2</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{xp} / 200 XP</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
          <div style={{ width: `${(xp / 200) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #378ADD, #7F77DD)', borderRadius: 3, transition: 'width 0.02s linear' }} />
        </div>
      </div>
    </div>
  )
}

function OnboardingStepSentieri() {
  const [slide, setSlide]       = useState(0)
  const [slideOp, setSlideOp]   = useState(1)
  const timerRef                = useRef(null)

  const goSlide = (next) => {
    setSlideOp(0)
    setTimeout(() => { setSlide(next); setSlideOp(1) }, 160)
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => goSlide((slide + 1) % 2), 3200)
    return () => clearTimeout(timerRef.current)
  }, [slide])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#378ADD18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Route size={22} color="#378ADD" />
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px', textAlign: 'center' }}>Sentieri di apprendimento</h2>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', textAlign: 'center', lineHeight: 1.6 }}>
        {slide === 0 ? 'Percorsi step-by-step con progressi tracciati in tempo reale.' : 'Guadagna XP completando step e costruisci la tua streak.'}
      </p>
      <div style={{ opacity: slideOp, transition: 'opacity 0.16s ease', width: '100%', minHeight: 148 }}>
        {slide === 0 ? <SentieriSlideSteps /> : <SentieriSlideXP />}
      </div>
    </div>
  )
}

function OnboardingStepLeaflet() {
  const cards = [
    {
      title: 'React Hooks',
      color: '#378ADD',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {['useState', 'useEffect', 'useRef'].map(h => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: '#378ADD', flexShrink: 0 }} />
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{h}</div>
            </div>
          ))}
          <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: '#378ADD18', color: '#378ADD' }}>hook</div>
            <div style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: '#378ADD18', color: '#378ADD' }}>react</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Git Cheatsheet',
      color: '#1D9E75',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['git commit -m', 'git push origin', 'git pull --rebase'].map(cmd => (
            <div key={cmd} style={{ fontSize: 8, padding: '3px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd}</div>
          ))}
        </div>
      ),
    },
    {
      title: 'CSS Grid',
      color: '#7F77DD',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {['#7F77DD44','#7F77DD22','#7F77DD33','#7F77DD22'].map((bg, i) => (
              <div key={i} style={{ height: 16, borderRadius: 4, background: bg }} />
            ))}
          </div>
          <div style={{ height: 14, borderRadius: 4, background: '#7F77DD22' }} />
          <div style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: '#7F77DD18', color: '#7F77DD', alignSelf: 'flex-start' }}>layout</div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1D9E7518', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <BookOpen size={22} color="#1D9E75" />
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px', textAlign: 'center' }}>Leaflet interattivi</h2>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', textAlign: 'center', lineHeight: 1.6 }}>
        Documenti ricchi e consultabili al volo. Cheat sheet, reference e appunti visivi.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%' }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderTop: `2px solid ${card.color}`, borderRadius: 'var(--radius-md)', padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: card.color }}>{card.title}</div>
            {card.body}
          </div>
        ))}
      </div>
    </div>
  )
}

function OnboardingStepStart({ onImport, onDismiss }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#7F77DD18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Sparkles size={22} color="#7F77DD" />
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', textAlign: 'center' }}>Pronto per iniziare?</h2>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 22px', textAlign: 'center', lineHeight: 1.6 }}>
        Importa un artifact JSX esistente oppure creane uno nuovo direttamente con Claude AI dalla sezione Crea.
      </p>
      <button
        onClick={onImport}
        autoFocus
        style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500, color: '#fff', background: '#378ADD', border: 'none', borderRadius: 'var(--radius-md)', marginBottom: 8, transition: 'opacity 0.15s', cursor: 'pointer' }}
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
        Esplora da solo
      </button>
    </div>
  )
}

const TOTAL_ONBOARDING = 4

function WelcomeDialog({ onDismiss, onImport }) {
  const [step, setStep]       = useState(0)
  const [opacity, setOpacity] = useState(1)
  const isLast = step === TOTAL_ONBOARDING - 1

  const goTo = (next) => {
    setOpacity(0)
    setTimeout(() => { setStep(next); setOpacity(1) }, 160)
  }

  const handleNext = () => { if (!isLast) goTo(step + 1) }

  useEffect(() => {
    const handle = (e) => { if (e.key === 'ArrowRight' && !isLast) handleNext() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [step])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 36px 28px', width: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>

        {/* Contenuto animato */}
        <div style={{ opacity, transition: 'opacity 0.16s ease', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 310 }}>
          {step === 0 && <OnboardingStepWelcome />}
          {step === 1 && <OnboardingStepSentieri />}
          {step === 2 && <OnboardingStepLeaflet />}
          {step === 3 && <OnboardingStepStart onImport={onImport} onDismiss={onDismiss} />}
        </div>

        {/* Dot indicator */}
        <div style={{ display: 'flex', gap: 6, marginTop: 20, alignItems: 'center' }}>
          {Array.from({ length: TOTAL_ONBOARDING }, (_, i) => (
            <div key={i} onClick={() => goTo(i)}
              style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? '#378ADD' : 'var(--border)', transition: 'all 0.22s ease', cursor: 'pointer' }}
            />
          ))}
        </div>

        {/* Bottoni navigazione */}
        {!isLast && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16, width: '100%' }}>
            <button
              onClick={handleNext}
              autoFocus={step === 0}
              style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500, color: '#fff', background: '#378ADD', border: 'none', borderRadius: 'var(--radius-md)', transition: 'opacity 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Avanti
            </button>
            <button
              onClick={onDismiss}
              style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              Salta
            </button>
          </div>
        )}

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
