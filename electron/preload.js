const { contextBridge, ipcRenderer } = require('electron')

// contextBridge espone funzioni sicure a React
// React le vedrà come window.sensei.nomeMetodo()
// ipcRenderer invia messaggi al processo principale (main.js)
contextBridge.exposeInMainWorld('sensei', {
  // Apre il dialog di sistema per scegliere un file .jsx
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Importa un corso copiandolo nella cartella /courses e registrandolo nel db
  importCourse: (filePath) => ipcRenderer.invoke('import-course', filePath),

  // Legge tutti i corsi registrati nel database
  getCourses: () => ipcRenderer.invoke('get-courses'),

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
    get: (key) => ipcRenderer.invoke('storage-get', window.__currentCourseId, key),
    set: (key, value) => ipcRenderer.invoke('storage-set', window.__currentCourseId, key, value),
    delete: (key) => ipcRenderer.invoke('storage-delete', window.__currentCourseId, key),
    list: (prefix) => ipcRenderer.invoke('storage-list', window.__currentCourseId, prefix),
  },

  // Profilo utente
  getUser: () => ipcRenderer.invoke('get-user'),
  updateUser: (name, avatar) => ipcRenderer.invoke('update-user', name, avatar),

})