import React, { useEffect, useState } from 'react'

function Progress({ onBack, courses }) {

  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    // Carica i progressi di tutti i corsi
    const allProgress = await Promise.all(
      courses.map(async course => {
        const progress = await window.sensei.getProgress(course.id)
        return { course, progress }
      })
    )

    // Totale giorni completati
    const totalCompleted = allProgress.reduce((acc, { progress }) =>
      acc + progress.filter(p => p.completed).length, 0)

    // Corsi attivi
    const activeCourses = courses.filter(c => c.progress > 0 && c.progress < 100)

    // Corsi completati
    const completedCourses = courses.filter(c => c.progress === 100)

    // Ultimo accesso — il timestamp più recente tra tutti i progressi
    const allTimestamps = allProgress
      .flatMap(({ progress }) => progress
        .filter(p => p.completed && p.completed_at)
        .map(p => p.completed_at)
      )
    const lastActivity = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null

    // Streak — giorni consecutivi (basato sui completed_at)
    const streak = calculateStreak(allTimestamps)

    // Attività per giorno — ultimi 30 giorni
    const activity = calculateActivity(allTimestamps, 30)

    setStats({
      totalCompleted,
      activeCourses: activeCourses.length,
      completedCourses: completedCourses.length,
      totalCourses: courses.length,
      lastActivity,
      streak,
      activity,
      allProgress,
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-secondary)',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Indietro
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>Progressi</h1>
      </div>

      {!stats ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Caricamento...</p>
      ) : (
        <>
          {/* ── STATS CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
            <StatCard label="Giorni completati" value={stats.totalCompleted} color="#378ADD" />
            <StatCard label="Corsi attivi" value={stats.activeCourses} color="#7F77DD" />
            <StatCard label="Corsi completati" value={stats.completedCourses} color="#1D9E75" />
            <StatCard label="Streak attuale" value={`${stats.streak}gg`} color="#D85A30" />
          </div>

          {/* ── GRAFICO ATTIVITÀ ── */}
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attività — ultimi 30 giorni
            </span>
            <ActivityGraph activity={stats.activity} />
          </div>

          {/* ── PROGRESSI PER CORSO ── */}
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Per corso
            </span>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.allProgress.map(({ course, progress }) => {
                const completed = progress.filter(p => p.completed).length
                const total = course.total_days || 1
                const pct = Math.round((completed / total) * 100)
                const lastDone = progress
                  .filter(p => p.completed && p.completed_at)
                  .sort((a, b) => b.completed_at - a.completed_at)[0]
                return (
                  <div key={course.id} style={{
                    padding: '14px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '0.5px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{course.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {completed} / {total} giorni · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: course.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                    {lastDone && (
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Ultimo aggiornamento: {new Date(lastDone.completed_at).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* Card statistica */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '0.5px solid var(--border)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 500, color }}>
        {value}
      </p>
    </div>
  )
}

/* Grafico attività — griglia di quadratini come GitHub */
function ActivityGraph({ activity }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 12, flexWrap: 'wrap' }}>
      {activity.map((day, i) => (
        <div
          key={i}
          title={`${day.date}: ${day.count} giorni`}
          style={{
            width: 14, height: 14,
            borderRadius: 3,
            background: day.count === 0
              ? 'var(--bg-tertiary)'
              : day.count === 1
                ? '#378ADD44'
                : day.count === 2
                  ? '#378ADD88'
                  : '#378ADD',
          }}
        />
      ))}
    </div>
  )
}

/* Calcola streak giorni consecutivi */
function calculateStreak(timestamps) {
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
    if (diff <= 1) {
      streak++
      current = d
    } else break
  }
  return streak
}

/* Calcola attività per gli ultimi N giorni */
function calculateActivity(timestamps, days) {
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

export default Progress