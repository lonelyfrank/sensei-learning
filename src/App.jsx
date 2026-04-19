import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Course from './pages/Course.jsx'
import Settings from './pages/Settings.jsx'
import IconPicker from './components/IconPicker.jsx'
import TitleBar from './components/TitleBar.jsx'
import Progress from './pages/Progress.jsx'
import CreateHub from './pages/CreateHub.jsx'
import Create from './pages/Create.jsx'

const COURSE_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#639922', '#E24B4A',
]

function formatCourseName(id) {
  return id
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [currentCreateMode, setCurrentCreateMode] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [user, setUser] = useState({ name: 'Utente', avatar: null })
  const [importDialog, setImportDialog] = useState(null)

  useEffect(() => {
    loadCourses()
    loadUser()
  }, [])

  const loadUser = async () => {
    const result = await window.sensei.getUser()
    if (result) setUser(result)
  }

  const loadCourses = async () => {
    const result = await window.sensei.getCourses()
    const coursesWithProgress = await Promise.all(
      result.map(async (course, index) => {
        const progress = await window.sensei.getProgress(course.id)
        const completed = progress.filter(p => p.completed).length
        const total = course.total_days || 1
        return {
          ...course,
          color: course.color || COURSE_COLORS[index % COURSE_COLORS.length],
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedDays: completed,
          totalDays: total,
        }
      })
    )
    setCourses(coursesWithProgress)
  }

  const handleNavigate = (view, course = null) => {
    setCurrentView(view)
    setSelectedCourse(course)
    setCurrentCreateMode(null)
  }

  const handleImport = async () => {
    const result = await window.sensei.openFileDialog()
    if (result.canceled) return
    const filePath = result.filePaths[0]
    const filename = filePath.split('/').pop()
    const courseId = filename.replace('.jsx', '')
    const suggestedName = formatCourseName(courseId)
    setImportDialog({ filePath, suggestedName, icon: 'BookOpen', color: '#378ADD' })
  }

  const handleImportConfirm = async (filePath, name, icon, color) => {
    await window.sensei.importCourse(filePath, name, icon, color)
    setImportDialog(null)
    loadCourses()
  }

  const handleRemove = async (course) => {
    await window.sensei.removeCourse(course.id, course.filename)
    loadCourses()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      <TitleBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

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

          {/* Topbar quando sidebar chiusa */}
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

          {/* ── VISTE ── */}

          {currentView === 'home' && (
            <Home
              courses={courses}
              onSelectCourse={(course) => handleNavigate('course', course)}
              onImport={handleImport}
              onRemove={handleRemove}
            />
          )}

          {currentView === 'course' && selectedCourse && (
            <Course
              course={selectedCourse}
              onBack={() => handleNavigate('home')}
              onProgressUpdate={loadCourses}
            />
          )}

          {currentView === 'settings' && (
            <Settings
              onBack={() => handleNavigate('home')}
              onSave={loadUser}
            />
          )}

          {currentView === 'progress' && (
            <Progress
              onBack={() => handleNavigate('home')}
              courses={courses}
            />
          )}

          {/* ── CREATE HUB — landing page modalità creazione ── */}
          {currentView === 'create' && !currentCreateMode && (
            <CreateHub
              onBack={() => handleNavigate('home')}
              onSelectMode={mode => setCurrentCreateMode(mode)}
              onImport={handleImport}
            />
          )}

          {/* ── CREATE AI — generatore prompt ── */}
          {currentView === 'create' && currentCreateMode === 'ai' && (
            <Create
              onBack={() => setCurrentCreateMode(null)}
            />
          )}

        </div>
      </div>

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

function ImportDialog({ suggestedName, filePath, defaultIcon, defaultColor, onConfirm, onCancel }) {
  const [name, setName] = useState(suggestedName)
  const [icon, setIcon] = useState(defaultIcon)
  const [color, setColor] = useState(defaultColor)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>Importa corso</h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>Personalizza il corso prima di importarlo.</p>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome corso</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(filePath, name, icon, color) }}
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', marginBottom: 20 }}
        />

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Icona e colore</label>
        <IconPicker selectedIcon={icon} selectedColor={color} onSelectIcon={setIcon} onSelectColor={setColor} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onCancel} style={{ padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Annulla</button>
          <button onClick={() => onConfirm(filePath, name, icon, color)} style={{ padding: '7px 16px', fontSize: 13, color: '#fff', background: color, border: 'none', borderRadius: 'var(--radius-md)', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Importa</button>
        </div>
      </div>
    </div>
  )
}

export default App