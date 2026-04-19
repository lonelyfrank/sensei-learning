import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Course from './pages/Course.jsx'
import Settings from './pages/Settings.jsx'

const COURSE_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#D4537E', '#BA7517', '#639922', '#E24B4A',
]

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [user, setUser] = useState({ name: 'Utente', avatar: null })

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
        const total = progress.length || 1
        return {
          ...course,
          color: COURSE_COLORS[index % COURSE_COLORS.length],
          progress: Math.round((completed / total) * 100),
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
  }

  const handleImport = async () => {
    const result = await window.sensei.openFileDialog()
    if (result.canceled) return
    await window.sensei.importCourse(result.filePaths[0])
    loadCourses()
  }

  const handleRemove = async (course) => {
    await window.sensei.removeCourse(course.id, course.filename)
    loadCourses()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        courses={courses}
        onImport={handleImport}
        user={user}
        onOpenSettings={() => handleNavigate('settings')}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Bottone riapri sidebar */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Apri barra laterale"
            style={{
              position: 'absolute',
              top: 12, left: 12,
              width: 28, height: 28,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '0.5px solid var(--border)',
              zIndex: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" opacity="0.4"/>
              <rect x="2" y="2" width="6" height="16" rx="3" fill="currentColor" opacity="0.15"/>
              <path d="M8 7l2.5 3L8 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            </svg>
          </button>
        )}

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

      </div>
    </div>
  )
}

export default App