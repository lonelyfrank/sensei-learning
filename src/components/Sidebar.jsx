import React, { useState, useRef, useEffect, useCallback } from 'react'
import NavItem from './NavItem.jsx'
import { ICONS, GridIcon, PlusIcon, LibraryIcon, CreateIcon, SettingsIcon, ProgressIcon, HelpIcon } from './icons.jsx'
import SenseiLogo from '../assets/sensei-logo.svg?react'

// ── Costanti effetto bulge ──
const BULGE_RADIUS = 18
const BULGE_HEIGHT = 65
const TRIGGER_ZONE = 40
const LERP_SPEED = 0.10
const SIDEBAR_WIDTH_EXPANDED = 220
const SIDEBAR_WIDTH_COLLAPSED = 52

function lerp(a, b, t) { return a + (b - a) * t }

function buildBulgePath(y, radius, height, sidebarWidth) {
  const x = sidebarWidth
  const top = y - height
  const bot = y + height
  const cp = height * 0.6
  return `
    M ${x} ${top}
    C ${x} ${top + cp}, ${x + radius} ${y - cp * 0.4}, ${x + radius} ${y}
    C ${x + radius} ${y + cp * 0.4}, ${x} ${bot - cp}, ${x} ${bot}
    Z
  `
}

/* Effetto bulge sul bordo destro della sidebar
   disabled=true quando un artifact è aperto nell'iframe — il mouse
   entra nel contesto dell'iframe e il window principale non riceve
   più eventi mousemove, lasciando la bulge bloccata */
function SidebarBulge({ sidebarWidth, collapsed, onToggle, disabled }) {
  const stateRef = useRef({ mouseY: 0, currentY: 300, currentRadius: 0, targetRadius: 0, rafId: null })
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const circleGroupRef = useRef(null)

  const animate = useCallback(() => {
    const s = stateRef.current
    s.currentY = lerp(s.currentY, s.mouseY, LERP_SPEED)
    s.currentRadius = lerp(s.currentRadius, s.targetRadius, LERP_SPEED)

    if (pathRef.current) {
      pathRef.current.setAttribute('d', buildBulgePath(s.currentY, s.currentRadius, BULGE_HEIGHT, sidebarWidth))
    }
    if (circleGroupRef.current) {
      const opacity = Math.min(s.currentRadius / BULGE_RADIUS, 1)
      const cx = sidebarWidth + s.currentRadius * 0.75
      circleGroupRef.current.setAttribute('transform', `translate(${cx}, ${s.currentY})`)
      circleGroupRef.current.style.opacity = opacity
    }

    s.rafId = requestAnimationFrame(animate)
  }, [sidebarWidth])

  useEffect(() => {
    const s = stateRef.current
    s.rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(s.rafId)
  }, [animate])

  useEffect(() => {
    const handleMouseMove = (e) => {
      const s = stateRef.current
      // Se disabilitato (iframe aperto) azzera subito e non aggiornare
      if (disabled) {
        s.targetRadius = 0
        return
      }
      const distFromEdge = Math.abs(e.clientX - sidebarWidth)
      s.mouseY = e.clientY - 40
      if (distFromEdge < TRIGGER_ZONE && e.clientX >= sidebarWidth - 10) {
        const proximity = 1 - (distFromEdge / TRIGGER_ZONE)
        s.targetRadius = BULGE_RADIUS * proximity
      } else {
        s.targetRadius = 0
      }
    }
    const handleMouseLeave = () => { stateRef.current.targetRadius = 0 }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [sidebarWidth, disabled])

  // Quando disabled cambia a true, forza subito targetRadius a 0
  useEffect(() => {
    if (disabled) stateRef.current.targetRadius = 0
  }, [disabled])

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed', left: 0, top: 40,
        width: sidebarWidth + BULGE_RADIUS + 20,
        height: 'calc(100vh - 40px)',
        pointerEvents: 'none', zIndex: 40, overflow: 'visible',
      }}
    >
      <path
        ref={pathRef}
        d={buildBulgePath(300, 0, BULGE_HEIGHT, sidebarWidth)}
        fill="var(--bg-secondary)"
      />
      <g
        ref={circleGroupRef}
        style={{ pointerEvents: 'auto', cursor: 'pointer', opacity: 0, transition: 'opacity 0.1s' }}
        onClick={onToggle}
      >
        <circle r="11" fill="var(--bg-tertiary)" stroke="var(--border)" strokeWidth="0.5" />
        {collapsed ? (
          <path d="M-2 -3.5l3.5 3.5-3.5 3.5" stroke="var(--text-tertiary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        ) : (
          <path d="M2 -3.5L-1.5 0 2 3.5" stroke="var(--text-tertiary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        )}
      </g>
    </svg>
  )
}

function Sidebar({ collapsed, onCollapse, onExpand, onNavigate, currentView, courses, onImport, user, onOpenSettings, onOpenProgress }) {

  const activeSentieri = courses.filter(c => (c.type === 'sentiero' || !c.type) && c.progress > 0 && c.progress < 100)
  const activeLeaflet = courses.filter(c => c.type === 'leaflet' && c.progress > 0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [menuY, setMenuY] = useState(0)
  const menuButtonRef = useRef(null)

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleMenuToggle = () => {
    if (!profileMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuY(rect.top)
    }
    setProfileMenuOpen(o => !o)
  }

  return (
    <>
      <div style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: 'none',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        flexShrink: 0,
      }}>

        {/* ── TOP: Logo Sensei ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '12px 0' : '12px 14px',
          borderBottom: '0.5px solid var(--border)', flexShrink: 0,
          gap: 8,
        }}>
          <SenseiLogo style={{ width: 38, height: 38, color: 'var(--logo-color)', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Sensei
            </span>
          )}
        </div>

        {/* ── NAV PRINCIPALE ── */}
        <div style={{ padding: collapsed ? '12px 0' : '12px 8px 8px', flexShrink: 0 }}>
          <NavItem collapsed={collapsed} icon={<GridIcon />} label="I miei sentieri" active={currentView === 'home'} onClick={() => onNavigate('home')} />
          <NavItem collapsed={collapsed} icon={<PlusIcon />} label="Importa" onClick={onImport} />
          <NavItem collapsed={collapsed} icon={<CreateIcon />} label="Crea" onClick={() => onNavigate('create')} />
          <NavItem collapsed={collapsed} icon={<LibraryIcon />} label="Libreria" disabled badge="presto" />
        </div>

        {/* ── IN CORSO — solo sentieri — nascosto quando collassato ── */}
        {!collapsed && (
          <>
            <div style={{ padding: '8px 16px 6px', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In corso</span>
            </div>
            <div style={{ padding: '0 8px', flexShrink: 0 }}>
              {activeSentieri.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 10px' }}>Nessun sentiero attivo</p>
              )}
              {activeSentieri.map(course => (
                <ArtifactRow key={course.id} course={course} onNavigate={onNavigate} />
              ))}
            </div>

            {/* ── LEAFLET ATTIVI ── */}
            {activeLeaflet.length > 0 && (
              <>
                <div style={{ padding: '8px 16px 6px', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leaflet</span>
                </div>
                <div style={{ padding: '0 8px', flexShrink: 0 }}>
                  {activeLeaflet.map(course => (
                    <ArtifactRow key={course.id} course={course} onNavigate={onNavigate} showProgress={false} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Spacer scrollabile */}
        <div style={{ flex: 1, overflowY: 'auto' }} />

        {/* ── BOTTOM: Profilo + menu ── */}
        <div style={{ borderTop: '0.5px solid var(--border)', padding: collapsed ? '10px 0' : '10px 8px', flexShrink: 0, position: 'relative' }}>

          {/* Menu espanso */}
          {profileMenuOpen && !collapsed && (
            <div style={{ position: 'absolute', bottom: '100%', left: 8, right: 8, background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <MenuButton icon={<ProgressIcon />} label="Progressi" onClick={() => { setProfileMenuOpen(false); onOpenProgress() }} />
              <MenuButton icon={<SettingsIcon />} label="Impostazioni" onClick={() => { setProfileMenuOpen(false); onOpenSettings() }} />
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
              <MenuButton icon={<HelpIcon />} label="Aiuto" onClick={() => { setProfileMenuOpen(false); window.sensei.openExternal('https://github.com/lonelyfrank/sensei-learning') }} />
            </div>
          )}

          {/* Menu collassato — position fixed */}
          {profileMenuOpen && collapsed && (
            <div style={{
              position: 'fixed', left: 56, top: menuY,
              transform: 'translateY(-100%)',
              width: 180, background: 'var(--bg-primary)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000,
            }}>
              <MenuButton icon={<ProgressIcon />} label="Progressi" onClick={() => { setProfileMenuOpen(false); onOpenProgress() }} />
              <MenuButton icon={<SettingsIcon />} label="Impostazioni" onClick={() => { setProfileMenuOpen(false); onOpenSettings() }} />
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
              <MenuButton icon={<HelpIcon />} label="Aiuto" onClick={() => { setProfileMenuOpen(false); window.sensei.openExternal('https://github.com/lonelyfrank/sensei-learning') }} />
            </div>
          )}

          {/* Profilo espanso */}
          {!collapsed && (
            <div
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: profileMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
              onMouseEnter={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
                {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Utente'}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {activeSentieri.length} sentier{activeSentieri.length === 1 ? 'o' : 'i'} attiv{activeSentieri.length === 1 ? 'o' : 'i'}
                  {activeLeaflet.length > 0 && ` · ${activeLeaflet.length} leaflet`}
                </p>
              </div>
            </div>
          )}

          {/* Profilo collassato — solo avatar */}
          {collapsed && (
            <div ref={menuButtonRef} onClick={handleMenuToggle} style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7', overflow: 'hidden', border: '0.5px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
            </div>
          )}
        </div>
      </div>

      <SidebarBulge
        sidebarWidth={sidebarWidth}
        collapsed={collapsed}
        onToggle={() => collapsed ? onExpand() : onCollapse()}
      />
    </>
  )
}

function ArtifactRow({ course, onNavigate, showProgress = true }) {
  const Icon = course.icon ? ICONS[course.icon] : null
  return (
    <div
      onClick={() => onNavigate('course', course)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 2 }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 20, height: 20, borderRadius: 5, background: course.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {Icon ? <Icon size={12} color={course.color} /> : <div style={{ width: 8, height: 8, borderRadius: 2, background: course.color }} />}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {course.name}
      </span>
      {showProgress && (
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{course.progress}%</span>
      )}
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