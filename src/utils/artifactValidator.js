import { LUCIDE_WHITELIST } from './lucideWhitelist.js'

const ALLOWED_IMPORTS = ['react', 'lucide-react']
const VALID_COMPLETION_RULES = ['all-steps', 'any-step', 'manual']
const LUCIDE_SET = new Set(LUCIDE_WHITELIST)

const LUCIDE_DEPRECATED = {
  CheckCircle: 'CircleCheck', CheckCircle2: 'CircleCheckBig',
  AlertCircle: 'CircleAlert', AlertOctagon: 'OctagonAlert', AlertTriangle: 'TriangleAlert',
  XCircle: 'CircleX', XOctagon: 'OctagonX', XSquare: 'SquareX',
  PlusCircle: 'CirclePlus', PlusSquare: 'SquarePlus',
  MinusCircle: 'CircleMinus', MinusSquare: 'SquareMinus',
  ArrowUpCircle: 'CircleArrowUp', ArrowDownCircle: 'CircleArrowDown',
  ArrowLeftCircle: 'CircleArrowLeft', ArrowRightCircle: 'CircleArrowRight',
  ChevronUpCircle: 'CircleChevronUp', ChevronDownCircle: 'CircleChevronDown',
  ChevronLeftCircle: 'CircleChevronLeft', ChevronRightCircle: 'CircleChevronRight',
  HelpCircle: 'CircleHelp', DotCircle: 'CircleDot',
  Home: 'House', Grid: 'Grid3x3',
  BarChart: 'ChartColumn', BarChart2: 'ChartColumnBig',
  LineChart: 'ChartLine', AreaChart: 'ChartArea', PieChart: 'ChartPie',
  Loader2: 'LoaderCircle', MoreHorizontal: 'Ellipsis',
  MoreVertical: 'EllipsisVertical', ExternalLink: 'SquareArrowOutUpRight',
}

export function validateArtifact(content) {
  const errors   = []
  const warnings = []

  const isNewFormat = /export\s+default\s+\{/.test(content) && /\bcomponent\s*:/.test(content)
  const hasExportDefault = /export\s+default\s+/m.test(content)

  if (!hasExportDefault) {
    errors.push("Manca export default — il componente principale non è esportato")
    return { valid: false, errors, warnings }
  }

  // ── Check comuni a entrambi i formati ────────────────────────────────────────

  const importMatches = [...content.matchAll(/^import\s+.+\s+from\s+['"]([^'"]+)['"]/gm)]
  const forbidden = importMatches.map(m => m[1]).filter(src => !ALLOWED_IMPORTS.includes(src))
  if (forbidden.length > 0)
    errors.push(`Import non consentiti: ${forbidden.join(', ')} — usa solo react e lucide-react`)

  // Valida icone Lucide contro il whitelist della versione installata
  const lucideImport = content.match(/^import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/m)
  if (lucideImport) {
    const icons = lucideImport[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
    const resolved = icons.map(name => LUCIDE_DEPRECATED[name] ?? name)
    const unknown = resolved.filter(name => !LUCIDE_SET.has(name))
    if (unknown.length > 0)
      warnings.push(`Icone non riconosciute: ${unknown.join(', ')} — verranno omesse a runtime`)
  }

  const lines = content.trimEnd().split('\n')
  let lastMeaningful = ''
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim()
    if (t && !t.startsWith('//') && !t.startsWith('*')) { lastMeaningful = t; break }
  }
  if (!lastMeaningful.endsWith('}'))
    errors.push("Il file sembra troncato — l'ultima istruzione significativa non termina con }")

  if (isNewFormat) {
    // ── Validazione Sensei Artifact Standard ──────────────────────────────────
    if (!/meta\s*:\s*\{/.test(content))
      errors.push("meta: blocco mancante — il Sensei Artifact Standard richiede un oggetto meta")
    if (!/title\s*:\s*["'][^"']+["']/.test(content))
      errors.push("meta.title mancante o non è una stringa non vuota")
    if (!/type\s*:\s*["'](sentiero|leaflet)["']/.test(content))
      errors.push("meta.type deve essere 'sentiero' o 'leaflet'")
    if (!/version\s*:\s*["'][^"']+["']/.test(content))
      errors.push("meta.version mancante o non è una stringa")
    if (!/\bcomponent\s*:\s*\w/.test(content))
      errors.push("component mancante — deve referenziare il componente React principale")
    if (!/\bxp\s*:\s*\d+/.test(content))
      errors.push("gamification.xp mancante o non è un numero")
    if (!VALID_COMPLETION_RULES.some(r => content.includes(`"${r}"`) || content.includes(`'${r}'`)))
      errors.push("gamification.completionRule deve essere 'all-steps', 'any-step' o 'manual'")
  } else {
    // ── Formato legacy — warning non bloccante ────────────────────────────────
    warnings.push("Formato legacy — considera la migrazione al Sensei Artifact Standard")
    if (!/export\s+const\s+SENSEI_TYPE\s*=/.test(content))
      warnings.push("SENSEI_TYPE non trovato — Sensei potrebbe non riconoscere il tipo dell'artifact")
    if (!/export\s+const\s+SENSEI_STEPS\s*=/.test(content))
      warnings.push("SENSEI_STEPS non trovato — il conteggio degli step potrebbe non essere corretto")
  }

  return { valid: errors.length === 0, errors, warnings }
}
