import React from 'react'

function Sidebar({ collapsed, onCollapse, onNavigate, currentView, courses, onImport }) {

  // Corsi in corso — hanno almeno un giorno completato ma non sono finiti
  const activeCourses = courses.filter(c => c.progress > 0 && c.progress < 100)

  return (
    <div style={{
      width: collapsed ? 0 : 'var(--sidebar-width)',
      minWidth: collapsed ? 0 : 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>

      {/* Top: logo + bottone chiudi */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Logo provvisorio */}
          <div style={{
            width: 26, height: 26,
            borderRadius: 7,
            background: '#378ADD22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#378ADD',
          }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Sensei</span>
        </div>

        {/* Bottone chiudi sidebar */}
        <button
          onClick={onCollapse}
          title="Chiudi barra laterale"
          style={{
            width: 28, height: 28,
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'background 0.15s',
          }}
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

      {/* Nav principale */}
      <div style={{ padding: '12px 8px 8px', flexShrink: 0 }}>
        <NavItem
          icon={<GridIcon />}
          label="I miei corsi"
          active={currentView === 'home'}
          onClick={() => onNavigate('home')}
        />
        <NavItem
          icon={<PlusIcon />}
          label="Importa corso"
          active={currentView === 'import'}
          onClick={onImport}
        />
        <NavItem
          icon={<LibraryIcon />}
          label="Libreria"
          disabled
          badge="presto"
        />
        <NavItem
          icon={<CreateIcon />}
          label="Crea"
          disabled
          badge="presto"
        />
      </div>

      {/* In corso */}
      <div style={{ padding: '8px 16px 6px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          In corso
        </span>
      </div>
      <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
        {activeCourses.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 10px' }}>
            Nessun corso attivo
          </p>
        )}
        {activeCourses.map(course => (
          <div
            key={course.id}
            onClick={() => onNavigate('course', course)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              marginBottom: 2,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: course.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {course.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{course.progress}%</span>
          </div>
        ))}
      </div>

      {/* Bottom: profilo utente */}
      <div style={{ borderTop: '0.5px solid var(--border)', padding: '10px 8px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7',
          }}>FR</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              lonelyfrank
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
              {activeCourses.length} corsi attivi
            </p>
          </div>
          {/* Impostazioni */}
          <button
            title="Impostazioni"
            style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

    </div>
  )
}

/* Componente NavItem riutilizzabile */
function NavItem({ icon, label, active, onClick, disabled, badge }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px',
        borderRadius: 'var(--radius-md)',
        marginBottom: 2,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: active ? 'var(--bg-primary)' : 'transparent',
        border: active ? '0.5px solid var(--border)' : '0.5px solid transparent',
        transition: 'background 0.15s',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
      <span style={{ fontSize: 13 }}>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: 10,
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          padding: '1px 6px', borderRadius: 10,
        }}>{badge}</span>
      )}
    </div>
  )
}

/* Icone SVG */
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function LibraryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}
function CreateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 12V4a1 1 0 011-1h10a1 1 0 011 1v8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default Sidebar