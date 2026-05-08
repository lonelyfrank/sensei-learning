import React, { useState } from 'react'
import CourseCard from '../home/CourseCard.jsx'
import CourseGrid from '../home/CourseGrid.jsx'
import CollapsibleSection, { getSectionState, setSectionState } from '../home/CollapsibleSection.jsx'
import ImportCard from '../home/ImportCard.jsx'
import SearchBar from '../home/SearchBar.jsx'
import FilterPill from '../home/FilterPill.jsx'
import { GridIcon, ListIcon } from '../home/homeIcons.jsx'
import { PlusIcon, CreateIcon } from '../components/icons.jsx'
import SenseiLogo from '../assets/sensei-logo.svg?react'

const STARS = [
  // Sparkle — lampeggiano ai punti cardinali e diagonali (taglie diverse = profondità)
  { x:   0, y: -72, size: 7, anim: 'twinkle', dur: 2.8, delay: 0.3 },
  { x: -76, y:   0, size: 6, anim: 'twinkle', dur: 3.3, delay: 1.7 },
  { x:  74, y:   2, size: 6, anim: 'twinkle', dur: 2.5, delay: 0.8 },
  { x:   2, y:  72, size: 6, anim: 'twinkle', dur: 3.1, delay: 2.4 },
  { x: -55, y: -56, size: 5, anim: 'twinkle', dur: 2.7, delay: 1.2 },
  { x:  57, y: -54, size: 5, anim: 'twinkle', dur: 3.4, delay: 0.5 },
  { x: -57, y:  53, size: 4, anim: 'twinkle', dur: 2.4, delay: 2.9 },
  { x:  55, y:  55, size: 4, anim: 'twinkle', dur: 3.0, delay: 0.1 },
  { x: -30, y: -78, size: 4, anim: 'twinkle', dur: 2.6, delay: 1.9 },
  { x:  32, y:  78, size: 3, anim: 'twinkle', dur: 3.5, delay: 0.7 },
  // Deriva lenta (grandi = vicine)
  { x: -50, y: -48, size: 4, anim: 'driftNW', dur: 3.8, delay: 0.0 },
  { x:  48, y: -50, size: 4, anim: 'driftNE', dur: 4.2, delay: 1.1 },
  { x:  -8, y: -58, size: 3, anim: 'driftN',  dur: 3.6, delay: 2.0 },
  { x:  54, y:  40, size: 4, anim: 'driftSE', dur: 4.0, delay: 0.4 },
  { x: -56, y:  38, size: 3, anim: 'driftSW', dur: 3.9, delay: 2.3 },
  { x:  66, y: -16, size: 4, anim: 'driftE',  dur: 3.7, delay: 0.9 },
  { x: -68, y:  18, size: 3, anim: 'driftW',  dur: 4.1, delay: 1.5 },
  { x:  20, y:  66, size: 3, anim: 'driftS',  dur: 3.5, delay: 2.7 },
  // Deriva rapida (piccole = lontane, veloci per parallasse)
  { x: -24, y:  64, size: 2, anim: 'driftSW', dur: 2.6, delay: 0.6 },
  { x:  34, y: -64, size: 2, anim: 'driftNE', dur: 2.4, delay: 1.8 },
  { x: -36, y: -62, size: 2, anim: 'driftNW', dur: 2.7, delay: 0.9 },
  { x:  60, y:  20, size: 2, anim: 'driftE',  dur: 2.3, delay: 3.1 },
  { x: -12, y:  76, size: 2, anim: 'driftS',  dur: 2.5, delay: 1.4 },
  { x:  76, y: -32, size: 2, anim: 'driftE',  dur: 2.8, delay: 0.2 },
  { x: -78, y: -26, size: 2, anim: 'driftW',  dur: 2.6, delay: 2.5 },
  { x:  42, y:  70, size: 2, anim: 'driftSE', dur: 2.9, delay: 0.7 },
  { x: -44, y: -72, size: 2, anim: 'driftNW', dur: 2.4, delay: 1.3 },
  { x:  16, y: -78, size: 2, anim: 'driftN',  dur: 2.7, delay: 3.4 },
]

const SENTIERO_FILTERS = ['Tutti', 'In corso', 'Non iniziati']
const LEAFLET_FILTERS = ['Tutti', 'Aperti']
const SORT_OPTIONS = [
  { id: 'date', label: 'Data aggiunta' },
  { id: 'name', label: 'Nome' },
  { id: 'progress', label: 'Progresso' },
]

function ViewButton({ active, onClick, children }) {
  return (
    <div onClick={onClick} style={{ padding: '4px 8px', borderRadius: 5, cursor: 'pointer', background: active ? 'var(--bg-secondary)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

/* Applica ordinamento a una lista di corsi */
function sortCourses(courses, sortBy) {
  return [...courses].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'progress') return b.progress - a.progress
    // date — usa added_at dal DB (default)
    return 0
  })
}

function Home({ courses, onSelectCourse, onImport, onCreate, onRemove, justCompleted }) {
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [sentieroFilter, setSentieroFilter] = useState('Tutti')
  const [leafletFilter, setLeafletFilter] = useState('Tutti')
  const [sortBy, setSortBy] = useState('date')
  const [openSentieri, setOpenSentieri] = useState(() => getSectionState('sentieri'))
  const [openLeaflet, setOpenLeaflet] = useState(() => getSectionState('leaflet'))

  const toggleSection = (key, val, setter) => { setter(!val); setSectionState(key, !val) }

  const sentieri = courses.filter(c => c.type === 'sentiero' || !c.type)
  const leaflets = courses.filter(c => c.type === 'leaflet')
  const isSearching = search.trim().length > 0
  const searchResults = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const inProgress = sentieri
    .filter(c => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)

  // Sentieri filtrati e ordinati
  const sentieriFiltered = sortCourses(
    sentieri.filter(c => {
      if (sentieroFilter === 'In corso') return c.progress > 0 && c.progress < 100
      if (sentieroFilter === 'Non iniziati') return c.progress === 0
      return true
    }),
    sortBy
  )

  const leafletFiltered = leaflets.filter(c => {
    if (leafletFilter === 'Aperti') return c.progress > 0
    return true
  })

  // Empty state — bypassa header e sezioni, centra nel layout
  if (courses.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState onImport={onImport} onCreate={onCreate} />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>I miei sentieri</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <SearchBar value={search} onChange={setSearch} />

          {/* Ordinamento */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              fontSize: 12, padding: '5px 8px',
              color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              outline: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          {/* Toggle griglia/lista */}
          <div style={{ display: 'flex', gap: 4, border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 3, flexShrink: 0 }}>
            <ViewButton active={view === 'grid'} onClick={() => setView('grid')}><GridIcon /></ViewButton>
            <ViewButton active={view === 'list'} onClick={() => setView('list')}><ListIcon /></ViewButton>
          </div>
        </div>
      </div>

      {/* ── RICERCA ── */}
      {isSearching && (
        <Section title={`Risultati per "${search}" — ${searchResults.length} trovati`}>
          <CourseGrid view={view}>
            {searchResults.map(course => (
              <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} isCompleted={course.progress === 100} isLeaflet={course.type === 'leaflet'} showTypeBadge />
            ))}
            {searchResults.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0' }}>Nessun risultato trovato.</p>}
          </CourseGrid>
        </Section>
      )}

      {/* ── SEZIONI NORMALI ── */}
      {!isSearching && (
        <>
          {/* In corso — non collassabile */}
          {inProgress.length > 0 && (
            <>
              <Section title="In corso">
                <CourseGrid view={view}>
                  {inProgress.map(course => (
                    <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} justCompleted={justCompleted} />
                  ))}
                </CourseGrid>
              </Section>
              <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: 28 }} />
            </>
          )}

          {/* Sentieri — collassabile */}
          <CollapsibleSection
            title="Sentieri"
            open={openSentieri}
            onToggle={() => toggleSection('sentieri', openSentieri, setOpenSentieri)}
            action={
              <div style={{ display: 'flex', gap: 6 }}>
                {SENTIERO_FILTERS.map(f => <FilterPill key={f} label={f} active={sentieroFilter === f} onClick={() => setSentieroFilter(f)} />)}
              </div>
            }
          >
            <CourseGrid view={view}>
              {sentieriFiltered.map(course => (
                <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} isCompleted={course.progress === 100} justCompleted={justCompleted} />
              ))}
              <ImportCard view={view} onClick={onImport} />
            </CourseGrid>
          </CollapsibleSection>

          {/* Leaflet — collassabile */}
          {leaflets.length > 0 && (
            <>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0 28px' }} />
              <CollapsibleSection
                title="Leaflet"
                open={openLeaflet}
                onToggle={() => toggleSection('leaflet', openLeaflet, setOpenLeaflet)}
                action={
                  <div style={{ display: 'flex', gap: 6 }}>
                    {LEAFLET_FILTERS.map(f => <FilterPill key={f} label={f} active={leafletFilter === f} onClick={() => setLeafletFilter(f)} />)}
                  </div>
                }
              >
                <CourseGrid view={view}>
                  {leafletFiltered.map(course => (
                    <CourseCard key={course.id} course={course} view={view} onClick={() => onSelectCourse(course)} onRemove={onRemove} isLeaflet />
                  ))}
                  <ImportCard view={view} onClick={onImport} label="Importa leaflet" />
                </CourseGrid>
              </CollapsibleSection>
            </>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ onImport, onCreate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flex: 1, gap: 0, padding: '0 24px',
    }}>
      {/* Container fisso — le stelle non sconfinano sul testo */}
      <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 20, flexShrink: 0 }}>
        {STARS.map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <div style={{ animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`, color: 'var(--text-primary)' }}>
              <svg width={s.size} height={s.size} viewBox="-1 -1 2 2">
                <path d="M0 -1 L0.25 -0.25 L1 0 L0.25 0.25 L0 1 L-0.25 0.25 L-1 0 L-0.25 -0.25Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        ))}
        {/* Logo: div esterno per centrare, div interno per l'animazione */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ animation: 'senseiTravel 7s linear infinite' }}>
            <div className="sensei-blink" style={{ color: 'var(--text-primary)', animation: 'senseiGlow 7s linear infinite' }}>
              <SenseiLogo width={80} height={80} />
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', textAlign: 'center', letterSpacing: '-0.01em' }}>
        Nessun artifact ancora
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 40px', textAlign: 'center', lineHeight: 1.7, maxWidth: 300 }}>
        Importa un file .jsx generato da Claude<br />o creane uno nuovo con il supporto dell'AI.
      </p>

      <div style={{ display: 'flex', gap: 14 }}>
        <ActionCard
          icon={<PlusIcon />}
          title="Importa artifact"
          description="Carica un file .jsx dal tuo computer"
          color="#378ADD"
          onClick={onImport}
        />
        <ActionCard
          icon={<CreateIcon />}
          title="Crea con AI"
          description="Genera un prompt per Claude AI"
          color="#7F77DD"
          onClick={onCreate}
        />
      </div>
    </div>
  )
}

function ActionCard({ icon, title, description, color, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 200, padding: '22px 20px',
        background: hovered ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        border: `0.5px solid ${hovered ? color + '44' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hovered ? '0 6px 24px rgba(0,0,0,0.1)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: color + '12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        color: 'var(--text-secondary)',
        border: `0.5px solid ${color}28`,
      }}>
        <div style={{ transform: 'scale(1.85)', display: 'flex' }}>{icon}</div>
      </div>
      <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

export default Home