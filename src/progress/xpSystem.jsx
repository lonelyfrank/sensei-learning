// Sistema XP e livelli di Sensei
// Ogni step completato dà XP, i livelli sbloccano titoli in stile arti marziali

export const LEVELS = [
  { name: 'Mugei',   kanji: '無芸', min: 0,    max: 99,       color: '#a0a0a0', desc: 'Nessuna arte — il viaggio inizia' },
  { name: 'Kohai',   kanji: '後輩', min: 100,  max: 299,      color: '#378ADD', desc: 'Allievo junior — stai imparando' },
  { name: 'Senpai',  kanji: '先輩', min: 300,  max: 599,      color: '#7F77DD', desc: 'Allievo senior — la disciplina cresce' },
  { name: 'Shihan',  kanji: '師範', min: 600,  max: 999,      color: '#1D9E75', desc: 'Maestro istruttore — guidi gli altri' },
  { name: 'Sensei',  kanji: '先生', min: 1000, max: Infinity, color: '#f7c948', desc: 'Il maestro — hai padroneggiato la via' },
]

// Calcola XP totali dai progressi
// 10 XP per step completato + 50 XP bonus per sentiero completato al 100%
export function calculateXP(allProgress, courses) {
  let xp = 0
  allProgress.forEach(({ course, progress }) => {
    const completed = progress.filter(p => p.completed).length
    xp += completed * 10
    const total = course.total_days || 1
    if (completed >= total && total > 0) xp += 50
  })
  return xp
}

// Restituisce il livello corrente in base agli XP
export function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

// Restituisce il livello successivo — null se al massimo
export function getNextLevel(xp) {
  const current = getLevel(xp)
  const idx = LEVELS.findIndex(l => l.name === current.name)
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
}

// Percentuale progresso verso il livello successivo (0-100)
export function getLevelProgress(xp) {
  const current = getLevel(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  const range = next.min - current.min
  const progress = xp - current.min
  return Math.round((progress / range) * 100)
}