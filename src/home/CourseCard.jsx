import React, { useState } from 'react'
import { ICONS } from '../components/icons.jsx'
import { CourseIconFallback, CheckIcon, TrashIcon } from './homeIcons.jsx'

/* Card singola artifact — griglia o lista */
function CourseCard({ course, view, onClick, isCompleted, onRemove, isLeaflet, showTypeBadge }) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = React.useRef(null)

  React.useEffect(() => {
    if (!menuOpen) return
    const handle = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

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
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          border: '0.5px solid var(--border)',
          background: hovered ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          cursor: 'pointer', transition: 'background 0.15s',
          opacity: isCompleted ? 0.7 : 1, position: 'relative',
        }}
      >
        <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: isCompleted ? '#1D9E7522' : course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CourseIconEl />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{course.name}</span>

          {showTypeBadge && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {course.type === 'leaflet' ? 'leaflet' : 'sentiero'}
            </span>
          )}

          {!isLeaflet && (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {isCompleted ? 'Completato' : `${course.completedDays} / ${course.totalDays} step`}
              </span>
              <div style={{ width: 80, height: 3, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                <div style={{ width: `${course.progress}%`, height: '100%', background: isCompleted ? '#1D9E75' : course.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: course.color, minWidth: 32, textAlign: 'right' }}>{course.progress}%</span>
            </>
          )}
        </div>
        <ContextMenu visible={hovered} open={menuOpen} onToggle={() => setMenuOpen(o => !o)} onRemove={() => { setMenuOpen(false); onRemove(course) }} menuRef={menuRef} isLeaflet={isLeaflet} />
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: isCompleted ? 'var(--bg-secondary)' : hovered ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: 16, cursor: 'pointer', transition: 'background 0.15s',
        opacity: isCompleted ? 0.75 : 1, position: 'relative',
      }}
    >
      <ContextMenu visible={hovered} open={menuOpen} onToggle={() => setMenuOpen(o => !o)} onRemove={() => { setMenuOpen(false); onRemove(course) }} menuRef={menuRef} isLeaflet={isLeaflet} />

      <div onClick={onClick}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: isCompleted ? '#1D9E7522' : course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <CourseIconEl />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{course.name}</p>
          {showTypeBadge && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {course.type === 'leaflet' ? 'leaflet' : 'sentiero'}
            </span>
          )}
        </div>

        {!isLeaflet ? (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: isCompleted ? '#1D9E75' : 'var(--text-tertiary)' }}>
              {isCompleted ? 'Completato' : `${course.completedDays} / ${course.totalDays} step`}
            </p>
            <div style={{ height: 3, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
              <div style={{ width: `${course.progress}%`, height: '100%', background: isCompleted ? '#1D9E75' : course.color, borderRadius: 2 }} />
            </div>
            {!isCompleted && <p style={{ margin: '6px 0 0', fontSize: 11, color: course.color, textAlign: 'right' }}>{course.progress}%</p>}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {course.progress > 0 ? 'Aperto' : 'Non ancora aperto'}
          </p>
        )}
      </div>
    </div>
  )
}

/* Menu contestuale con opzione elimina */
function ContextMenu({ visible, open, onToggle, onRemove, menuRef, isLeaflet }) {
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
            <TrashIcon /> Elimina {isLeaflet ? 'leaflet' : 'sentiero'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CourseCard