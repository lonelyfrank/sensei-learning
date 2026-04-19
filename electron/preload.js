const { contextBridge, ipcRenderer } = require('electron')

// contextBridge espone funzioni sicure a React
// React le vedrà come window.sensei.nomeMetodo()
// ipcRenderer invia messaggi al processo principale (main.js)
contextBridge.exposeInMainWorld('sensei', {
  // Controlli finestra
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Apre il dialog di sistema per scegliere un file .jsx
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Importa un corso copiandolo nella cartella /courses e registrandolo nel db
  importCourse: (filePath, name, icon, color) => ipcRenderer.invoke('import-course', filePath, name, icon, color),

  // Legge tutti i corsi registrati nel database
  getCourses: () => ipcRenderer.invoke('get-courses'),

  // Legge il contenuto raw del file JSX del corso
  readCourseFile: (filename) => ipcRenderer.invoke('read-course-file', filename),
  
  // Serve il bundle UMD di lucide-react locale
  getLucideBundle: () => ipcRenderer.invoke('get-lucide-bundle'),

  // Salva o aggiorna il progresso di un giorno
  saveProgress: (courseId, dayId, completed) =>
    ipcRenderer.invoke('save-progress', courseId, dayId, completed),

  // Legge tutti i progressi di un corso
  getProgress: (courseId) =>
    ipcRenderer.invoke('get-progress', courseId),

  // Rimuove un corso dal database e dal filesystem
  removeCourse: (courseId, filename) =>
    ipcRenderer.invoke('remove-course', courseId, filename),

  // Storage API per i corsi — sostituisce window.storage degli artifact Claude
  storage: {
    get: (key, courseId) => ipcRenderer.invoke('storage-get', courseId, key),
    set: (key, value, courseId) => ipcRenderer.invoke('storage-set', courseId, key, value),
    delete: (key, courseId) => ipcRenderer.invoke('storage-delete', courseId, key),
    list: (prefix, courseId) => ipcRenderer.invoke('storage-list', courseId, prefix),
  },

  // Profilo utente
  getUser: () => ipcRenderer.invoke('get-user'),
  updateUser: (name, avatar) => ipcRenderer.invoke('update-user', name, avatar),

  // Apre un URL nel browser esterno del sistema
  openExternal: (url) => ipcRenderer.invoke('open-external', url), 

})