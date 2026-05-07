import React, { useState, useRef, useEffect, useCallback } from 'react'
import NavItem from './NavItem.jsx'
import { ICONS, GridIcon, PlusIcon, LibraryIcon, CreateIcon, SettingsIcon, ProgressIcon, HelpIcon } from './icons.jsx'

// ── Costanti effetto bulge ──
const BULGE_RADIUS = 18
const BULGE_HEIGHT = 65
const TRIGGER_ZONE = 40
const LERP_SPEED = 0.10
const LERP_SPEED_WIDTH = 0.28  // più veloce per seguire la CSS transition da 0.2s
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

/* Effetto bulge sul bordo destro della sidebar */
function SidebarBulge({ sidebarWidth, collapsed, onToggle }) {
  const stateRef = useRef({
    mouseY: 0, currentY: 300, currentRadius: 0, targetRadius: 0,
    currentSidebarWidth: sidebarWidth, targetSidebarWidth: sidebarWidth,
    rafId: null,
  })
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const circleGroupRef = useRef(null)

  // Quando sidebarWidth cambia, aggiorna il target — il lerp del RAF fa il resto
  useEffect(() => {
    stateRef.current.targetSidebarWidth = sidebarWidth
  }, [sidebarWidth])

  const animate = useCallback(() => {
    const s = stateRef.current
    s.currentY = lerp(s.currentY, s.mouseY, LERP_SPEED)
    s.currentRadius = lerp(s.currentRadius, s.targetRadius, LERP_SPEED)
    s.currentSidebarWidth = lerp(s.currentSidebarWidth, s.targetSidebarWidth, LERP_SPEED_WIDTH)

    const sw = s.currentSidebarWidth

    if (pathRef.current) {
      pathRef.current.setAttribute('d', buildBulgePath(s.currentY, s.currentRadius, BULGE_HEIGHT, sw))
    }
    if (circleGroupRef.current) {
      const opacity = Math.min(s.currentRadius / BULGE_RADIUS, 1)
      const cx = sw + s.currentRadius * 0.75
      circleGroupRef.current.setAttribute('transform', `translate(${cx}, ${s.currentY})`)
      circleGroupRef.current.style.opacity = opacity
    }
    if (svgRef.current) {
      svgRef.current.style.width = `${sw + BULGE_RADIUS + 20}px`
    }

    s.rafId = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const s = stateRef.current
    s.rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(s.rafId)
  }, [animate])

  useEffect(() => {
    const handleMouseMove = (e) => {
      const s = stateRef.current
      const distFromEdge = Math.abs(e.clientX - s.currentSidebarWidth)
      s.mouseY = e.clientY - 40
      if (distFromEdge < TRIGGER_ZONE && e.clientX >= s.currentSidebarWidth - 10) {
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
  }, [])

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
  const expandedMenuRef = useRef(null)   // profilo espanso
  const collapsedMenuRef = useRef(null)  // profilo collassato — usato per menuY
  const timerRef = useRef(null)

  // contentCollapsed guida la visibilità dei contenuti con il timing corretto:
  // — collapse: ritardato di 210ms (aspetta che la CSS width transition finisca)
  // — expand: immediato (i label appaiono mentre la sidebar cresce, clippati da overflow)
  const [contentCollapsed, setContentCollapsed] = useState(collapsed)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (collapsed) {
      timerRef.current = setTimeout(() => setContentCollapsed(true), 210)
    } else {
      setContentCollapsed(false)
    }
    // Chiude il menu profilo ad ogni cambio di stato
    setProfileMenuOpen(false)
    return () => clearTimeout(timerRef.current)
  }, [collapsed])

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleMenuToggle = () => {
    if (!profileMenuOpen) {
      const ref = contentCollapsed ? collapsedMenuRef : expandedMenuRef
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        setMenuY(rect.top)
      }
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

        {/* ── NAV PRINCIPALE ── */}
        <div style={{ padding: '12px 8px 8px', flexShrink: 0 }}>
          <NavItem collapsed={contentCollapsed} labelNow={collapsed} icon={<GridIcon />} label="I miei sentieri" active={currentView === 'home'} onClick={() => onNavigate('home')} />
          <NavItem collapsed={contentCollapsed} labelNow={collapsed} icon={<PlusIcon />} label="Importa" onClick={onImport} />
          <NavItem collapsed={contentCollapsed} labelNow={collapsed} icon={<CreateIcon />} label="Crea" onClick={() => onNavigate('create')} />
          <NavItem collapsed={contentCollapsed} labelNow={collapsed} icon={<LibraryIcon />} label="Libreria" disabled badge="presto" />
        </div>

        {/* ── IN CORSO — grid trick: 0fr→1fr è la sola animazione height→auto fluida in CSS ── */}
        <div style={{
          display: 'grid',
          gridTemplateRows: contentCollapsed ? '0fr' : '1fr',
          opacity: collapsed ? 0 : 1,
          transition: 'grid-template-rows 0.2s ease, opacity 0.15s ease',
          flexShrink: 0,
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px 6px' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In corso</span>
            </div>
            <div style={{ padding: '0 8px' }}>
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
                <div style={{ padding: '8px 16px 6px' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leaflet</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  {activeLeaflet.map(course => (
                    <ArtifactRow key={course.id} course={course} onNavigate={onNavigate} showProgress={false} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Spacer scrollabile */}
        <div style={{ flex: 1, overflowY: 'auto' }} />

        {/* ── BOTTOM: Profilo + menu ── */}
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '6px 8px', flexShrink: 0, position: 'relative' }}>

          {/* ── Menu espanso — sempre renderizzato, scorre da sotto ── */}
          <div style={{
            position: 'absolute', bottom: '100%', left: 8, right: 8,
            background: 'var(--bg-primary)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            opacity: profileMenuOpen && !contentCollapsed ? 1 : 0,
            transform: profileMenuOpen && !contentCollapsed ? 'translateY(0)' : 'translateY(6px)',
            pointerEvents: profileMenuOpen && !contentCollapsed ? 'auto' : 'none',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}>
            <MenuButton icon={<ProgressIcon />} label="Progressi" onClick={() => { setProfileMenuOpen(false); onOpenProgress() }} />
            <MenuButton icon={<SettingsIcon />} label="Impostazioni" onClick={() => { setProfileMenuOpen(false); onOpenSettings() }} />
            <div style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
            <MenuButton icon={<HelpIcon />} label="Aiuto" onClick={() => { setProfileMenuOpen(false); window.sensei.openExternal('https://github.com/lonelyfrank/sensei-learning') }} />
          </div>

          {/* ── Menu collassato — position fixed, scorre da sinistra ── */}
          {profileMenuOpen && contentCollapsed && (
            <div style={{
              position: 'fixed', left: 56, top: menuY,
              transform: 'translateY(-100%)',
              width: 180, background: 'var(--bg-primary)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000,
              animation: 'slideInLeft 0.18s ease',
            }}>
              <MenuButton icon={<ProgressIcon />} label="Progressi" onClick={() => { setProfileMenuOpen(false); onOpenProgress() }} />
              <MenuButton icon={<SettingsIcon />} label="Impostazioni" onClick={() => { setProfileMenuOpen(false); onOpenSettings() }} />
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '2px 0' }} />
              <MenuButton icon={<HelpIcon />} label="Aiuto" onClick={() => { setProfileMenuOpen(false); window.sensei.openExternal('https://github.com/lonelyfrank/sensei-learning') }} />
            </div>
          )}

          {/* ── Sezione profilo: crossfade grid tra espanso e collassato ── */}

          {/* Profilo espanso */}
          <div style={{
            display: 'grid',
            gridTemplateRows: contentCollapsed ? '0fr' : '1fr',
            opacity: contentCollapsed ? 0 : 1,
            pointerEvents: contentCollapsed ? 'none' : 'auto',
            transition: 'grid-template-rows 0.2s ease, opacity 0.15s ease',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div
                ref={expandedMenuRef}
                onClick={handleMenuToggle}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: profileMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
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
            </div>
          </div>

          {/* Profilo collassato — solo avatar */}
          <div style={{
            display: 'grid',
            gridTemplateRows: contentCollapsed ? '1fr' : '0fr',
            opacity: contentCollapsed ? 1 : 0,
            pointerEvents: contentCollapsed ? 'auto' : 'none',
            transition: 'grid-template-rows 0.2s ease, opacity 0.15s ease',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div
                ref={collapsedMenuRef}
                onClick={handleMenuToggle}
                style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}
              >
                <div
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#534AB7', overflow: 'hidden', border: '0.5px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
              </div>
            </div>
          </div>

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
