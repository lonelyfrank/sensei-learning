import React, { useEffect, useState, useRef } from 'react'

// Nomi di icone Lucide che collidono con built-in JavaScript
// Questi vanno rinominati per evitare di sovrascrivere i globali nativi
const JS_BUILTINS = ['Map', 'Set', 'Array', 'Object', 'Error', 'Event', 'URL', 'Image']

function Course({ course, onBack, onProgressUpdate }) {
  const [courseCode, setCourseCode] = useState(null)
  const [lucideBundle, setLucideBundle] = useState(null)
  const [error, setError] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    loadCourse()
    const handleMessage = (event) => handleStorageMessage(event, course.id)
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [course.id])

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

  const handleStorageMessage = async (event, courseId) => {
    const { type, id, key, value, prefix } = event.data || {}
    if (!type || !type.startsWith('sensei-storage-')) return

    let result = null
    if (type === 'sensei-storage-get') {
      result = await window.sensei.storage.get(key, courseId)
    } else if (type === 'sensei-storage-set') {
      result = await window.sensei.storage.set(key, value, courseId)
      if (onProgressUpdate) onProgressUpdate()
    } else if (type === 'sensei-storage-delete') {
      result = await window.sensei.storage.delete(key, courseId)
    } else if (type === 'sensei-storage-list') {
      result = await window.sensei.storage.list(prefix, courseId)
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ id, result }, '*')
    }
  }

  // Trasforma il codice JSX dell'artifact per renderlo compatibile con l'iframe Babel
  const transformCode = (code) => {
    const builtinsUsedAsIcons = new Set()

    let transformed = code
      .replace(/^export\s+const\s+SENSEI_TYPE\s*=.*$/gm, '// SENSEI_TYPE removed')
      .replace(/^export\s+const\s+SENSEI_STEPS\s*=.*$/gm, '// SENSEI_STEPS removed')
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
          const parts = i.trim().split(' as ')
          const original = parts[0].trim()
          const alias = parts[parts.length - 1].trim()
          if (JS_BUILTINS.includes(alias)) {
            builtinsUsedAsIcons.add(alias)
            const safeName = `_${alias}Icon`
            return `const ${safeName} = _lucide['${original}'] || (() => null)`
          }
          return `const ${alias} = _lucide['${original}'] || (() => null)`
        }).join('\n')
      )
      .replace(/^import\s+.*$/gm, '// import removed')
      .replace(/^export\s+default\s+/m, 'const __MainComponent = ')

    builtinsUsedAsIcons.forEach(name => {
      const safeName = `_${name}Icon`
      transformed = transformed.replace(new RegExp(`<${name}(\\s|/|>)`, 'g'), `<${safeName}$1`)
      transformed = transformed.replace(new RegExp(`</${name}>`, 'g'), `</${safeName}>`)
      transformed = transformed.replace(new RegExp(`:\\s*${name}([,}\\s\\n])`, 'g'), `: ${safeName}$1`)
      transformed = transformed.replace(new RegExp(`=\\{${name}\\}`, 'g'), `={${safeName}}`)
    })

    return transformed
  }

  // Propaga il mousemove dal contesto dell'overlay al window principale
  // così la bulge della sidebar riceve sempre le coordinate reali
  const handleOverlayMouseMove = (e) => {
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: e.clientX,
      clientY: e.clientY,
      bubbles: true,
    }))
  }

  const generateHTML = (code, lucide) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>

  <!-- STEP 1: Salva Map/Set nativi prima di qualsiasi script esterno -->
  <script>
    const __nativeMap = window.Map
    const __nativeSet = window.Set
  </script>

  <!-- STEP 2: Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- STEP 3: React e ReactDOM -->
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>

  <!-- STEP 4: Destruttura hooks React globalmente -->
  <script>
    window.React = React
    window.react = React
    const {
      useState, useEffect, useRef, useMemo, useCallback,
      useContext, useReducer, useLayoutEffect, forwardRef,
      createContext, memo, Fragment
    } = React
  </script>

  <!-- STEP 5: Bundle lucide-react locale — dopo React -->
  <script>${lucide || ''}</script>

  <!-- STEP 6: Espone le icone Lucide come _lucideReact -->
  <script>
    window._lucideReact = window.LucideReact || {}
    console.log('lucide loaded:', Object.keys(window._lucideReact).length, 'icons')
  </script>

  <!-- STEP 7: Babel per transpilare JSX -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>

  <!-- STEP 8: Storage bridge — comunica con Sensei via postMessage -->
  <script>
    let msgId = 0
    const pending = {}

    window.addEventListener('message', (e) => {
      const { id, result } = e.data || {}
      if (id && pending[id]) {
        pending[id](result)
        delete pending[id]
      }
    })

    function storageCall(type, data) {
      return new Promise((resolve) => {
        const id = ++msgId
        pending[id] = resolve
        window.parent.postMessage({ type: 'sensei-storage-' + type, id, ...data }, '*')
      })
    }

    window.storage = {
      get: (key) => storageCall('get', { key }),
      set: (key, value) => storageCall('set', { key, value }),
      delete: (key) => storageCall('delete', { key }),
      list: (prefix) => storageCall('list', { prefix }),
    }
  </script>
</head>
<body>
  <div id="root"></div>

  <!-- STEP 9: Esegue il codice dell'artifact transpilato da Babel -->
  <script type="text/babel" data-presets="react">
    // Ripristina Map/Set nativi nel contesto Babel
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── TOOLBAR ARTIFACT ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', height: 52,
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0, background: 'var(--bg-primary)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
          }}
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
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {course.name}
          </span>
        </div>
      </div>

      {/* ── CONTENUTO ARTIFACT ── */}
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
              ref={iframeRef}
              srcDoc={generateHTML(courseCode, lucideBundle)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
              title={course.name}
            />

            {/* ── OVERLAY BORDO SINISTRO ──
                Striscia trasparente di 60px che cattura il mousemove
                vicino alla sidebar e lo propaga al window principale.
                Così la bulge funziona correttamente anche con l'iframe aperto,
                senza bloccare l'interazione con il contenuto dell'artifact. */}
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 60, height: '100%',
                zIndex: 10,
                background: 'transparent',
                pointerEvents: 'auto',
              }}
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