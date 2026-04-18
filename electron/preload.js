const { contextBridge, ipcRenderer } = require('electron')

// contextBridge espone funzioni sicure a React
// React le vedrà come window.sensei.nomeMetodo()
contextBridge.exposeInMainWorld('sensei', {

  // Legge i corsi dalla cartella /courses
  getCourses: () => ipcRenderer.invoke('get-courses'),

  // Salva un progresso (es. giorno completato)
  saveProgress: (courseId, dayId, completed) =>
    ipcRenderer.invoke('save-progress', courseId, dayId, completed),

  // Legge i progressi di un corso
  getProgress: (courseId) =>
    ipcRenderer.invoke('get-progress', courseId),

})