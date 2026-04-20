// Sistema badge — achievement sbloccabili in base ai progressi
// Ogni badge ha un id, nome, descrizione, icona emoji e condizione di sblocco

export const BADGES = [
  {
    id: 'first_step',
    name: 'Primo passo',
    kanji: '一歩',
    description: 'Completa il tuo primo step',
    icon: '👣',
    color: '#378ADD',
    check: ({ totalCompleted }) => totalCompleted >= 1,
  },
  {
    id: 'streak_3',
    name: 'Costante',
    kanji: '継続',
    description: '3 giorni di streak consecutivi',
    icon: '🔥',
    color: '#D85A30',
    check: ({ streak }) => streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Samurai',
    kanji: '七日',
    description: '7 giorni di streak consecutivi',
    icon: '⚔️',
    color: '#7F77DD',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Leggenda',
    kanji: '伝説',
    description: '30 giorni di streak consecutivi',
    icon: '👑',
    color: '#f7c948',
    check: ({ streak }) => streak >= 30,
  },
  {
    id: 'first_complete',
    name: 'Completista',
    kanji: '完成',
    description: 'Completa il tuo primo sentiero al 100%',
    icon: '🎯',
    color: '#1D9E75',
    check: ({ completedCourses }) => completedCourses >= 1,
  },
  {
    id: 'three_paths',
    name: 'Esploratore',
    kanji: '探索',
    description: 'Avvia 3 sentieri contemporaneamente',
    icon: '🗺️',
    color: '#BA7517',
    check: ({ activeCourses }) => activeCourses >= 3,
  },
  {
    id: 'fifty_steps',
    name: 'Maratoneta',
    kanji: '長距離',
    description: 'Completa 50 step in totale',
    icon: '🏃',
    color: '#D4537E',
    check: ({ totalCompleted }) => totalCompleted >= 50,
  },
  {
    id: 'hundred_steps',
    name: 'Centurione',
    kanji: '百歩',
    description: 'Completa 100 step in totale',
    icon: '💯',
    color: '#f7c948',
    check: ({ totalCompleted }) => totalCompleted >= 100,
  },
  {
    id: 'sensei',
    name: 'Sensei',
    kanji: '先生',
    description: 'Raggiungi il livello Sensei',
    icon: '🎓',
    color: '#f7c948',
    check: ({ xp }) => xp >= 1000,
  },
]

// Restituisce i badge sbloccati e quelli ancora bloccati
export function evaluateBadges(stats) {
  return BADGES.map(badge => ({
    ...badge,
    unlocked: badge.check(stats),
  }))
}