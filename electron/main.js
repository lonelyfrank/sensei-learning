const { app, BrowserWindow } = require('electron')
const path = require('path')

// Controlla se siamo in modalità sviluppo
// In dev Electron carica Vite, in produzione carica i file compilati
const isDev = process.env.NODE_ENV === 'development'

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