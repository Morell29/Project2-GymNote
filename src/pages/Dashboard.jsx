// src/pages/Dashboard.jsx
import { useNavigate } from 'react-router-dom'
import { Flame, Trophy, Dumbbell, TrendingUp, ChevronRight, Play } from 'lucide-react'
import { useWorkouts } from '../hooks/useStorage'
import { useSettings } from '../hooks/useStorage'
import { formatRelativeDate, getWorkoutDays, calculateStreak, calculateVolume, getMaxWeight } from '../utils/workoutUtils'

export default function Dashboard() {
  const navigate = useNavigate()
  const { workouts } = useWorkouts()
  const { settings } = useSettings()

  const streak = calculateStreak(workouts)
  const totalSessions = workouts.length

  // Last session
  const lastSession = workouts.length
    ? [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null

  // Calendar — last 14 days
  const workoutDays = getWorkoutDays(workouts)
  const calDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const isToday = i === 13
    return {
      key,
      day: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d.getDay()],
      num: d.getDate(),
      hasWorkout: workoutDays.has(key),
      isToday,
    }
  })

  // PR detection: find any new PRs in the last session
  const prExercises = lastSession?.exercises?.filter(ex => {
    const prev = workouts
      .filter(w => w.id !== lastSession.id && w.exercises.some(e => e.exerciseId === ex.exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      ?.exercises.find(e => e.exerciseId === ex.exerciseId)
    if (!prev) return false
    return getMaxWeight(ex) > getMaxWeight(prev)
  }) || []

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 20 }}>
        <div style={{ flex: 1 }}>
          <p className="text-muted text-sm" style={{ marginBottom: 2 }}>Selamat datang kembali,</p>
          <h1 style={{ fontSize: '1.8rem' }}>
            {settings.username} <span className="accent" style={{ color: 'var(--accent)' }}>💪</span>
          </h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid mb-4">
        <div className="stat-box">
          <div className="stat-val">{streak}</div>
          <div className="stat-label">🔥 Streak</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{totalSessions}</div>
          <div className="stat-label">📅 Sesi</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{prExercises.length > 0 ? prExercises.length : '—'}</div>
          <div className="stat-label">🏆 PR Baru</div>
        </div>
      </div>

      {/* Start workout CTA */}
      <button
        className="btn btn-primary btn-lg btn-full mb-4"
        onClick={() => navigate('/workout')}
        style={{ borderRadius: 'var(--radius-lg)', fontSize: '1.1rem' }}
      >
        <Play size={20} fill="currentColor" />
        Mulai Latihan
      </button>

      {/* PR Banner */}
      {prExercises.length > 0 && (
        <div className="pr-banner mb-4">
          <span style={{ fontSize: '1.4rem' }}>🏆</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>
              PR Baru di Sesi Terakhir!
            </p>
            <p className="text-xs text-muted">{prExercises.map(e => e.exerciseId).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="card mb-4">
        <div className="section-header">
          <h2>📅 Aktivitas 2 Minggu</h2>
          <span className="badge badge-green">{streak > 0 ? `${streak} hari streak` : 'Mulai streak!'}</span>
        </div>
        <div className="calendar-strip">
          {calDays.map(d => (
            <div
              key={d.key}
              className={`cal-day ${d.hasWorkout ? 'has-workout' : ''} ${d.isToday ? 'today' : ''}`}
            >
              <span className="cal-day-name">{d.day}</span>
              <span className="cal-day-num" style={{ color: d.isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
                {d.num}
              </span>
              {d.hasWorkout && <span className="cal-dot" />}
            </div>
          ))}
        </div>
      </div>

      {/* Last session */}
      {lastSession ? (
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')}>
          <div className="section-header">
            <h2>⏱ Sesi Terakhir</h2>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
            {lastSession.name || 'Latihan'} · {formatRelativeDate(lastSession.date)}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lastSession.exercises?.slice(0, 4).map(ex => (
              <span key={ex.exerciseId} className="badge badge-blue">
                {ex.exerciseId}
              </span>
            ))}
            {lastSession.exercises?.length > 4 && (
              <span className="badge badge-blue">+{lastSession.exercises.length - 4} lagi</span>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>🏋️</div>
          <h3 style={{ marginBottom: 8 }}>Belum ada sesi</h3>
          <p className="text-sm">Mulai latihan pertamamu sekarang!</p>
        </div>
      )}
    </div>
  )
}
