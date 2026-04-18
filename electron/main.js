const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// Controlla se siamo in modalità sviluppo
const isDev = process.env.NODE_ENV === 'development'

// Importa il database
const db = require('../src/db/database.js')

function createWindow() {
  // Crea la finestra principale dell'app
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // preload.js è il ponte sicuro tra React e il sistema operativo
      preload: path.join(__dirname, 'preload.js'),
      // contextIsolation: true — il codice React non ha accesso diretto a Node.js
      contextIsolation: true,
      // nodeIntegration: false — sicurezza, i corsi JSX non possono accedere al filesystem
      nodeIntegration: false,
    },
  })

  if (isDev) {
    // Sviluppo: carica il server Vite locale
    win.loadURL('http://localhost:5173')
  } else {
    // Produzione: carica i file compilati da Vite
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─ IPC HANDLERS 

// Apre il dialog di sistema per scegliere un file .jsx da importare
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Corsi Sensei', extensions: ['jsx'] }],
  })
  return result
})

// Copia il file scelto nella cartella /courses e lo registra nel database
ipcMain.handle('import-course', async (event, filePath) => {
  const filename = path.basename(filePath)
  const courseId = filename.replace('.jsx', '')
  const destPath = path.join(app.getAppPath(), 'courses', filename)

  // Copia il file nella cartella courses
  fs.copyFileSync(filePath, destPath)

  // Registra il corso nel database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO courses (id, name, filename)
    VALUES (?, ?, ?)
  `)
  stmt.run(courseId, courseId, filename)

  return { success: true, courseId }
})

// Legge tutti i corsi registrati nel database
ipcMain.handle('get-courses', () => {
  return db.prepare('SELECT * FROM courses ORDER BY added_at DESC').all()
})

// Salva o aggiorna il progresso di un giorno
ipcMain.handle('save-progress', (event, courseId, dayId, completed) => {
  const stmt = db.prepare(`
    INSERT INTO progress (course_id, day_id, completed, completed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(course_id, day_id) DO UPDATE SET
      completed = excluded.completed,
      completed_at = excluded.completed_at
  `)
  stmt.run(courseId, dayId, completed ? 1 : 0, completed ? Date.now() : null)
  return { success: true }
})

// Legge tutti i progressi di un corso
ipcMain.handle('get-progress', (event, courseId) => {
  return db.prepare('SELECT * FROM progress WHERE course_id = ?').all(courseId)
})

// ─ APP LIFECYCLE

// Quando Electron è pronto, apri la finestra
app.whenReady().then(createWindow)

// Chiudi l'app quando tutte le finestre sono chiuse (comportamento Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Su Mac, riapri la finestra se l'icona nel dock viene cliccata
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})