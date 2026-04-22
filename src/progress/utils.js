// Funzioni di calcolo per statistiche e attività

/* Calcola streak giorni consecutivi a partire da una lista di timestamp */
export function calculateStreak(timestamps) {
  if (timestamps.length === 0) return 0
  const days = [...new Set(timestamps.map(t =>
    new Date(t).toISOString().split('T')[0]
  ))].sort().reverse()

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const day of days) {
    const d = new Date(day)
    const diff = Math.round((current - d) / (1000 * 60 * 60 * 24))
    if (diff <= 1) { streak++; current = d }
    else break
  }
  return streak
}

/* Calcola attività per gli ultimi N giorni — restituisce array { date, count } */
export function calculateActivity(timestamps, days) {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const count = timestamps.filter(t =>
      new Date(t).toISOString().split('T')[0] === dateStr
    ).length
    result.push({ date: dateStr, count })
  }
  return result
}