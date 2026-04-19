import React, { useState } from 'react'
import NavItem from './NavItem.jsx'
import { ICONS, GridIcon, PlusIcon, LibraryIcon, CreateIcon, SettingsIcon, ProgressIcon, HelpIcon } from './icons.jsx'

function Sidebar({ collapsed, onCollapse, onNavigate, currentView, courses, onImport, user, onOpenSettings, onOpenProgress }) {

  const activeCourses = courses.filter(c => c.progress > 0 && c.progress < 100)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{
      width: collapsed ? 0 : 'var(--sidebar-width)',
      minWidth: collapsed ? 0 : 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>

      {/* ── TOP: Logo + bottone chiudi ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/sensei-logo.png"
            style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 6 }}
            alt="Sensei"
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Sensei</span>
        </div>
        <button
          onClick={onCollapse}
          title="Chiudi barra laterale"
          style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" opacity="0.4"/>
            <rect x="2" y="2" width="6" height="16" rx="3" fill="currentColor" opacity="0.15"/>
            <path d="M8 7l-2.5 3L8 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
          </svg>
        </button>
      </div>

      {/* ── NAV PRINCIPALE ── */}
      <div style={{ padding: '12px 8px 8px', flexShrink: 0 }}>
        <NavItem icon={<GridIcon />} label="I miei sentieri" active={currentView === 'home'} onClick={() => onNavigate('home')} />
        <NavItem icon={<PlusIcon />} label="Importa" onClick={onImport} />
        <NavItem icon={<CreateIcon />} label="Crea" onClick={() => onNavigate('create')} />
        <NavItem icon={<LibraryIcon />} label="Libreria" disabled badge="presto" />
      </div>

      {/* ── IN CORSO ── */}
      <div style={{ padding: '8px 16px 6px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In corso</span>
      </div>

      <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
        {activeCourses.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 10px' }}>Nessun sentiero attivo</p>
        )}
        {activeCourses.map(course => {
          const Icon = course.icon ? ICONS[course.icon] : null
          return (
            <div
              key={course.id}
              onClick={() => onNavigate('course', course)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 20, height: 20, borderRadius: 5, background: course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Icon
                  ? <Icon size={12} color={course.color} />
                  : <div style={{ width: 8, height: 8, borderRadius: 2, background: course.color }} />
                }
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {course.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{course.progress}%</span>
            </div>
          )
        })}
      </div>

      {/* ── BOTTOM: Profilo + menu ── */}
      <div style={{ borderTop: '0.5px solid var(--border)', padding: '10px 8px', flexShrink: 0, position: 'relative' }}>

        {profileMenuOpen && (
          <div style={{ position: 'absolute', bottom: '100%', left: 8, right: 8, background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <MenuButton icon={<ProgressIcon />} label="Progressi" onClick={() => { setProfileMenuOpen(false); onOpenProgress() }} />
            <MenuButton icon={<SettingsIcon />} label="Impostazioni" onClick={() => { setProfileMenuOpen(false); onOpenSettings() }} />
            <div style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
            <MenuButton icon={<HelpIcon />} label="Aiuto" onClick={() => { setProfileMenuOpen(false); window.sensei.openExternal('https://github.com/lonelyfrank/sensei-learning') }} />
          </div>
        )}

        <div
          onClick={() => setProfileMenuOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: profileMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
          onMouseEnter={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
          onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
            {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Utente'}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>{activeCourses.length} sentieri attivi</p>
          </div>
        </div>
      </div>

    </div>
  )
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label}
    </button>
  )
}

export default Sidebar