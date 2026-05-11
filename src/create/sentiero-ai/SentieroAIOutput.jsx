import React, { useState, useEffect } from 'react'
import { SENTIERO_PROMPT_BASE } from './sentieroPrompt.js'
import SenseiLogo from '../../assets/sensei-logo.svg?react'
import IconPicker from '../../components/IconPicker.jsx'
import { sanitizeArtifact } from '../../utils/artifactSanitizer.js'
import { validateArtifact } from '../../utils/artifactValidator.js'

const STARS = [
  { x:   0, y: -72, size: 7, anim: 'twinkle', dur: 2.8, delay: 0.3 },
  { x: -76, y:   0, size: 6, anim: 'twinkle', dur: 3.3, delay: 1.7 },
  { x:  74, y:   2, size: 6, anim: 'twinkle', dur: 2.5, delay: 0.8 },
  { x:   2, y:  72, size: 6, anim: 'twinkle', dur: 3.1, delay: 2.4 },
  { x: -55, y: -56, size: 5, anim: 'twinkle', dur: 2.7, delay: 1.2 },
  { x:  57, y: -54, size: 5, anim: 'twinkle', dur: 3.4, delay: 0.5 },
  { x: -50, y: -48, size: 4, anim: 'driftNW', dur: 3.8, delay: 0.0 },
  { x:  48, y: -50, size: 4, anim: 'driftNE', dur: 4.2, delay: 1.1 },
  { x:  54, y:  40, size: 4, anim: 'driftSE', dur: 4.0, delay: 0.4 },
  { x: -56, y:  38, size: 3, anim: 'driftSW', dur: 3.9, delay: 2.3 },
]

function GeneratingScreen({ messages, stars }) {
  const [idx,       setIdx]       = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [charIdx,   setCharIdx]   = useState(0)

  useEffect(() => {
    const msg = messages[idx]
    if (charIdx < msg.length) {
      const ch = msg[charIdx]
      const delay = /[.,!?…]/.test(ch) ? 180 + Math.random() * 80
                  : ch === ' '         ?  55 + Math.random() * 30
                  :                       32 + Math.random() * 40
      const t = setTimeout(() => {
        setDisplayed(msg.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      }, delay)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        let next
        do { next = Math.floor(Math.random() * messages.length) } while (next === idx && messages.length > 1)
        setIdx(next)
        setDisplayed('')
        setCharIdx(0)
      }, 1800)
      return () => clearTimeout(t)
    }
  }, [charIdx, idx])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        {stars.map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            <div style={{ animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`, color: 'var(--text-primary)' }}>
              <svg width={s.size} height={s.size} viewBox="-1 -1 2 2">
                <path d="M0 -1 L0.25 -0.25 L1 0 L0.25 0.25 L0 1 L-0.25 0.25 L-1 0 L-0.25 -0.25Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ animation: 'senseiTravel 7s linear infinite' }}>
            <div className="sensei-blink" style={{ color: 'var(--text-primary)', animation: 'senseiGlow 7s linear infinite' }}>
              <SenseiLogo width={80} height={80} />
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', margin: 0, minHeight: 20, fontFamily: 'monospace', letterSpacing: '0.01em' }}>
        {displayed}<span style={{ opacity: charIdx < messages[idx].length ? 1 : 0, transition: 'opacity 0.1s' }}>▋</span>
      </p>

      <div style={{ width: 260, height: 3, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #378ADD88, #378ADD, #7F77DD)', animation: 'aiProgress 1.6s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GhostBtn({ onClick, children, style }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{ padding: '9px 16px', fontSize: 13, color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: hover ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.12s', cursor: 'pointer', ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  )
}

function SentieroAIOutput({ userSection, setUserSection, suggestedName, onBack, onImported }) {
  const [copied,         setCopied]         = useState(false)
  const [codeCopied,     setCodeCopied]     = useState(false)
  const [hasApiKey,      setHasApiKey]      = useState(false)
  const [genState,       setGenState]       = useState('idle')
  const [generated,      setGenerated]      = useState('')
  const [genError,       setGenError]       = useState(null)
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [artifactName,   setArtifactName]   = useState(suggestedName || '')
  const [icon,           setIcon]           = useState('BookOpen')
  const [color,          setColor]          = useState('#378ADD')
  const [importing,          setImporting]          = useState(false)
  const [importError,        setImportError]        = useState(null)
  const [validationErrors,   setValidationErrors]   = useState([])
  const [validationWarnings, setValidationWarnings] = useState([])

  const fullPrompt = `${SENTIERO_PROMPT_BASE}\n\n${userSection}`

  useEffect(() => {
    window.sensei.anthropic.hasKey().then(setHasApiKey)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generated)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleGenerate = async () => {
    setGenState('generating')
    setGenError(null)
    try {
      const result = await window.sensei.anthropic.generate({
        description:  userSection,
        systemPrompt: SENTIERO_PROMPT_BASE,
      })
      if (result?.success) {
        const sanitized                           = sanitizeArtifact(result.content)
        const { valid, errors: ve, warnings: vw } = validateArtifact(sanitized)
        setGenerated(sanitized)
        setValidationErrors(ve)
        setValidationWarnings(vw)
        setGenState('done')
        if (!valid || vw.length > 0) {
          window.sensei.logArtifactError({
            filename:  'sentiero-generato',
            errors:    ve,
            warnings:  vw,
            source:    'api',
            timestamp: new Date().toISOString(),
          }).catch(() => {})
        }
      } else {
        setGenError(result?.error || 'Errore sconosciuto')
        setGenState('error')
      }
    } catch (err) {
      setGenError(err.message || 'Errore di comunicazione con il main process')
      setGenState('error')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImportError(null)
    const slug     = (artifactName || suggestedName || 'sentiero').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const filename = `${slug}-${Date.now()}.jsx`
    const result   = await window.sensei.saveArtifact({ content: generated, filename, name: artifactName || suggestedName, icon, color })
    setImporting(false)
    if (result.success) {
      setShowSaveDialog(false)
      if (onImported) onImported()
    } else {
      setImportError(result.error)
    }
  }

  // ── Generazione in corso ─────────────────────────────────────────────────────
  if (genState === 'generating') {
    return <GeneratingScreen messages={[
      'Sto generando il contenuto...',
      'Sto strutturando i passaggi...',
      'Sto rifinendo l\'artifact...',
      'Quasi pronto...',
      'Sto costruendo il tuo sentiero...',
      'Sto organizzando i concetti chiave...',
      'Sto preparando gli esempi pratici...',
      'Sto definendo gli obiettivi di apprendimento...',
      'Sto bilanciando teoria e pratica...',
      'Sto affinando i dettagli...',
      'Sto verificando la struttura...',
      'Il tuo artifact sta prendendo forma...',
      'Sto ottimizzando il percorso...',
      'Sto aggiungendo gli ultimi dettagli...',
      'Ci siamo quasi...',
    ]} stars={STARS} />
  }

  // ── Layout principale (idle / error / done) ──────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
        {genState === 'done' ? (
          <>
            <GhostBtn onClick={() => { setGenState('idle'); setGenerated(''); setValidationErrors([]); setValidationWarnings([]) }} style={{ padding: '6px 12px', fontSize: 12 }}>
              ← Riprova
            </GhostBtn>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sentiero generato</span>
            </div>
          </>
        ) : (
          <>
            <GhostBtn onClick={onBack} style={{ padding: '6px 12px', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modifica
              </span>
            </GhostBtn>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Rivedi il prompt</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 10 }}>Personalizza e genera il sentiero</span>
            </div>
          </>
        )}
      </div>

      {/* Contenuto scrollabile */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {genState === 'done' ? (
            /* Preview codice */
            <>
              <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>sentiero.jsx</span>
                </div>
                <div style={{ padding: '16px', fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'monospace', lineHeight: 1.7, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                  {generated}
                </div>
              </div>

              {validationWarnings.length > 0 && (
                <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#BA751712', border: '0.5px solid #BA751744' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#BA7517', margin: '0 0 6px' }}>
                    Avvisi — il sentiero potrebbe funzionare con limitazioni
                  </p>
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {validationWarnings.map((w, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#E24B4A12', border: '0.5px solid #E24B4A44' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#E24B4A', margin: '0 0 6px' }}>
                    Artifact non valido — usa Riprova per rigenerare
                  </p>
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {validationErrors.map((e, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Prompt review */
            <>
              {/* System prompt — accordion */}
              <div style={{ marginBottom: 16, border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                <button
                  onClick={() => setPromptExpanded(v => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Specifiche tecniche Sensei</span>
                    <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>sola lettura</span>
                  </div>
                  <span style={{ color: 'var(--text-tertiary)' }}><ChevronIcon open={promptExpanded} /></span>
                </button>
                {promptExpanded && (
                  <div style={{ borderTop: '0.5px solid var(--border)', padding: '12px 16px', fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'monospace', lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', opacity: 0.85 }}>
                    {SENTIERO_PROMPT_BASE}
                  </div>
                )}
              </div>

              {/* Sezione utente */}
              <div style={{ marginBottom: genState === 'error' ? 12 : 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 3px' }}>Il tuo sentiero</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '0 0 10px', lineHeight: 1.4 }}>Puoi modificare i dettagli prima di generare</p>
                <textarea
                  value={userSection}
                  onChange={e => setUserSection(e.target.value)}
                  rows={9}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 12.5, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', outline: 'none', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.75, boxSizing: 'border-box' }}
                />
              </div>

              {/* Errore */}
              {genState === 'error' && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#E24B4A18', border: '0.5px solid #E24B4A55', fontSize: 12, color: '#E24B4A', lineHeight: 1.5, wordBreak: 'break-all' }}>
                  {genError}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer azioni */}
      <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 32px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        {genState === 'done' ? (
          <>
            <GhostBtn onClick={handleCopyCode}>
              {codeCopied ? '✓ Copiato' : 'Copia codice'}
            </GhostBtn>
            <button
              onClick={() => validationErrors.length === 0 && setShowSaveDialog(true)}
              disabled={validationErrors.length > 0}
              style={{ padding: '9px 20px', fontSize: 13, fontWeight: 500, color: validationErrors.length > 0 ? 'var(--text-tertiary)' : '#fff', background: validationErrors.length > 0 ? 'var(--bg-secondary)' : '#1D9E75', border: validationErrors.length > 0 ? '0.5px solid var(--border)' : 'none', borderRadius: 'var(--radius-md)', cursor: validationErrors.length > 0 ? 'default' : 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (validationErrors.length === 0) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { if (validationErrors.length === 0) e.currentTarget.style.opacity = '1' }}
            >
              Salva e importa in Sensei
            </button>
          </>
        ) : (
          <>
            {!hasApiKey && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 'auto', lineHeight: 1.5, maxWidth: 340 }}>
                Incolla il prompt in Claude, poi importa il file JSX.{' '}
                <span style={{ color: '#378ADD' }}>Configura l'API Key</span> per generare direttamente.
              </span>
            )}
            <GhostBtn
              onClick={handleCopy}
              style={copied ? { color: '#1D9E75', borderColor: '#1D9E75', background: '#1D9E7510' } : {}}
            >
              {copied ? '✓ Prompt copiato' : 'Copia prompt'}
            </GhostBtn>
            {hasApiKey && (
              <button
                onClick={handleGenerate}
                style={{ padding: '9px 20px', fontSize: 13, fontWeight: 500, color: '#fff', background: '#378ADD', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Genera con AI
                <span style={{ fontSize: 14 }}>✦</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Dialog salvataggio */}
      {showSaveDialog && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveDialog(false) }}
        >
          <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Importa sentiero</h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, lineHeight: 1.5 }}>Scegli nome, icona e colore prima di importare in Sensei.</p>

            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome</label>
            <input
              value={artifactName}
              onChange={e => setArtifactName(e.target.value)}
              autoFocus
              placeholder="Es. Corso React 30 giorni"
              onKeyDown={e => { if (e.key === 'Enter') handleImport() }}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Icona e colore</label>
            <IconPicker selectedIcon={icon} selectedColor={color} onSelectIcon={setIcon} onSelectColor={setColor} />

            {importError && (
              <p style={{ fontSize: 12, color: '#E24B4A', marginTop: 12 }}>{importError}</p>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <GhostBtn onClick={() => { setShowSaveDialog(false); setImportError(null) }}>Annulla</GhostBtn>
              <button
                onClick={handleImport}
                disabled={importing}
                style={{ padding: '7px 18px', fontSize: 13, fontWeight: 500, color: '#fff', background: '#1D9E75', border: 'none', borderRadius: 'var(--radius-md)', opacity: importing ? 0.6 : 1, cursor: importing ? 'default' : 'pointer' }}
              >
                {importing ? 'Importazione…' : 'Importa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SentieroAIOutput
