// ─── Course.jsx ──────────────────────────────────────────────────────────────
// Vista principale per la fruizione di un artifact JSX.
// Carica il file, lo trasforma per renderlo eseguibile in un iframe sandboxato,
// e funge da ponte tra lo storage persistente (SQLite) e l'artifact.

import React, { useEffect, useState, useRef, Component } from 'react'

// Nomi di built-in JavaScript che collidono con icone Lucide omonime.
// Es: l'icona Lucide "Map" sovrascrive window.Map — causa crash negli artifact
// che usano Map nativo. La soluzione è rinominare l'icona in "_MapIcon".
const JS_BUILTINS = ['Map', 'Set', 'Array', 'Object', 'Error', 'Event', 'URL', 'Image']
const ALLOWED_ORIGIN = import.meta.env.DEV ? 'http://localhost:5173' : 'file://'

// ── Trasformazione codice ─────────────────────────────────────────────────────
// Funzione pura: non dipende dallo stato del componente, vive a livello di modulo
// per evitare ricreazioni ad ogni render.
//
// Flusso in 5 step:
//   1. Rimuove le variabili Sensei esportate (usate solo in fase di importazione)
//   2. Elimina tutti gli import React/react-dom (già globali nell'iframe)
//   3. Converte gli import Lucide in assegnazioni const dal bundle UMD (_lucide)
//      I JS_BUILTINS vengono rinominati con suffisso "Icon" per non sovrascrire nativi
//   4. Rimuove tutti gli altri import (librerie esterne non supportate nell'iframe)
//   5. Converte "export default" in "const __MainComponent" per il mounting manuale
function transformCode(code) {
  const builtinsUsedAsIcons = new Set()

  // Rileva formato: nuovo (Sensei Artifact Standard) vs legacy
  const isNewFormat = /export\s+default\s+\{/.test(code) && /\bcomponent\s*:/.test(code)

  let transformed = code
    .replace(/^export\s+(const\s+SENSEI_TYPE\s*=.*)$/gm,  '$1')
    .replace(/^export\s+(const\s+SENSEI_STEPS\s*=.*)$/gm, '$1')
    .replace(/import\s+React.*?from\s+['"]react['"]/g, '// react global')
    .replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/g, (_, imports) =>
      imports.split(',').map(i => {
        const name = i.trim().split(' as ').pop().trim()
        return `// ${name} already global`
      }).join('\n')
    )
    .replace(/import\s+.*?from\s+['"]react-dom['"]/g, '// react-dom global')
    .replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g, (_, imports) =>
      imports.split(',').map(i => {
        const parts    = i.trim().split(' as ')
        const original = parts[0].trim()
        const alias    = parts[parts.length - 1].trim()
        if (JS_BUILTINS.includes(alias)) {
          builtinsUsedAsIcons.add(alias)
          return `const _${alias}Icon = _lucide['${original}'] || (() => null)`
        }
        return `const ${alias} = _lucide['${original}'] || (() => null)`
      }).join('\n')
    )
    .replace(/^import\s+.*$/gm, '// import removed')

  if (isNewFormat) {
    // Nuovo formato: export default { meta, component, gamification }
    // Wrappa l'oggetto in una variabile ed estrae component
    transformed = transformed.replace(/export\s+default\s+\{/, 'const __SenseiArtifact = {')
    transformed += '\nconst __MainComponent = __SenseiArtifact.component\n'
  } else {
    // Formato legacy: export default function/class/expression
    transformed = transformed.replace(/^export\s+default\s+/m, 'const __MainComponent = ')
  }

  // Rinomina i built-in rilevati anche nei riferimenti JSX e negli oggetti
  builtinsUsedAsIcons.forEach(name => {
    const safe = `_${name}Icon`
    transformed = transformed
      .replace(new RegExp(`<${name}(\\s|/|>)`, 'g'),    `<${safe}$1`)
      .replace(new RegExp(`</${name}>`, 'g'),             `</${safe}>`)
      .replace(new RegExp(`:\\s*${name}([,}\\s\\n])`, 'g'), `: ${safe}$1`)
      .replace(new RegExp(`=\\{${name}\\}`, 'g'),         `={${safe}}`)
  })

  return transformed
}

// ── Generazione HTML iframe ───────────────────────────────────────────────────
// Architettura: Tailwind + React 18 + Lucide bundle locale + Babel standalone.
// window.storage: bridge postMessage verso il main process (storage asincrono).
// __nativeMap/__nativeSet: preserva i built-in JS prima che Lucide li sovrascriva.
function generateHTML(code, lucide) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.32); }
    ::-webkit-scrollbar-corner { background: transparent; }
  </style>
  <script>
    const __nativeMap = window.Map
    const __nativeSet = window.Set
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script>
    window.React = React
    window.react = React
    const {
      useState, useEffect, useRef, useMemo, useCallback,
      useContext, useReducer, useLayoutEffect, forwardRef,
      createContext, memo, Fragment
    } = React
  </script>
  <script>${lucide || ''}</script>
  <script>
    window._lucideReact = window.LucideReact || {}
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <script>
    window.onerror = (msg, _src, _line, _col, err) => {
      window.parent.postMessage({ type: 'sensei-artifact-error', message: err?.message || msg }, '*')
      return true
    }
    window.addEventListener('unhandledrejection', (e) => {
      window.parent.postMessage({ type: 'sensei-artifact-error', message: e.reason?.message || 'Errore sconosciuto' }, '*')
    })
  </script>
  <script>
    // Bridge storage: ogni chiamata window.storage.X() diventa un postMessage verso
    // il parent (Electron) e aspetta risposta abbinandola tramite id incrementale.
    let msgId = 0
    const pending = {}
    window.addEventListener('message', (e) => {
      const { id, result } = e.data || {}
      if (id && pending[id]) { pending[id](result); delete pending[id] }
    })
    function storageCall(type, data) {
      return new Promise((resolve) => {
        const id = ++msgId
        pending[id] = resolve
        window.parent.postMessage({ type: 'sensei-storage-' + type, id, ...data }, '*')
      })
    }
    window.storage = {
      get:    (key)         => storageCall('get',    { key }),
      set:    (key, value)  => storageCall('set',    { key, value }),
      delete: (key)         => storageCall('delete', { key }),
      list:   (prefix)      => storageCall('list',   { prefix }),
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    window.Map = __nativeMap
    window.Set = __nativeSet
    const _lucide = window._lucideReact || {}
    ${transformCode(code)}
    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(React.createElement(__MainComponent))
  </script>
</body>
</html>`
}

function CourseContent({ course, onBack, onProgressUpdate, onComplete }) {
  const [courseCode, setCourseCode]   = useState(null)
  const [lucideBundle, setLucideBundle] = useState(null)
  const [error, setError]             = useState(null)
  const iframeRef                     = useRef(null)
  const [reloadKey, setReloadKey]     = useState(0)

  // Flag per notificare il completamento una sola volta per sessione.
  // Ref (non state) perché non deve causare re-render al cambio.
  const completedNotified = useRef(false)

  // Carica il corso e registra il listener per i messaggi storage dell'iframe.
  // Si ri-esegue solo quando cambia il corso visualizzato.
  useEffect(() => {
    loadCourse()
    completedNotified.current = false
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      if (!event.data || typeof event.data.type !== 'string') return
      if (event.data.type === 'sensei-artifact-error') {
        setError(event.data.message || 'Errore nell\'artifact')
        return
      }
      handleStorageMessage(event, course.id)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [course.id])

  // Scorciatoia F5 per ricaricare l'artifact senza ricaricare Electron.
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'F5') { e.preventDefault(); reloadCourse() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Azzera lo stato e rilancia il caricamento del file dall'IPC.
  // reloadKey incrementale forza React a ricreare l'iframe (unmount + mount).
  const reloadCourse = () => {
    setCourseCode(null)
    completedNotified.current = false
    loadCourse()
    setReloadKey(k => k + 1)
  }

  // Carica in parallelo il sorgente JSX dell'artifact e il bundle Lucide locale.
  // Lucide viene servito dall'IPC per evitare richieste di rete dall'iframe sandboxato.
  const loadCourse = async () => {
    try {
      setError(null)
      const [code, lucide] = await Promise.all([
        window.sensei.readCourseFile(course.filename),
        window.sensei.getLucideBundle(),
      ])
      if (!code) throw new Error('File sentiero non trovato')
      setCourseCode(code)
      setLucideBundle(lucide)
    } catch (err) {
      setError(err.message)
    }
  }

  // Gestisce tutti i messaggi postMessage inviati dall'artifact tramite window.storage.
  // Il protocollo usa il prefisso "sensei-storage-" per distinguere i messaggi Sensei
  // da altri postMessage eventualmente presenti nel DOM.
  // Ogni messaggio porta un `id` univoco: la risposta viene inviata con lo stesso id
  // così l'artifact può abbinare promise → risposta.
  const handleStorageMessage = async (event, courseId) => {
    const { type, id, key, value, prefix } = event.data || {}
    if (!type || !type.startsWith('sensei-storage-')) return

    let result = null

    if (type === 'sensei-storage-get') {
      result = await window.sensei.storage.get(key, courseId)

    } else if (type === 'sensei-storage-set') {
      result = await window.sensei.storage.set(key, value, courseId)
      if (onProgressUpdate) onProgressUpdate()

      // ── Rilevamento completamento sentiero ────────────────────────────────
      // Analizza il valore salvato cercando una completedMap: un oggetto del tipo
      // { "1": true, "2": true, ... } dove ogni chiave è un dayId numerico.
      // Se tutti i giorni risultano completati e il conteggio copre total_days,
      // notifica il completamento una sola volta (completedNotified evita duplicati
      // in caso di scritture successive).
      if (onComplete && !completedNotified.current && course.type !== 'leaflet') {
        try {
          const parsed = JSON.parse(value)
          const isCompletedMap = (
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            Object.keys(parsed).length > 0 &&
            Object.entries(parsed).every(([k, v]) => !isNaN(parseInt(k)) && typeof v === 'boolean')
          )
          if (isCompletedMap) {
            const total          = course.total_days || 0
            const completedCount = Object.values(parsed).filter(Boolean).length
            const allDone        = Object.values(parsed).every(v => v === true)
            if (allDone && total > 0 && completedCount >= total) {
              completedNotified.current = true
              onComplete(course.name, course.id)
            }
          }
        } catch (_) {
          // Il valore non è una completedMap — nessuna azione
        }
      }

    } else if (type === 'sensei-storage-delete') {
      result = await window.sensei.storage.delete(key, courseId)

    } else if (type === 'sensei-storage-list') {
      result = await window.sensei.storage.list(prefix, courseId)
    }

    // Rimanda la risposta all'iframe usando lo stesso id della richiesta
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ id, result }, ALLOWED_ORIGIN)
    }
  }

  // L'iframe intercetta i mousemove al suo interno (frame separato).
  // Questo overlay sul bordo sinistro propaga gli eventi al window principale
  // così la bulge della sidebar risponde anche quando il cursore è sull'iframe.
  const handleOverlayMouseMove = (e) => {
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: e.clientX, clientY: e.clientY, bubbles: true,
    }))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', height: 52,
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0, background: 'var(--bg-primary)',
      }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Indietro
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: course.color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{course.name}</span>
        </div>

        <button
          onClick={reloadCourse}
          title="Ricarica artifact (F5)"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 3.9 1.6L13.5 2.5V6h-3.5l1.3-1.3A4 4 0 1 0 12 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Area artifact ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {error && (
          <ArtifactErrorScreen error={error} onRetry={reloadCourse} onBack={onBack} />
        )}
        {!error && (!courseCode || !lucideBundle) && (
          <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
            Caricamento...
          </div>
        )}
        {!error && courseCode && lucideBundle && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={generateHTML(courseCode, lucideBundle)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
              title={course.name}
            />
            {/* Overlay trasparente sul bordo sinistro: intercetta i mousemove
                dall'iframe (frame isolato) e li propaga al window principale
                perché la bulge SVG della sidebar risponda correttamente. */}
            <div
              style={{ position: 'absolute', top: 0, left: 0, width: 60, height: '100%', zIndex: 10, background: 'transparent', pointerEvents: 'auto' }}
              onMouseMove={handleOverlayMouseMove}
              onMouseLeave={handleOverlayMouseMove}
            />
          </div>
        )}
      </div>

    </div>
  )
}

// ── Schermata errore artifact ─────────────────────────────────────────────────
// Usata sia dalla error boundary (crash React) sia per errori postMessage iframe.
function ArtifactErrorScreen({ error, onRetry, onBack }) {
  const [showDetails, setShowDetails] = useState(false)
  const msg = error instanceof Error ? error.message : (error || 'Errore sconosciuto')
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 40, gap: 16, textAlign: 'center',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E24B4A18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Contenuto non disponibile
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Questo artifact ha riscontrato un errore.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <button
          onClick={() => setShowDetails(v => !v)}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showDetails ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli tecnici'}
        </button>
        {showDetails && (
          <pre style={{ marginTop: 8, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
            {msg}
          </pre>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={onRetry}
          style={{ padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#fff', background: '#378ADD', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Riprova
        </button>
        <button
          onClick={onBack}
          style={{ padding: '8px 18px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Torna alla dashboard
        </button>
      </div>
    </div>
  )
}

// ── Error Boundary per l'artifact ─────────────────────────────────────────────
// Intercetta crash React durante il render/lifecycle e mostra ArtifactErrorScreen.
// "Riprova" resetta la boundary → React rimonta i figli → useEffect rilancia loadCourse.
class ArtifactErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <ArtifactErrorScreen
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
          onBack={this.props.onBack}
        />
      )
    }
    return this.props.children
  }
}

function CourseInner({ course, onBack, onProgressUpdate, onComplete }) {
  return (
    <ArtifactErrorBoundary onBack={onBack}>
      <CourseContent course={course} onBack={onBack} onProgressUpdate={onProgressUpdate} onComplete={onComplete} />
    </ArtifactErrorBoundary>
  )
}

export default CourseInner
