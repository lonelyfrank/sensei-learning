import React, { useState } from 'react'
import { ICONS } from '../components/icons.jsx'

const FILTERS = ['Tutti', 'In corso', 'Non iniziati']

function Home({ courses, onSelectCourse, onImport, onRemove }) {
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('Tutti')

  const inProgress = courses
    .filter(c => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)

  const completed = courses.filter(c => c.progress === 100)

  const allFiltered = courses.filter(c => {
    if (filter === 'In corso') return c.progress > 0 && c.progress < 100
    if (filter === 'Non iniziati') return c.progress === 0
    return true
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>I miei sentieri</h1>
        <div style={{ display: 'flex', gap: 4, border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 3 }}>
          <ViewButton active={view === 'grid'} onClick={() => setView('grid')}><GridIcon /></ViewButton>
          <ViewButton active={view === 'list'} onClick={() => setView('list')}><ListIcon /></ViewButton>
        </div>
      </div>

      {/* In corso */}
      {inProgress.length > 0 && (
        <Section title="In corso">
          <CourseGrid view={view}>
            {inProgress.map(course => (
              <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} />
            ))}
          </CourseGrid>
        </Section>
      )}

      {/* Divisore tra "In corso" e "Tutti i sentieri" */}
      {inProgress.length > 0 && (
        <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: 28 }} />
      )}

      {/* Tutti i sentieri */}
      <Section
        title="Tutti i sentieri"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
          </div>
        }
      >
        <CourseGrid view={view}>
          {allFiltered.map(course => (
            <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} />
          ))}
          <ImportCard view={view} onClick={onImport} />
        </CourseGrid>
      </Section>

      {/* Completati */}
      {completed.length > 0 && (
        <Section title="Completati">
          <CourseGrid view={view}>
            {completed.map(course => (
              <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} isCompleted />
            ))}
          </CourseGrid>
        </Section>
      )}

      {/* Stato vuoto */}
      {courses.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: 15 }}>Nessun sentiero caricato.</p>
          <button onClick={onImport} style={{ fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 16px' }}>
            + Importa il tuo primo sentiero
          </button>
        </div>
      )}

    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function CourseGrid({ view, children }) {
  if (view === 'list') return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>{children}</div>
}

function CourseCard({ course, view, onClick, isCompleted, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = React.useRef(null)

  React.useEffect(() => {
    if (!menuOpen) return
    const handle = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  // Renderizza icona sentiero — usa quella salvata o fallback SVG
  const CourseIconEl = () => {
    if (isCompleted) return <CheckIcon color="#1D9E75" />
    if (course.icon && ICONS[course.icon]) {
      const Icon = ICONS[course.icon]
      return <Icon size={view === 'list' ? 14 : 18} color={course.color} />
    }
    return <CourseIconFallback color={course.color} />
  }

  if (view === 'list') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)', background: hovered ? 'var(--bg-secondary)' : 'var(--bg-primary)', cursor: 'pointer', transition: 'background 0.15s', opacity: isCompleted ? 0.7 : 1, position: 'relative' }}
      >
        <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          {/* Icona in vista lista */}
          <div style={{ width: 28, height: 28, borderRadius: 6, background: isCompleted ? '#1D9E7522' : course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CourseIconEl />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{course.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{isCompleted ? 'Completato' : `${course.completedDays} / ${course.totalDays} giorni`}</span>
          <div style={{ width: 80, height: 3, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
            <div style={{ width: `${course.progress}%`, height: '100%', background: isCompleted ? '#1D9E75' : course.color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: course.color, minWidth: 32, textAlign: 'right' }}>{course.progress}%</span>
        </div>
        <ContextMenu visible={hovered} open={menuOpen} onToggle={() => setMenuOpen(o => !o)} onRemove={() => { setMenuOpen(false); onRemove(course) }} menuRef={menuRef} />
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{ background: isCompleted ? 'var(--bg-secondary)' : hovered ? 'var(--bg-secondary)' : 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, cursor: 'pointer', transition: 'background 0.15s', opacity: isCompleted ? 0.75 : 1, position: 'relative' }}
    >
      <ContextMenu visible={hovered} open={menuOpen} onToggle={() => setMenuOpen(o => !o)} onRemove={() => { setMenuOpen(false); onRemove(course) }} menuRef={menuRef} />

      <div onClick={onClick}>
        {/* Icona in vista griglia */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: isCompleted ? '#1D9E7522' : course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <CourseIconEl />
        </div>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{course.name}</p>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: isCompleted ? '#1D9E75' : 'var(--text-tertiary)' }}>
          {isCompleted ? 'Completato' : `${course.completedDays} / ${course.totalDays} giorni`}
        </p>
        <div style={{ height: 3, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
          <div style={{ width: `${course.progress}%`, height: '100%', background: isCompleted ? '#1D9E75' : course.color, borderRadius: 2 }} />
        </div>
        {!isCompleted && <p style={{ margin: '6px 0 0', fontSize: 11, color: course.color, textAlign: 'right' }}>{course.progress}%</p>}
      </div>
    </div>
  )
}

function ContextMenu({ visible, open, onToggle, onRemove, menuRef }) {
  return (
    <div ref={menuRef} style={{ position: 'absolute', top: 10, right: 10, opacity: visible || open ? 1 : 0, transition: 'opacity 0.15s', zIndex: 10 }}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, letterSpacing: 1 }}
      >···</button>
      {open && (
        <div style={{ position: 'absolute', top: 28, right: 0, background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 140, overflow: 'hidden', zIndex: 20 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', fontSize: 13, color: '#E24B4A', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <TrashIcon /> Elimina sentiero
          </button>
        </div>
      )}
    </div>
  )
}

function ImportCard({ view, onClick }) {
  const [hovered, setHovered] = useState(false)
  if (view === 'list') {
    return (
      <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '0.5px dashed var(--border)', cursor: 'pointer', opacity: hovered ? 0.8 : 0.5, transition: 'opacity 0.15s' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>+ Importa sentiero</span>
      </div>
    )
  }
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ border: '0.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 110, opacity: hovered ? 0.8 : 0.5, transition: 'opacity 0.15s' }}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Importa</span>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <span onClick={onClick} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, cursor: 'pointer', border: active ? '0.5px solid #378ADD' : '0.5px solid var(--border)', color: active ? '#378ADD' : 'var(--text-tertiary)', background: active ? '#378ADD11' : 'transparent', transition: 'all 0.15s' }}>
      {label}
    </span>
  )
}

function ViewButton({ active, onClick, children }) {
  return (
    <div onClick={onClick} style={{ padding: '4px 8px', borderRadius: 5, cursor: 'pointer', background: active ? 'var(--bg-secondary)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}

// Icona fallback quando il sentiero non ha un'icona personalizzata
function CourseIconFallback({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M4 6h8M4 9h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default Home