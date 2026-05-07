// ─── Course.jsx ──────────────────────────────────────────────────────────────
// Vista principale per la fruizione di un artifact JSX.
// Carica il file, lo trasforma per renderlo eseguibile in un iframe sandboxato,
// e funge da ponte tra lo storage persistente (SQLite) e l'artifact.

import React, { useEffect, useState, useRef } from 'react'

// Nomi di built-in JavaScript che collidono con icone Lucide omonime.
// Es: l'icona Lucide "Map" sovrascrive window.Map — causa crash negli artifact
// che usano Map nativo. La soluzione è rinominare l'icona in "_MapIcon".
const JS_BUILTINS = ['Map', 'Set', 'Array', 'Object', 'Error', 'Event', 'URL', 'Image']

function Course({ course, onBack, onProgressUpdate, onComplete }) {
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
    const handleMessage = (event) => handleStorageMessage(event, course.id)
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
      iframeRef.current.contentWindow.postMessage({ id, result }, '*')
    }
  }

  // Trasforma il codice JSX dell'artifact per renderlo compatibile con l'iframe Babel.
  //
  // Il flusso di trasformazione è:
  //   1. Rimuove le variabili Sensei esportate (SENSEI_TYPE, SENSEI_STEPS) — usate
  //      solo in fase di importazione, non a runtime.
  //   2. Elimina tutti gli import React/react-dom — sono già globali nell'iframe.
  //   3. Converte gli import Lucide in assegnazioni const dal bundle UMD (_lucide).
  //      Gestisce il caso speciale dei JS_BUILTINS rinominandoli con il suffisso "Icon"
  //      e sostituendo anche le occorrenze JSX nel codice.
  //   4. Rimuove tutti gli altri import (librerie esterne non supportate nell'iframe).
  //   5. Converte "export default" in "const __MainComponent" per permettere
  //      il mounting manuale via ReactDOM.createRoot.
  const transformCode = (code) => {
    const builtinsUsedAsIcons = new Set()

    let transformed = code
      // Step 1 — variabili Sensei: usate solo all'importazione, non a runtime
      .replace(/^export\s+const\s+SENSEI_TYPE\s*=.*$/gm,  '// SENSEI_TYPE removed')
      .replace(/^export\s+const\s+SENSEI_STEPS\s*=.*$/gm, '// SENSEI_STEPS removed')

      // Step 2 — React globale: già iniettato nell'iframe via CDN
      .replace(/import\s+React.*?from\s+['"]react['"]/g, '// react global')
      .replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/g, (_, imports) =>
        imports.split(',').map(i => {
          const name = i.trim().split(' as ').pop().trim()
          return `// ${name} already global`
        }).join('\n')
      )
      .replace(/import\s+.*?from\s+['"]react-dom['"]/g, '// react-dom global')

      // Step 3 — Lucide: mappa ogni import al corrispondente nell'UMD bundle
      .replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g, (_, imports) =>
        imports.split(',').map(i => {
          const parts    = i.trim().split(' as ')
          const original = parts[0].trim()
          const alias    = parts[parts.length - 1].trim()

          // Se il nome dell'icona è un built-in JS (es. Map, Set) la rinomina
          // in _MapIcon per non sovrascrivere il built-in nativo nell'iframe
          if (JS_BUILTINS.includes(alias)) {
            builtinsUsedAsIcons.add(alias)
            return `const _${alias}Icon = _lucide['${original}'] || (() => null)`
          }
          return `const ${alias} = _lucide['${original}'] || (() => null)`
        }).join('\n')
      )

      // Step 4 — tutti gli altri import: non supportati nell'iframe sandboxato
      .replace(/^import\s+.*$/gm, '// import removed')

      // Step 5 — export default: diventa una const per il mounting manuale
      .replace(/^export\s+default\s+/m, 'const __MainComponent = ')

    // Sostituisce i riferimenti JSX e object ai built-in rinominati.
    // Es: <Map ... /> → <_MapIcon ... />, { icon: Map } → { icon: _MapIcon }
    builtinsUsedAsIcons.forEach(name => {
      const safe = `_${name}Icon`
      transformed = transformed
        .replace(new RegExp(`<${name}(\\s|/|>)`, 'g'),   `<${safe}$1`)
        .replace(new RegExp(`</${name}>`, 'g'),            `</${safe}>`)
        .replace(new RegExp(`:\\s*${name}([,}\\s\\n])`, 'g'), `: ${safe}$1`)
        .replace(new RegExp(`=\\{${name}\\}`, 'g'),        `={${safe}}`)
    })

    return transformed
  }

  // L'iframe intercetta i mousemove al suo interno (frame separato).
  // Questo overlay sul bordo sinistro propaga gli eventi al window principale
  // così la bulge della sidebar risponde anche quando il cursore è sull'iframe.
  const handleOverlayMouseMove = (e) => {
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: e.clientX, clientY: e.clientY, bubbles: true,
    }))
  }

  // Genera il documento HTML completo da iniettare nell'iframe.
  // Architettura dell'iframe:
  //   - Tailwind CSS (CDN) + React 18 (CDN) + Lucide bundle (locale via IPC)
  //   - window.storage: ponte di comunicazione postMessage verso il main process
  //   - Babel standalone: transpila il codice JSX a runtime
  //   - __nativeMap/__nativeSet: preserva i built-in JS prima che Lucide li sovrascriva
  const generateHTML = (code, lucide) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
  <script>
    // Salva i built-in prima del caricamento di Lucide (che potrebbe sovrascriverli)
    const __nativeMap = window.Map
    const __nativeSet = window.Set
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script>
    // Espone React e i suoi hook come globali — gli artifact li usano direttamente
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
    // Il bundle Lucide UMD si espone come window.LucideReact
    window._lucideReact = window.LucideReact || {}
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <script>
    // ── Bridge storage postMessage ─────────────────────────────────────────
    // Ogni chiamata window.storage.X() invia un postMessage al parent (Electron)
    // e aspetta la risposta abbinandola tramite un id numerico incrementale.
    // Questo pattern permette di usare storage asincrono come se fosse sincrono
    // con le stesse API che Claude genera negli artifact.
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
    // Ripristina i built-in JS dopo il caricamento di Lucide
    window.Map = __nativeMap
    window.Set = __nativeSet
    const _lucide = window._lucideReact || {}
    ${transformCode(code)}
    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(React.createElement(__MainComponent))
  </script>
</body>
</html>`

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
          <div style={{ padding: 32, color: '#E24B4A', fontSize: 13, textAlign: 'center' }}>
            <p>Errore nel caricamento dell'artifact.</p>
            <p style={{ color: 'var(--text-tertiary)', marginTop: 8, fontSize: 12 }}>{error}</p>
          </div>
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

export default Course
