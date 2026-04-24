import React, { useState } from 'react'
import CourseCard from '../home/CourseCard.jsx'
import CourseGrid from '../home/CourseGrid.jsx'
import CollapsibleSection, { getSectionState, setSectionState } from '../home/CollapsibleSection.jsx'
import ImportCard from '../home/ImportCard.jsx'
import SearchBar from '../home/SearchBar.jsx'
import FilterPill from '../home/FilterPill.jsx'
import { GridIcon, ListIcon } from '../home/homeIcons.jsx'

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

function Home({ courses, onSelectCourse, onImport, onRemove, justCompleted }) {
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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>I miei sentieri</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <SearchBar value={search} onChange={setSearch} />

          {/* Ordinamento — solo per sentieri */}
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

          {/* Sentieri — collassabile con ordinamento */}
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

          {/* Stato vuoto */}
          {courses.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: 15 }}>Nessun artifact caricato.</p>
              <button onClick={onImport} style={{ fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 16px' }}>
                + Importa il tuo primo sentiero
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Home