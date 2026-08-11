// src/pages/Dashboard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Download, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import { useWorkouts, useExerciseLibrary, useSettings } from '../hooks/useStorage'
import { getMaxWeight, calculateStreak, getWorkoutDays, formatRelativeDate } from '../utils/workoutUtils'
import ExportButton from '../components/ExportButton'

const CATEGORIES = [
  { key: 'Push',        label: 'Push',        emoji: '💪', colorClass: 'push' },
  { key: 'Pull',        label: 'Pull',        emoji: '🏋️', colorClass: 'pull' },
  { key: 'Leg',         label: 'Leg',         emoji: '🦵', colorClass: 'leg'  },
  { key: 'Body Weight', label: 'Body Weight', emoji: '🤸', colorClass: 'bw'   },
]

const CAT_COLORS = {
  push: 'var(--push-color)',
  pull: 'var(--pull-color)',
  leg:  'var(--leg-color)',
  bw:   'var(--bw-color)',
}
const CAT_BG = {
  push: 'var(--push-bg)',
  pull: 'var(--pull-bg)',
  leg:  'var(--leg-bg)',
  bw:   'var(--bw-bg)',
}

function getLastWeight(workouts, exerciseId) {
  // Find most recent session that has this exercise
  const sessions = workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (!sessions.length) return { weight: null, unit: 'KG', trend: null, prevWeight: null }

  const latest = sessions[0].exercises.find(e => e.exerciseId === exerciseId)
  const latestMax = getMaxWeight(latest)
  const unit = latest.unit || 'KG'

  if (sessions.length < 2) return { weight: latestMax, unit, trend: 'new', prevWeight: null }

  const prev = sessions[1].exercises.find(e => e.exerciseId === exerciseId)
  const prevMax = getMaxWeight(prev)

  let trend = 'same'
  if (latestMax > prevMax) trend = 'up'
  else if (latestMax < prevMax) trend = 'down'

  return { weight: latestMax, unit, trend, prevWeight: prevMax }
}

function TrendIcon({ trend }) {
  if (trend === 'up')   return <TrendingUp  size={13} className="trend-up" />
  if (trend === 'down') return <TrendingDown size={13} className="trend-down" />
  if (trend === 'new')  return <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 800 }}>NEW</span>
  return <Minus size={13} className="trend-same" />
}

function TrendLabel({ trend, weight, prevWeight, unit }) {
  if (trend === 'new')  return <span className="trend-new" style={{ fontSize: '0.7rem', fontWeight: 700 }}>Pertama!</span>
  if (!prevWeight)      return null
  const diff = weight - prevWeight
  if (trend === 'up')   return <span className="trend-up"   style={{ fontSize: '0.7rem', fontWeight: 700 }}>+{diff} {unit}</span>
  if (trend === 'down') return <span className="trend-down" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{diff} {unit}</span>
  return <span className="trend-same" style={{ fontSize: '0.7rem', fontWeight: 700 }}>Sama</span>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { workouts } = useWorkouts()
  const { library } = useExerciseLibrary()
  const { settings } = useSettings()

  const [activeTab, setActiveTab] = useState('Push')
  const [showExport, setShowExport] = useState(false)

  const streak = calculateStreak(workouts)
  const totalSessions = workouts.length

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

  // Last session
  const lastSession = workouts.length
    ? [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null

  // Exercises in active category
  const activeCat = CATEGORIES.find(c => c.key === activeTab)
  const catExercises = library.filter(ex => ex.category === activeTab)

  // PR count (any exercise with trend=up in last session)
  const prCount = lastSession?.exercises?.filter(ex => {
    const prev = workouts
      .filter(w => w.id !== lastSession.id && w.exercises.some(e => e.exerciseId === ex.exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      ?.exercises.find(e => e.exerciseId === ex.exerciseId)
    if (!prev) return false
    return getMaxWeight(ex) > getMaxWeight(prev)
  }).length || 0

  return (
    <div className="page">

      {/* ── Greeting Card ── */}
      <div className="greeting-card">
        <p className="text-muted text-xs" style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>
          Selamat datang kembali,
        </p>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>
          {settings.username} <span style={{ color: 'var(--accent)' }}>💪</span>
        </h1>

        {/* Stats inline */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>🔥 Streak</div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{totalSessions}</div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>📅 Sesi</div>
          </div>
          {prCount > 0 && (
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{prCount}</div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>🏆 PR Baru</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 20 }}>
        <button
          className="btn btn-primary btn-lg"
          id="btn-start-workout"
          onClick={() => navigate('/workout')}
          style={{ borderRadius: 'var(--radius-lg)', fontSize: '1rem' }}
        >
          <Play size={18} fill="currentColor" />
          Mulai Latihan
        </button>
        <button
          className="btn btn-ghost"
          id="btn-export"
          onClick={() => setShowExport(true)}
          style={{ padding: '0 16px', borderRadius: 'var(--radius-lg)' }}
          title="Export Progress"
        >
          <Download size={20} />
        </button>
      </div>

      {/* ── Calendar Strip ── */}
      <div className="card mb-4">
        <div className="section-header">
          <h2 style={{ fontSize: '0.9rem' }}>📅 Aktivitas 2 Minggu</h2>
          {streak > 0 && (
            <span className="badge badge-yellow">{streak} hari streak</span>
          )}
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

      {/* ── Progressive Overload Hub ── */}
      <div className="section-header" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: '1rem' }}>📈 Progressive Overload</h2>
        {lastSession && (
          <span
            className="text-xs text-muted"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/history')}
          >
            Lihat Riwayat <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </span>
        )}
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            id={`tab-${cat.colorClass}`}
            className={`cat-tab ${activeTab === cat.key ? `active-${cat.colorClass}` : ''}`}
            onClick={() => setActiveTab(cat.key)}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise rows for active category */}
      <div
        style={{
          background: CAT_BG[activeCat.colorClass],
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          border: `1px solid rgba(${activeCat.colorClass === 'push' ? '224,123,106' : activeCat.colorClass === 'pull' ? '106,158,224' : activeCat.colorClass === 'leg' ? '122,206,138' : '201,138,224'}, 0.2)`,
          marginBottom: 16,
        }}
      >
        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>{activeCat.emoji}</span>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: CAT_COLORS[activeCat.colorClass] }}>
            {activeCat.label}
          </span>
          <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
            {catExercises.length} latihan
          </span>
        </div>

        {catExercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.3 }}>🏋️</div>
            <p className="text-xs text-muted">Belum ada latihan di kategori ini</p>
          </div>
        ) : (
          catExercises.map(ex => {
            const { weight, unit, trend, prevWeight } = getLastWeight(workouts, ex.id)
            return (
              <div key={ex.id} className="overload-row">
                <div>
                  <div className="overload-row-name">{ex.name}</div>
                  {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <TrendIcon trend={trend} />
                      <TrendLabel trend={trend} weight={weight} prevWeight={prevWeight} unit={unit} />
                    </div>
                  )}
                  {!trend && (
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>Belum pernah dilatih</div>
                  )}
                </div>
                <div className="overload-row-meta">
                  {weight !== null ? (
                    <>
                      <div className="overload-row-weight">
                        {unit === 'BW' || unit === 'SEC' ? unit : `${weight} ${unit}`}
                      </div>
                      <div className="text-xs text-muted">maks terakhir</div>
                    </>
                  ) : (
                    <div className="text-xs text-muted">—</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Last Session ── */}
      {lastSession && (
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')}>
          <div className="section-header">
            <h2 style={{ fontSize: '0.9rem' }}>⏱ Sesi Terakhir</h2>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
            {lastSession.name || 'Latihan'} · {formatRelativeDate(lastSession.date)}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lastSession.exercises?.slice(0, 5).map(ex => (
              <span key={ex.exerciseId} className="badge badge-cream">
                {library.find(l => l.id === ex.exerciseId)?.name || ex.exerciseId}
              </span>
            ))}
            {lastSession.exercises?.length > 5 && (
              <span className="badge badge-cream">+{lastSession.exercises.length - 5} lagi</span>
            )}
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExport && (
        <ExportButton
          workouts={workouts}
          library={library}
          username={settings.username}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
