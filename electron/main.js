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
    // Rimuove la toolbar nativa di Electron
    frame: false,
    titleBarStyle: 'hidden',
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
    filters: [{ name: 'Corsi Sensei', extensions: ['jsx'] }],
  })
  return result
})

// Copia il file scelto nella cartella /courses e lo registra nel database
ipcMain.handle('import-course', async (event, filePath, customName, icon, color) => {
  const filename = path.basename(filePath)
  const courseId = filename.replace('.jsx', '')
  const destPath = path.join(app.getAppPath(), 'courses', filename)

  fs.copyFileSync(filePath, destPath)

  const code = fs.readFileSync(filePath, 'utf-8')
  const dayNums = [...code.matchAll(/\{\s*day\s*:\s*(\d+)/g)].map(m => parseInt(m[1]))
  const totalDays = dayNums.length > 0 ? Math.max(...dayNums) : 30
  const name = customName || courseId

  db.prepare(`
    INSERT OR REPLACE INTO courses (id, name, filename, total_days, icon, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(courseId, name, filename, totalDays, icon || 'BookOpen', color || '#378ADD')

  return { success: true, courseId, totalDays }
})

// Legge tutti i corsi registrati nel database
ipcMain.handle('get-courses', () => {
  return db.prepare('SELECT * FROM courses ORDER BY added_at DESC').all()
})

// Legge il contenuto raw di un file corso
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

// Salva o aggiorna il progresso di un giorno
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

// Legge tutti i progressi di un corso
ipcMain.handle('get-progress', (event, courseId) => {
  return db.prepare('SELECT * FROM progress WHERE course_id = ?').all(courseId)
})

// Rimuove un corso dal database e cancella il file dalla cartella courses
ipcMain.handle('remove-course', (event, courseId, filename) => {
  const filePath = path.join(app.getAppPath(), 'courses', filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  db.prepare('DELETE FROM progress WHERE course_id = ?').run(courseId)
  db.prepare('DELETE FROM courses WHERE id = ?').run(courseId)
  return { success: true }
})

// Legge un valore dallo storage del corso
ipcMain.handle('storage-get', (event, courseId, key) => {
  const row = db.prepare('SELECT value FROM course_storage WHERE course_id = ? AND key = ?').get(courseId, key)
  return row ? { key, value: row.value } : null
})

// Scrive un valore nello storage del corso e sincronizza i progressi
ipcMain.handle('storage-set', (event, courseId, key, value) => {
  db.prepare(`
    INSERT INTO course_storage (course_id, key, value, updated_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(course_id, key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(courseId, key, value)

  try {
    const parsed = JSON.parse(value)
    const upsert = db.prepare(`
      INSERT INTO progress (course_id, day_id, completed, completed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(course_id, day_id) DO UPDATE SET
        completed = excluded.completed,
        completed_at = excluded.completed_at
    `)
    if (key === 'completed' && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [dayId, completed] of Object.entries(parsed)) {
        upsert.run(courseId, parseInt(dayId), completed ? 1 : 0, completed ? Date.now() : null)
      }
    }
    if (parsed?.completed && typeof parsed.completed === 'object') {
      for (const [dayId, completed] of Object.entries(parsed.completed)) {
        upsert.run(courseId, parseInt(dayId), completed ? 1 : 0, completed ? Date.now() : null)
      }
    }
  } catch (e) {}

  return { key, value }
})

// Elimina un valore dallo storage del corso
ipcMain.handle('storage-delete', (event, courseId, key) => {
  db.prepare('DELETE FROM course_storage WHERE course_id = ? AND key = ?').run(courseId, key)
  return { key, deleted: true }
})

// Lista tutte le chiavi dello storage del corso
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