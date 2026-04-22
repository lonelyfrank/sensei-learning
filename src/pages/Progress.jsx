import React, { useEffect, useState } from 'react'
import LevelCard from '../progress/LevelCard.jsx'
import BadgesSection from '../progress/BadgesSection.jsx'
import StatCard from '../progress/StatCard.jsx'
import ActivityGraph from '../progress/ActivityGraph.jsx'
import CourseProgressList from '../progress/CourseProgressList.jsx'
import { calculateXP } from '../progress/xpSystem.jsx'
import { calculateStreak, calculateActivity } from '../progress/utils.js'

function Progress({ onBack, courses }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    // Considera solo i sentieri per i progressi — i leaflet sono documenti consultabili
    const sentieri = courses.filter(c => c.type === 'sentiero' || !c.type)

    const allProgress = await Promise.all(
      sentieri.map(async course => {
        const progress = await window.sensei.getProgress(course.id)
        return { course, progress }
      })
    )

    const totalCompleted = allProgress.reduce((acc, { progress }) =>
      acc + progress.filter(p => p.completed).length, 0)

    const activeCourses = sentieri.filter(c => c.progress > 0 && c.progress < 100).length
    const completedCourses = sentieri.filter(c => c.progress === 100).length

    const allTimestamps = allProgress
      .flatMap(({ progress }) => progress
        .filter(p => p.completed && p.completed_at)
        .map(p => p.completed_at)
      )

    const streak = calculateStreak(allTimestamps)
    const activity = calculateActivity(allTimestamps, 90)
    const xp = calculateXP(allProgress, sentieri)

    setStats({
      totalCompleted,
      activeCourses,
      completedCourses,
      totalCourses: sentieri.length,
      streak,
      activity,
      xp,
      allProgress,
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
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
          {/* ── LEVEL CARD — tutta la larghezza ── */}
          <LevelCard xp={stats.xp} />

          {/* ── DUE COLONNE ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>

            {/* ── COLONNA SINISTRA — stat + grafico ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Stat cards 2x2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatCard label="Step completati" value={stats.totalCompleted} color="#378ADD" />
                <StatCard label="Sentieri attivi" value={stats.activeCourses} color="#7F77DD" />
                <StatCard label="Completati" value={stats.completedCourses} color="#1D9E75" />
                <StatCard label="Streak" value={`${stats.streak}gg`} color="#D85A30" />
              </div>

              {/* Grafico attività */}
              <div style={{
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '0.5px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attività — ultimi 90 giorni
                </span>
                <ActivityGraph activity={stats.activity} />
              </div>
            </div>

            {/* ── COLONNA DESTRA — badge ── */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--border)',
            }}>
              <BadgesSection stats={stats} />
            </div>
          </div>

          {/* ── PROGRESSI PER SENTIERO — tutta la larghezza ── */}
          <CourseProgressList allProgress={stats.allProgress} />
        </>
      )}
    </div>
  )
}

export default Progress