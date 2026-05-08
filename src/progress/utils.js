// ─── utils.js ─────────────────────────────────────────────────────────────────
// Funzioni di calcolo per statistiche di progresso e attività

/* Calcola streak giorni consecutivi a partire da una lista di timestamp Unix (secondi).
   Conta ogni giorno distinto in sequenza partendo da ieri/oggi. */
export function calculateStreak(timestamps) {
  if (timestamps.length === 0) return 0

  // Deduplica e ordina i giorni dal più recente (t è in ms — Date.now())
  const days = [...new Set(timestamps.map(t =>
    new Date(t).toISOString().split('T')[0]
  ))].sort().reverse()

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const day of days) {
    const d = new Date(day)
    const diff = Math.round((current - d) / (1000 * 60 * 60 * 24))
    // diff=0 → oggi, diff=1 → ieri: entrambi contano come consecutivi
    if (diff <= 1) { streak++; current = d }
    else break
  }
  return streak
}

/* Calcola attività per gli ultimi N giorni — restituisce array { date, count }.
   Usa una Map data→conteggio (O(n)) invece di filtrare per ogni giorno (O(n×m)). */
export function calculateActivity(timestamps, days) {
  // Precalcola un Map data ISO → numero di step completati quel giorno (t in ms)
  const countMap = new Map()
  for (const t of timestamps) {
    const dateStr = new Date(t).toISOString().split('T')[0]
    countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1)
  }

  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({ date: dateStr, count: countMap.get(dateStr) || 0 })
  }
  return result
}