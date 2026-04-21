const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// Controlla se siamo in modalità sviluppo
const isDev = process.env.NODE_ENV === 'development'

// Importa il database
const db = require('../src/db/database.js')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
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

  // ── LIVELLO 1: variabili esplicite Sensei ──
  const typeMatch = code.match(/export\s+const\s+SENSEI_TYPE\s*=\s*['"](\w+)['"]/)
  const stepsMatch = code.match(/export\s+const\s+SENSEI_STEPS\s*=\s*(\d+)/)

  if (typeMatch && stepsMatch) {
    return {
      type: typeMatch[1] === 'leaflet' ? 'leaflet' : 'sentiero',
      totalSteps: parseInt(stepsMatch[1]),
    }
  }

  // ── LIVELLO 2: array named — cerca array di oggetti comuni ──
  // Supporta: STEPS, DAYS, LESSONS, CHAPTERS, RECIPES, INGREDIENTS, MODULES, TASKS
  const arrayPatterns = [
    /const\s+STEPS\s*=\s*\[/,
    /const\s+DAYS\s*=\s*\[/,
    /const\s+LESSONS\s*=\s*\[/,
    /const\s+CHAPTERS\s*=\s*\[/,
    /const\s+MODULES\s*=\s*\[/,
    /const\s+TASKS\s*=\s*\[/,
    /const\s+RECIPES\s*=\s*\[/,
    /const\s+INGREDIENTS\s*=\s*\[/,
    /const\s+steps\s*=\s*\[/,
    /const\s+days\s*=\s*\[/,
  ]

  // Cerca il nome dell'array per contarne gli elementi
  const namedArrayMatch = code.match(/const\s+(STEPS|DAYS|LESSONS|CHAPTERS|MODULES|TASKS|RECIPES|steps|days|lessons)\s*=\s*\[/)
  if (namedArrayMatch) {
    // Conta le occorrenze di { id: N } o { day: N } dentro l'array
    const idMatches = [...code.matchAll(/[\[,{]\s*\n?\s*id\s*:\s*(\d+)/g)].map(m => parseInt(m[1]))
    const dayMatches = [...code.matchAll(/\bday\s*:\s*(\d+)/g)].map(m => parseInt(m[1]))
    const allNums = [...idMatches, ...dayMatches].filter(n => !isNaN(n))
    const totalSteps = allNums.length > 0 ? Math.max(...allNums) : allNums.length

    // Inferisce il tipo dal nome dell'array
    const arrName = namedArrayMatch[1].toLowerCase()
    const isLeafletArray = ['recipes', 'ingredients'].includes(arrName)
    const isSentieroArray = ['days', 'lessons', 'chapters', 'modules'].includes(arrName)

    if (isLeafletArray) return { type: 'leaflet', totalSteps }
    if (isSentieroArray) return { type: 'sentiero', totalSteps }
    // STEPS e steps sono ambigui — continua con keywords
  }

  // ── LIVELLO 3: keywords nel testo ──
  const codeLower = code.toLowerCase()

  const leafletKeywords = ['ricetta', 'recipe', 'ingredienti', 'ingredients', 'configuraz', 'guida rapida', 'quick guide', 'scheda', 'reference']
  const sentieroKeywords = ['giorni', 'settimane', 'programma', 'percorso', 'challenge', 'curriculum', 'formazione', 'corso']

  const leafletScore = leafletKeywords.filter(k => codeLower.includes(k)).length
  const sentieroScore = sentieroKeywords.filter(k => codeLower.includes(k)).length

  // ── LIVELLO 4: regex id/day — conteggio step ──
  const stepIds = [...code.matchAll(/[\[,{]\s*\n?\s*id\s*:\s*(\d+)/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n))
  const dayNums = [...code.matchAll(/\bday\s*:\s*(\d+)/g)].map(m => parseInt(m[1])).filter(n => !isNaN(n))
  const allNums = [...stepIds, ...dayNums]
  const totalSteps = allNums.length > 0 ? Math.max(...allNums) : 30

  // Determina il tipo in base al punteggio keywords
  if (leafletScore > sentieroScore) return { type: 'leaflet', totalSteps }
  if (sentieroScore > leafletScore) return { type: 'sentiero', totalSteps }

  // ── LIVELLO 5: default ──
  return { type: 'sentiero', totalSteps }
}

// Copia il file scelto nella cartella /courses e lo registra nel database
ipcMain.handle('import-course', async (event, filePath, customName, icon, color) => {
  const filename = path.basename(filePath)
  const courseId = filename.replace('.jsx', '')
  const destPath = path.join(app.getAppPath(), 'courses', filename)

  fs.copyFileSync(filePath, destPath)

  const code = fs.readFileSync(filePath, 'utf-8')

  // Rileva tipo e numero di step con il sistema a cascata
  const { type, totalSteps } = detectArtifactMeta(code)

  const name = customName || courseId

  db.prepare(`
    INSERT OR REPLACE INTO courses (id, name, filename, total_days, icon, color, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(courseId, name, filename, totalSteps, icon || 'BookOpen', color || '#378ADD', type)

  return { success: true, courseId, totalSteps, type }
})

// Legge tutti gli artifact registrati nel database
ipcMain.handle('get-courses', () => {
  return db.prepare('SELECT * FROM courses ORDER BY added_at DESC').all()
})

// Legge il contenuto raw di un file artifact
ipcMain.handle('read-course-file', (event, filename) => {
  const filePath = path.join(app.getAppPath(), 'courses', filename)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
})

// Serve il bundle UMD di lucide-react locale
ipcMain.handle('get-lucide-bundle', () => {
  const filePath = path.join(app.getAppPath(), 'node_modules/lucide-react/dist/umd/lucide-react.min.js')
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
  const filePath = path.join(app.getAppPath(), 'courses', filename)
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

// Aggiorna il profilo utente
ipcMain.handle('update-user', (event, name, avatar) => {
  db.prepare('UPDATE user SET name = ?, avatar = ? WHERE id = 1').run(name, avatar)
  return { success: true }
})

// Apre un URL nel browser di sistema
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
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