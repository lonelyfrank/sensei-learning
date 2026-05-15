const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, net } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const archiver = require('archiver')
const AdmZip = require('adm-zip')

// Controlla se siamo in modalità sviluppo
const isDev = !app.isPackaged

// Importa il database
const db = require('../src/db/database.js')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    // Evita il flash bianco durante il ripristino da finestra massimizzata:
    // Electron dipinge questo colore prima che React monti la UI.
    backgroundColor: '#242424',
    icon: path.join(__dirname, '../public/sensei-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─── IPC HANDLERS ────────────────────────────────────────────────────────────

// Apre il dialog di sistema per scegliere un file .jsx da importare
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Artifact Sensei', extensions: ['jsx'] }],
  })
  return result
})

// ── RILEVAMENTO TIPO E STEP ──────────────────────────────────────────────────
// Analizza il codice JSX e restituisce { type, totalSteps }
// Sistema a cascata con 5 livelli di fallback:
//   1. SENSEI_TYPE + SENSEI_STEPS — variabili esplicite generate da Sensei
//   2. Array named — conta elementi in STEPS, DAYS, LESSONS, RECIPES, ecc.
//   3. Keywords — parole chiave nel testo per inferire il tipo
//   4. Regex id/day — conta step numerati nel codice
//   5. Default — sentiero con 30 step

function detectArtifactMeta(code) {

  // ── LIVELLO 0: Sensei Artifact Standard ──────────────────────────────────────
  if (/export\s+default\s+\{/.test(code) && /\bcomponent\s*:/.test(code)) {
    const typeMatch       = code.match(/type\s*:\s*['"](\w+)['"]/)
    const titleMatch      = code.match(/title\s*:\s*['"]([^'"]+)['"]/)
    const versionMatch    = code.match(/version\s*:\s*['"]([^'"]+)['"]/)
    const descMatch       = code.match(/description\s*:\s*['"]([^'"]+)['"]/)
    const minutesMatch    = code.match(/estimatedMinutes\s*:\s*(\d+)/)
    const xpMatch         = code.match(/\bxp\s*:\s*(\d+)/)
    const ruleMatch       = code.match(/completionRule\s*:\s*['"]([^'"]+)['"]/)
    const tagsMatch       = code.match(/tags\s*:\s*\[([^\]]*)\]/)

    const type = typeMatch?.[1] === 'leaflet' ? 'leaflet' : 'sentiero'

    const stepsMatch = code.match(/SENSEI_STEPS\s*=\s*(\d+)/)
    let totalSteps = stepsMatch ? parseInt(stepsMatch[1]) : 0
    if (!totalSteps) {
      const ids = [...code.matchAll(/\bid\s*:\s*(\d+)/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n))
      totalSteps = ids.length > 0 ? Math.max(...ids) : 0
    }

    let tags = null
    if (tagsMatch) {
      try {
        const parsed = tagsMatch[1].replace(/['"]/g, '').split(',').map(t => t.trim()).filter(Boolean)
        if (parsed.length > 0) tags = JSON.stringify(parsed)
      } catch (_) {}
    }

    return {
      type,
      totalSteps,
      title:            titleMatch?.[1]   || null,
      version:          versionMatch?.[1] || null,
      description:      descMatch?.[1]    || null,
      estimatedMinutes: minutesMatch      ? parseInt(minutesMatch[1]) : null,
      xp:               xpMatch           ? parseInt(xpMatch[1])      : null,
      completionRule:   ruleMatch?.[1]    || null,
      tags,
    }
  }

  // ── LIVELLO 1: variabili esplicite Sensei ──
  const typeMatch = code.match(/export\s+const\s+SENSEI_TYPE\s*=\s*['"](\w+)['"]/)
  const stepsMatch = code.match(/export\s+const\s+SENSEI_STEPS\s*=\s*(\d+)/)

  if (typeMatch && stepsMatch) {
    return {
      type: typeMatch[1] === 'leaflet' ? 'leaflet' : 'sentiero',
      totalSteps: parseInt(stepsMatch[1]),
    }
  }

  // ── LIVELLO 2: array named ──
  const namedArrayMatch = code.match(/const\s+(STEPS|DAYS|LESSONS|CHAPTERS|MODULES|TASKS|RECIPES|steps|days|lessons)\s*=\s*\[/)
  if (namedArrayMatch) {
    const idMatches  = [...code.matchAll(/[\[,{]\s*\n?\s*id\s*:\s*(\d+)/g)].map(m => parseInt(m[1]))
    const dayMatches = [...code.matchAll(/\bday\s*:\s*(\d+)/g)].map(m => parseInt(m[1]))
    const allNums    = [...idMatches, ...dayMatches].filter(n => !isNaN(n))
    const totalSteps = allNums.length > 0 ? Math.max(...allNums) : allNums.length
    const arrName    = namedArrayMatch[1].toLowerCase()
    if (['recipes', 'ingredients'].includes(arrName)) return { type: 'leaflet', totalSteps }
    if (['days', 'lessons', 'chapters', 'modules'].includes(arrName)) return { type: 'sentiero', totalSteps }
  }

  // ── LIVELLO 3: keywords ──
  const codeLower       = code.toLowerCase()
  const leafletScore    = ['ricetta', 'recipe', 'ingredienti', 'ingredients', 'configuraz', 'guida rapida', 'quick guide', 'scheda', 'reference'].filter(k => codeLower.includes(k)).length
  const sentieroScore   = ['giorni', 'settimane', 'programma', 'percorso', 'challenge', 'curriculum', 'formazione', 'corso'].filter(k => codeLower.includes(k)).length

  // ── LIVELLO 4: conteggio id/day ──
  const stepIds  = [...code.matchAll(/[\[,{]\s*\n?\s*id\s*:\s*(\d+)/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n))
  const dayNums  = [...code.matchAll(/\bday\s*:\s*(\d+)/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n))
  const allNums  = [...stepIds, ...dayNums]
  const totalSteps = allNums.length > 0 ? Math.max(...allNums) : 30

  if (leafletScore > sentieroScore) return { type: 'leaflet', totalSteps }
  if (sentieroScore > leafletScore) return { type: 'sentiero', totalSteps }
  return { type: 'sentiero', totalSteps }
}

const MAX_ARTIFACT_BYTES = 500 * 1024

function contentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 8)
}

function safeCourseId(slug, content) {
  return `${slug}-${contentHash(content)}`
}

// Copia il file scelto nella cartella /courses e lo registra nel database.
// mkdirSync con { recursive: true } garantisce che la cartella esista anche
// al primo avvio o in ambienti in cui non è stata creata manualmente.
ipcMain.handle('import-course', async (event, filePath, customName, icon, color) => {
  try {
    if (!fs.existsSync(filePath))
      return { success: false, error: 'File non trovato' }

    if (!filePath.endsWith('.jsx'))
      return { success: false, error: 'Il file deve avere estensione .jsx' }

    const raw = fs.readFileSync(filePath, 'utf-8')

    if (!raw.trim())
      return { success: false, error: 'Il file è vuoto' }

    if (Buffer.byteLength(raw, 'utf-8') > MAX_ARTIFACT_BYTES)
      return { success: false, error: 'File troppo grande — limite 500 KB' }

    const cleanCode                       = sanitizeContent(raw)
    const { valid, errors, warnings }     = validateContent(cleanCode)

    if (!valid)
      return { success: false, errors }

    const filename    = path.basename(filePath)
    const slug        = filename.replace(/\.jsx$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-')
    const courseId    = safeCourseId(slug, cleanCode)
    const newFilename = `${courseId}.jsx`
    const coursesDir  = path.join(app.getPath('userData'), 'courses')
    const destPath    = path.join(coursesDir, newFilename)

    if (!destPath.startsWith(coursesDir + path.sep))
      return { success: false, error: 'Path non valido' }

    fs.mkdirSync(coursesDir, { recursive: true })
    fs.writeFileSync(destPath, cleanCode, 'utf-8')

    const meta = detectArtifactMeta(cleanCode)
    const { type, totalSteps } = meta
    const name = customName || (meta.title) || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    db.prepare(`
      INSERT OR REPLACE INTO courses
        (id, name, filename, total_days, icon, color, type, tags, estimated_minutes, xp, completion_rule, version, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(courseId, name, newFilename, totalSteps, icon || 'BookOpen', color || '#378ADD', type,
      meta.tags || null, meta.estimatedMinutes || null, meta.xp || null,
      meta.completionRule || null, meta.version || null, meta.description || null)

    return { success: true, courseId, totalSteps, type, warnings: warnings.length ? warnings : undefined }
  } catch (err) {
    return { success: false, error: err.message || "Errore durante l'importazione" }
  }
})

// Legge tutti gli artifact registrati nel database
ipcMain.handle('get-courses', () => {
  return db.prepare('SELECT * FROM courses ORDER BY added_at DESC').all()
})

// Legge il contenuto raw di un file artifact
ipcMain.handle('read-course-file', (event, filename) => {
  const filePath = path.join(app.getPath('userData'), 'courses', filename)
  if (!fs.existsSync(filePath)) return null
  return sanitizeApostrophes(fs.readFileSync(filePath, 'utf-8'))
})

// Serve il bundle IIFE di lucide-react locale (generato in public/ via build script)
ipcMain.handle('get-lucide-bundle', () => {
  const filePath = app.isPackaged
    ? path.join(process.resourcesPath, 'lucide-react.min.js')
    : path.join(app.getAppPath(), 'public/lucide-react.min.js')
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
})

// Salva o aggiorna il progresso di un giorno/step
ipcMain.handle('save-progress', (event, courseId, dayId, completed) => {
  db.prepare(`
    INSERT INTO progress (course_id, day_id, completed, completed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(course_id, day_id) DO UPDATE SET
      completed = excluded.completed,
      completed_at = excluded.completed_at
  `).run(courseId, dayId, completed ? 1 : 0, completed ? Date.now() : null)
  return { success: true }
})

// Legge tutti i progressi di un artifact
ipcMain.handle('get-progress', (event, courseId) => {
  return db.prepare('SELECT * FROM progress WHERE course_id = ?').all(courseId)
})

// Rimuove un artifact dal database e cancella il file dalla cartella courses
ipcMain.handle('remove-course', (event, courseId, filename) => {
  const filePath = path.join(app.getPath('userData'), 'courses', filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  db.prepare('DELETE FROM progress WHERE course_id = ?').run(courseId)
  db.prepare('DELETE FROM course_storage WHERE course_id = ?').run(courseId)
  db.prepare('DELETE FROM courses WHERE id = ?').run(courseId)
  return { success: true }
})

// Legge un valore dallo storage dell'artifact
ipcMain.handle('storage-get', (event, courseId, key) => {
  const row = db.prepare('SELECT value FROM course_storage WHERE course_id = ? AND key = ?').get(courseId, key)
  return row ? { key, value: row.value } : null
})

// Scrive un valore nello storage dell'artifact e sincronizza i progressi
ipcMain.handle('storage-set', (event, courseId, key, value) => {
  db.prepare(`
    INSERT INTO course_storage (course_id, key, value, updated_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(course_id, key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(courseId, key, value)

  // ── SINCRONIZZAZIONE PROGRESSI ──
  // Supporta due formati:
  //   1. Valore diretto: { "1": true, "2": false, ... }
  //   2. Annidato: { completed: { "1": true, ... }, ... }
  try {
    const parsed = JSON.parse(value)

    const upsert = db.prepare(`
      INSERT INTO progress (course_id, day_id, completed, completed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(course_id, day_id) DO UPDATE SET
        completed = excluded.completed,
        completed_at = excluded.completed_at
    `)

    // Helper: sincronizza un oggetto { "1": true, "2": false, ... }
    const syncCompletedObject = (obj) => {
      if (typeof obj !== 'object' || Array.isArray(obj)) return false
      const entries = Object.entries(obj)
      const isCompletedMap = entries.length > 0 && entries.every(([k, v]) =>
        !isNaN(parseInt(k)) && typeof v === 'boolean'
      )
      if (!isCompletedMap) return false
      for (const [dayId, completed] of entries) {
        upsert.run(courseId, parseInt(dayId), completed ? 1 : 0, completed ? Date.now() : null)
      }
      return true
    }

    // Prova formato diretto
    if (syncCompletedObject(parsed)) {
      // sincronizzato direttamente
    }
    // Prova formato annidato
    else if (parsed?.completed) {
      syncCompletedObject(parsed.completed)
    }

  } catch (e) {
    // Il valore non è JSON valido — ignora silenziosamente
  }

  return { key, value }
})

// Elimina un valore dallo storage dell'artifact
ipcMain.handle('storage-delete', (event, courseId, key) => {
  db.prepare('DELETE FROM course_storage WHERE course_id = ? AND key = ?').run(courseId, key)
  return { key, deleted: true }
})

// Lista tutte le chiavi dello storage dell'artifact
ipcMain.handle('storage-list', (event, courseId, prefix) => {
  const rows = prefix
    ? db.prepare('SELECT key FROM course_storage WHERE course_id = ? AND key LIKE ?').all(courseId, `${prefix}%`)
    : db.prepare('SELECT key FROM course_storage WHERE course_id = ?').all(courseId)
  return { keys: rows.map(r => r.key) }
})

// Legge il profilo utente
ipcMain.handle('get-user', () => {
  return db.prepare('SELECT * FROM user WHERE id = 1').get()
})

// Controlla se l'utente ha già visto la schermata di benvenuto
ipcMain.handle('get-welcomed', () => {
  const row = db.prepare('SELECT welcomed FROM user WHERE id = 1').get()
  return row?.welcomed === 1
})

// Segna la schermata di benvenuto come vista
ipcMain.handle('set-welcomed', () => {
  db.prepare('UPDATE user SET welcomed = 1 WHERE id = 1').run()
  return { success: true }
})

// Aggiorna il profilo utente
ipcMain.handle('update-user', (event, name, avatar) => {
  db.prepare('UPDATE user SET name = ?, avatar = ? WHERE id = 1').run(name, avatar)
  return { success: true }
})

// Apre un URL nel browser di sistema — solo https:// con URL valida
ipcMain.handle('open-external', (event, url) => {
  if (typeof url !== 'string') return
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return
    shell.openExternal(url)
  } catch { return }
})

// Restituisce la versione dell'app da package.json
ipcMain.handle('get-app-version', () => app.getVersion())

// ─── ANTHROPIC API KEY ────────────────────────────────────────────────────────

function keyPath() {
  return path.join(app.getPath('userData'), 'anthropic.key')
}

ipcMain.handle('anthropic:save-key', (event, apiKey) => {
  try {
    fs.writeFileSync(keyPath(), apiKey.trim(), 'utf-8')
    fs.chmodSync(keyPath(), 0o600)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('anthropic:has-key', () => {
  if (!fs.existsSync(keyPath())) return false
  return fs.readFileSync(keyPath(), 'utf-8').trim().length > 0
})

ipcMain.handle('anthropic:get-key', () => {
  try {
    if (!fs.existsSync(keyPath())) return null
    return fs.readFileSync(keyPath(), 'utf-8').trim()
  } catch {
    return null
  }
})

// ─── GENERAZIONE ARTIFACT VIA API ────────────────────────────────────────────

ipcMain.handle('anthropic:generate', async (event, { description, systemPrompt }) => {
  try {
    if (!fs.existsSync(keyPath()))
      return { success: false, error: 'API key non configurata. Vai in Impostazioni → API Key.' }

    const apiKey = fs.readFileSync(keyPath(), 'utf-8').trim()
    const keyPreview = apiKey.slice(0, 14) + '…'

    if (!apiKey.startsWith('sk-ant-')) {
      return { success: false, error: `Formato chiave non valido (${keyPreview}). La chiave deve iniziare con sk-ant-` }
    }

    const res = await net.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 32000,
        system: systemPrompt,
        messages: [{ role: 'user', content: description }],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      let errMsg = `HTTP ${res.status}`
      try { errMsg = JSON.parse(body).error?.message || errMsg } catch {}
      console.error('[anthropic:generate] API error', res.status, body)
      return { success: false, error: `${errMsg} (status ${res.status})` }
    }

    const data = await res.json()
    const content = data.content?.[0]?.text
    if (!content) return { success: false, error: 'Risposta vuota dall\'API' }
    return { success: true, content }
  } catch (err) {
    console.error('[anthropic:generate] exception:', err)
    return { success: false, error: err.message }
  }
})

// ─── SALVATAGGIO ARTIFACT GENERATO ───────────────────────────────────────────

function stripMarkdownFence(code) {
  const start = code.indexOf('```')
  if (start === -1) return code.trim()
  const afterLang = code.indexOf('\n', start)
  if (afterLang === -1) return code.trim()
  const lastFence = code.lastIndexOf('\n```')
  if (lastFence <= afterLang) return code.trim()
  return code.slice(afterLang + 1, lastFence).trim()
}

// ─── SANITIZE / VALIDATE (mirror di src/utils/ — main.js è CJS, non importa ESM) ──

const ALLOWED_IMPORTS = ['react', 'lucide-react']
const LUCIDE_SET = (() => {
  try {
    const list = require('../src/utils/lucide-whitelist.json')
    return new Set(list)
  } catch { return new Set() }
})()

// Mappa delle icone lucide-react rinominate in v1.x (vecchio \u2192 nuovo).
// La riscrittura usa l'aliasing ESM: { CircleCheck as CheckCircle }
// cos\u00ec il JSX dell'artifact non va modificato.
const LUCIDE_DEPRECATED = {
  // Cerchi
  CheckCircle:         'CircleCheck',
  CheckCircle2:        'CircleCheckBig',
  AlertCircle:         'CircleAlert',
  AlertOctagon:        'OctagonAlert',
  XCircle:             'CircleX',
  XOctagon:            'OctagonX',
  PlusCircle:          'CirclePlus',
  MinusCircle:         'CircleMinus',
  ArrowUpCircle:       'CircleArrowUp',
  ArrowDownCircle:     'CircleArrowDown',
  ArrowLeftCircle:     'CircleArrowLeft',
  ArrowRightCircle:    'CircleArrowRight',
  ChevronUpCircle:     'CircleChevronUp',
  ChevronDownCircle:   'CircleChevronDown',
  ChevronLeftCircle:   'CircleChevronLeft',
  ChevronRightCircle:  'CircleChevronRight',
  HelpCircle:          'CircleHelp',
  DotCircle:           'CircleDot',
  // Quadrati
  XSquare:             'SquareX',
  PlusSquare:          'SquarePlus',
  MinusSquare:         'SquareMinus',
  // Triangoli / poligoni
  AlertTriangle:       'TriangleAlert',
  // Layout / navigazione
  Home:                'House',
  Grid:                'Grid3x3',
  MoreHorizontal:      'Ellipsis',
  MoreVertical:        'EllipsisVertical',
  ExternalLink:        'SquareArrowOutUpRight',
  // Grafici
  BarChart:            'ChartColumn',
  BarChart2:           'ChartColumnBig',
  LineChart:           'ChartLine',
  AreaChart:           'ChartArea',
  PieChart:            'ChartPie',
  // Loader
  Loader2:             'LoaderCircle',
}

function rewriteDeprecatedLucideIcons(code) {
  return code.replace(
    /^(import\s+\{)([^}]+)(\}\s+from\s+['"]lucide-react['"])/m,
    (_, open, body, close) => {
      const rewritten = body.split(',').map(entry => {
        const [name, alias] = entry.split(/\s+as\s+/)
        const trimmed = name.trim()
        const newName = LUCIDE_DEPRECATED[trimmed]
        if (!newName) return entry
        return alias
          ? ` ${newName} as ${alias.trim()}`
          : ` ${newName} as ${trimmed}`
      })
      return `${open}${rewritten.join(',')}${close}`
    }
  )
}

function sanitizeContent(code) {
  let s = code
  s = s.replace(/^[\ufeff\u200b\u200c\u200d\u2060\ufffe]+/, '')
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const isNewFormat = /export\s+default\s+\{/.test(s) && /\bcomponent\s*:/.test(s)
  if (!isNewFormat) {
    const fenceStart = s.indexOf('```')
    if (fenceStart !== -1) {
      const afterLang = s.indexOf('\n', fenceStart)
      if (afterLang !== -1) {
        const lastFence = s.lastIndexOf('\n```')
        if (lastFence > afterLang) s = s.slice(afterLang + 1, lastFence)
      }
    }
  }
  s = s.replace(/[\u2018\u2019]/g, "'")
  s = s.replace(/[\u201c\u201d]/g, '"')
  s = sanitizeApostrophes(s)
  s = rewriteDeprecatedLucideIcons(s)
  return s.trim()
}

const VALID_COMPLETION_RULES = ['all-steps', 'any-step', 'manual']

function validateContent(content) {
  const errors   = []
  const warnings = []

  const isNewFormat      = /export\s+default\s+\{/.test(content) && /\bcomponent\s*:/.test(content)
  const hasExportDefault = /export\s+default\s+/m.test(content)

  if (!hasExportDefault) {
    errors.push("Manca export default — il componente principale non \xe8 esportato")
    return { valid: false, errors, warnings }
  }

  const importMatches = [...content.matchAll(/^import\s+.+\s+from\s+['"]([^'"]+)['"]/gm)]
  const forbidden = importMatches.map(m => m[1]).filter(src => !ALLOWED_IMPORTS.includes(src))
  if (forbidden.length > 0)
    errors.push(`Import non consentiti: ${forbidden.join(', ')} — usa solo react e lucide-react`)

  if (LUCIDE_SET.size > 0) {
    const lucideImport = content.match(/^import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/m)
    if (lucideImport) {
      const icons = lucideImport[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
      const unknown = icons.filter(name => !LUCIDE_SET.has(name))
      if (unknown.length > 0)
        warnings.push(`Icone non riconosciute: ${unknown.join(', ')} — verranno omesse a runtime`)
    }
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
    if (!/meta\s*:\s*\{/.test(content))
      errors.push("meta: blocco mancante nel Sensei Artifact Standard")
    if (!/title\s*:\s*["'][^"']+["']/.test(content))
      errors.push("meta.title mancante o non e' una stringa non vuota")
    if (!/type\s*:\s*["'](sentiero|leaflet)["']/.test(content))
      errors.push("meta.type deve essere 'sentiero' o 'leaflet'")
    if (!/version\s*:\s*["'][^"']+["']/.test(content))
      errors.push("meta.version mancante o non e' una stringa")
    if (!/\bcomponent\s*:\s*\w/.test(content))
      errors.push("component mancante — deve referenziare il componente React principale")
    if (!/\bxp\s*:\s*\d+/.test(content))
      errors.push("gamification.xp mancante o non e' un numero")
    if (!VALID_COMPLETION_RULES.some(r => content.includes(`"${r}"`) || content.includes(`'${r}'`)))
      errors.push("gamification.completionRule deve essere 'all-steps', 'any-step' o 'manual'")
  } else {
    warnings.push("Formato legacy — considera la migrazione al Sensei Artifact Standard")
    if (!/export\s+const\s+SENSEI_TYPE\s*=/.test(content))
      warnings.push("SENSEI_TYPE non trovato — Sensei potrebbe non riconoscere il tipo dell'artifact")
    if (!/export\s+const\s+SENSEI_STEPS\s*=/.test(content))
      warnings.push("SENSEI_STEPS non trovato — il conteggio degli step potrebbe non essere corretto")
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Corregge apostrofi dritti non escaped dentro stringhe con virgolette singole.
// Es: description: 'l'acqua' → description: 'l'acqua'
// Lascia intatti gli apostrofi già escaped (l\'acqua) e i template literal.
function sanitizeApostrophes(code) {
  return code.split('\n').map(line => {
    const m = line.match(/^(\s*\w+\s*:\s*')(.*)',?\s*$/)
    if (!m) return line
    const content = m[2]
    const unescaped = (content.match(/'/g) || []).length
    if (unescaped === 0) return line
    const safe     = content.replace(/"/g, '\\"')
    const hasComma = line.trimEnd().endsWith("',")
    const from     = hasComma ? `'${content}',` : `'${content}'`
    const to       = hasComma ? `"${safe}",`    : `"${safe}"`
    return line.replace(from, to)
  }).join('\n')
}

ipcMain.handle('artifact:save', (event, { content, filename, name, icon, color }) => {
  try {
    if (Buffer.byteLength(content, 'utf-8') > MAX_ARTIFACT_BYTES)
      return { success: false, error: 'Artifact troppo grande — limite 500 KB' }

    const safeFilename = filename.endsWith('.jsx') ? filename : `${filename}.jsx`
    const slug         = safeFilename.replace(/\.jsx$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-')
    const cleanContent = sanitizeApostrophes(stripMarkdownFence(content))
    const courseId     = safeCourseId(slug, cleanContent)
    const newFilename  = `${courseId}.jsx`
    const coursesDir   = path.join(app.getPath('userData'), 'courses')
    const savePath     = path.join(coursesDir, newFilename)

    if (!savePath.startsWith(coursesDir + path.sep))
      return { success: false, error: 'Path non valido' }

    fs.mkdirSync(coursesDir, { recursive: true })
    fs.writeFileSync(savePath, cleanContent, 'utf-8')

    const meta      = detectArtifactMeta(content)
    const { type, totalSteps } = meta
    const finalName = name || meta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    db.prepare(`
      INSERT OR REPLACE INTO courses
        (id, name, filename, total_days, icon, color, type, tags, estimated_minutes, xp, completion_rule, version, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(courseId, finalName, newFilename, totalSteps, icon || 'BookOpen', color || '#378ADD', type,
      meta.tags || null, meta.estimatedMinutes || null, meta.xp || null,
      meta.completionRule || null, meta.version || null, meta.description || null)

    return { success: true, courseId }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── LOG ERRORI ARTIFACT ──────────────────────────────────────────────────────

ipcMain.handle('artifact:log-error', (event, { filename, errors, source, timestamp }) => {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(logsDir, { recursive: true })
    const logPath = path.join(logsDir, 'artifact-errors.jsonl')
    const entry   = JSON.stringify({ filename, errors, source, timestamp }) + '\n'
    fs.appendFileSync(logPath, entry, 'utf-8')
  } catch {
    // fire and forget — non blocca mai il flusso principale
  }
})

// ─── EXPORT ARTIFACT SINGOLO ─────────────────────────────────────────────────

ipcMain.handle('artifact:export-single', async (_, filename) => {
  try {
    const coursesDir = path.join(app.getPath('userData'), 'courses')
    const srcPath    = path.join(coursesDir, filename)
    if (!fs.existsSync(srcPath))
      return { success: false, error: 'File non trovato' }

    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: 'Sensei Artifact', extensions: ['jsx'] }],
    })
    if (canceled || !savePath) return { success: false, canceled: true }

    fs.writeFileSync(savePath, fs.readFileSync(srcPath, 'utf-8'), 'utf-8')
    return { success: true, path: savePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── EXPORT ARTIFACT MULTIPLO (.zip) ─────────────────────────────────────────

ipcMain.handle('artifact:export-multiple', async (_, artifacts) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      defaultPath: `sensei-export-${today}.zip`,
      filters: [{ name: 'Sensei Export', extensions: ['zip'] }],
    })
    if (canceled || !savePath) return { success: false, canceled: true }

    const coursesDir = path.join(app.getPath('userData'), 'courses')
    const now = new Date().toISOString()

    const manifest = {
      exportDate:  now,
      exportedBy:  `Sensei v${app.getVersion()}`,
      artifacts: artifacts.map(a => ({
        filename: a.filename,
        title:    a.name || a.filename,
        type:     a.type || 'sentiero',
        tags:     a.tags ? (typeof a.tags === 'string' ? (() => { try { return JSON.parse(a.tags) } catch { return [] } })() : a.tags) : [],
        xp:       a.xp || 0,
        exportedAt: now,
      })),
    }

    await new Promise((resolve, reject) => {
      const output  = fs.createWriteStream(savePath)
      const archive = archiver('zip', { zlib: { level: 6 } })
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)

      for (const a of artifacts) {
        const filePath = path.join(coursesDir, a.filename)
        if (fs.existsSync(filePath)) archive.file(filePath, { name: a.filename })
      }

      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
      archive.finalize()
    })

    return { success: true, path: savePath, count: artifacts.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── EXPORT PROGRESSO (JSON) ──────────────────────────────────────────────────

function computeStreak(msTimestamps) {
  const daySet = new Set(msTimestamps.filter(Boolean).map(ts => new Date(ts).toISOString().slice(0, 10)))
  const days   = [...daySet].sort()
  if (!days.length) return { current: 0, longest: 0 }

  let longest = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((new Date(days[i]) - new Date(days[i - 1])) / 86400000)
    run = gap === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  let current = 0
  let check = new Date(); check.setHours(0, 0, 0, 0)
  while (daySet.has(check.toISOString().slice(0, 10))) {
    current++
    check = new Date(check - 86400000)
  }
  if (current === 0) {
    check = new Date(Date.now() - 86400000); check.setHours(0, 0, 0, 0)
    while (daySet.has(check.toISOString().slice(0, 10))) {
      current++
      check = new Date(check - 86400000)
    }
  }
  return { current, longest }
}

ipcMain.handle('progress:export', async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      defaultPath: `sensei-progress-${today}.json`,
      filters: [{ name: 'Sensei Progress', extensions: ['json'] }],
    })
    if (canceled || !savePath) return { success: false, canceled: true }

    const allCourses  = db.prepare('SELECT * FROM courses').all()
    const allProgress = db.prepare('SELECT * FROM progress WHERE completed = 1').all()

    const timestamps  = allProgress.map(p => p.completed_at).filter(Boolean)
    const streak      = computeStreak(timestamps)
    const lastTs      = timestamps.length ? Math.max(...timestamps) : null
    const lastActivity = lastTs ? new Date(lastTs).toISOString() : null

    const progressByCourse = {}
    for (const p of allProgress) {
      progressByCourse[p.course_id] = (progressByCourse[p.course_id] || 0) + 1
    }

    let totalXP = 0
    const artifactsOut = {}
    for (const course of allCourses) {
      const completed = progressByCourse[course.id] || 0
      const isCompleted = course.total_days > 0 && completed >= course.total_days
      if (isCompleted && course.xp) totalXP += course.xp

      const courseSteps = allProgress.filter(p => p.course_id === course.id)
      const lastStep = courseSteps
        .filter(p => p.completed_at)
        .sort((a, b) => b.completed_at - a.completed_at)[0]

      artifactsOut[course.filename] = {
        stepsCompleted: completed,
        totalSteps:     course.total_days || 0,
        completedAt:    isCompleted && lastStep ? new Date(lastStep.completed_at).toISOString() : null,
        xpEarned:       isCompleted && course.xp ? course.xp : 0,
      }
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: `Sensei v${app.getVersion()}`,
      stats: {
        totalXP,
        currentStreak:  streak.current,
        longestStreak:  streak.longest,
        totalCompleted: allProgress.length,
        lastActivity,
      },
      artifacts: artifactsOut,
    }

    fs.writeFileSync(savePath, JSON.stringify(exportData, null, 2), 'utf-8')
    return { success: true, path: savePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── IMPORT ARTIFACT DA .zip ──────────────────────────────────────────────────

ipcMain.handle('artifact:import-zip', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters:    [{ name: 'Sensei Export', extensions: ['zip'] }],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return { success: false, canceled: true }

    const zip = new AdmZip(filePaths[0])

    const manifestEntry = zip.getEntry('manifest.json')
    if (!manifestEntry)
      return { success: false, error: 'File zip non valido — manifest.json mancante' }

    let manifest
    try {
      manifest = JSON.parse(manifestEntry.getData().toString('utf-8'))
    } catch {
      return { success: false, error: 'manifest.json non valido o corrotto' }
    }

    if (!manifest.artifacts || !Array.isArray(manifest.artifacts))
      return { success: false, error: 'Formato manifest non riconosciuto — non è un export Sensei' }

    const coursesDir = path.join(app.getPath('userData'), 'courses')
    fs.mkdirSync(coursesDir, { recursive: true })

    let imported = 0
    const skipped = []

    for (const artifactMeta of manifest.artifacts) {
      const origFilename = artifactMeta.filename
      if (!origFilename || !origFilename.endsWith('.jsx')) continue

      const entry = zip.getEntry(origFilename)
      if (!entry) { skipped.push(origFilename); continue }

      const rawBuf = entry.getData()
      if (rawBuf.length > MAX_ARTIFACT_BYTES) { skipped.push(origFilename); continue }
      const raw = rawBuf.toString('utf-8')
      const cleanCode = sanitizeContent(raw)

      const slug      = origFilename.replace(/\.jsx$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-')
      const courseId  = safeCourseId(slug, cleanCode)
      const newFilename = `${courseId}.jsx`
      const destPath  = path.join(coursesDir, newFilename)

      if (!destPath.startsWith(coursesDir + path.sep)) { skipped.push(origFilename); continue }

      // Skip se esiste già un file con lo stesso id (stesso contenuto)
      const existing = db.prepare("SELECT id FROM courses WHERE id = ?").get(courseId)
      if (existing) { skipped.push(origFilename); continue }

      fs.writeFileSync(destPath, cleanCode, 'utf-8')

      const meta  = detectArtifactMeta(cleanCode)
      const name  = artifactMeta.title || meta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

      db.prepare(`
        INSERT OR REPLACE INTO courses
          (id, name, filename, total_days, icon, color, type, tags, estimated_minutes, xp, completion_rule, version, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        courseId, name, newFilename, meta.totalSteps || 0,
        'BookOpen', '#378ADD',
        meta.type || artifactMeta.type || 'sentiero',
        meta.tags || null, meta.estimatedMinutes || null,
        meta.xp || artifactMeta.xp || null,
        meta.completionRule || null, meta.version || null, meta.description || null
      )

      imported++
    }

    return { success: true, imported, skipped }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── CONTROLLI FINESTRA CUSTOM ───────────────────────────────────────────────

// Minimizza la finestra
ipcMain.handle('window-minimize', () => {
  BrowserWindow.getFocusedWindow()?.minimize()
})

// Massimizza o ripristina la finestra
ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.isMaximized() ? win.unmaximize() : win.maximize()
})

// Chiude la finestra
ipcMain.handle('window-close', () => {
  BrowserWindow.getFocusedWindow()?.close()
})

// Restituisce se la finestra è massimizzata
ipcMain.handle('window-is-maximized', () => {
  return BrowserWindow.getFocusedWindow()?.isMaximized() || false
})

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})