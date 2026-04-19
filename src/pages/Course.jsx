import React, { useEffect, useState, useRef } from 'react'

function Course({ course, onBack, onProgressUpdate }) {
  const [courseCode, setCourseCode] = useState(null)
  const [lucideBundle, setLucideBundle] = useState(null)
  const [error, setError] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    loadCourse()

    const handleMessage = (event) => {
      handleStorageMessage(event, course.id)
    }
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
      if (!code) throw new Error('File corso non trovato')
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
      // Aggiorna i progressi nella dashboard dopo ogni salvataggio
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
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js"></script>

  <!-- Destruttura hooks e rendi React disponibile globalmente per lucide -->
  <script>
    window.React = React
    window.react = React
    const {
      useState, useEffect, useRef, useMemo, useCallback,
      useContext, useReducer, useLayoutEffect, forwardRef,
      createContext, memo, Fragment
    } = React
  </script>

  <!-- lucide-react bundle locale — dopo React -->
  <script>${lucide || ''}</script>

  <!-- Assegna le icone subito dopo il bundle -->
  <script>
    window._lucideReact = window.LucideReact || {}
    console.log('lucide loaded:', Object.keys(window._lucideReact).length, 'icons')
  </script>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>

  <script>
    // Storage bridge
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

  <script type="text/babel" data-presets="react">
    const _lucide = window._lucideReact || {}

    ${code
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
          const name = i.trim().split(' as ').pop().trim()
          return `const ${name} = _lucide['${name}'] || (() => null)`
        }).join('\n')
      )
      .replace(/^import\s+.*$/gm, '// import removed')
      .replace(/^export\s+default\s+/m, 'const __MainComponent = ')
    }

    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(React.createElement(__MainComponent))
  </script>
</body>
</html>`
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {error && (
          <div style={{ padding: 32, color: '#E24B4A', fontSize: 13, textAlign: 'center' }}>
            <p>Errore nel caricamento del corso.</p>
            <p style={{ color: 'var(--text-tertiary)', marginTop: 8, fontSize: 12 }}>{error}</p>
          </div>
        )}
        {!error && (!courseCode || !lucideBundle) && (
          <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
            Caricamento corso...
          </div>
        )}
        {!error && courseCode && lucideBundle && (
          <iframe
            ref={iframeRef}
            srcDoc={generateHTML(courseCode, lucideBundle)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin"
            title={course.name}
          />
        )}
      </div>

    </div>
  )
}

export default Course