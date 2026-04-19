import React, { useState } from 'react'

function Sidebar({ collapsed, onCollapse, onNavigate, currentView, courses, onImport, user, onOpenSettings }) {

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
          <div style={{
            width: 26, height: 26,
            borderRadius: 7,
            background: '#378ADD22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#378ADD',
          }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Sensei</span>
        </div>

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
      <div style={{ borderTop: '0.5px solid var(--border)', padding: '10px 8px', flexShrink: 0, position: 'relative' }}>

        {/* Menu contestuale */}
        {profileMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 8, right: 8,
            background: 'var(--bg-primary)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <button
              onClick={() => { setProfileMenuOpen(false); onOpenSettings() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px',
                fontSize: 13, color: 'var(--text-primary)',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <SettingsIcon />
              Impostazioni
            </button>
          </div>
        )}

        {/* Bottone profilo */}
        <div
          onClick={() => setProfileMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            background: profileMenuOpen ? 'var(--bg-tertiary)' : 'transparent',
          }}
          onMouseEnter={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
          onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7',
            overflow: 'hidden',
            border: '0.5px solid var(--border)',
          }}>
            {user?.avatar
              ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Utente'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
              {activeCourses.length} corsi attivi
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export default Sidebar