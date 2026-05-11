const ALLOWED_IMPORTS = ['react', 'lucide-react']

export function validateArtifact(content) {
  const errors   = []
  const warnings = []

  // ── Errori bloccanti ─────────────────────────────────────────────────────────

  if (!/export\s+default\s+/m.test(content))
    errors.push("Manca export default — il componente principale non è esportato")

  const importMatches = [...content.matchAll(/^import\s+.+\s+from\s+['"]([^'"]+)['"]/gm)]
  const forbidden = importMatches.map(m => m[1]).filter(src => !ALLOWED_IMPORTS.includes(src))
  if (forbidden.length > 0)
    errors.push(`Import non consentiti: ${forbidden.join(', ')} — usa solo react e lucide-react`)

  if (/new\s+Map\s*\(/.test(content))
    errors.push("Uso di new Map() non consentito — causa conflitti con le icone Lucide")

  if (/new\s+Set\s*\(/.test(content))
    errors.push("Uso di new Set() non consentito — causa conflitti con le icone Lucide")

  const lines = content.trimEnd().split('\n')
  let lastMeaningful = ''
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim()
    if (t && !t.startsWith('//') && !t.startsWith('*')) { lastMeaningful = t; break }
  }
  if (!lastMeaningful.endsWith('}'))
    errors.push("Il file sembra troncato — l'ultima istruzione significativa non termina con }")

  // ── Warning non bloccanti ────────────────────────────────────────────────────

  if (!/export\s+const\s+SENSEI_TYPE\s*=/.test(content))
    warnings.push("SENSEI_TYPE non trovato — Sensei potrebbe non riconoscere il tipo dell'artifact")

  if (!/export\s+const\s+SENSEI_STEPS\s*=/.test(content))
    warnings.push("SENSEI_STEPS non trovato — il conteggio degli step potrebbe non essere corretto")

  return { valid: errors.length === 0, errors, warnings }
}
