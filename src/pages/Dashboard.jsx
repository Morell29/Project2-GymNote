import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, TrendingUp, TrendingDown, Minus, ChevronRight, Plus, Pencil } from 'lucide-react'
import { useWorkouts, useExerciseLibrary, useSettings } from '../hooks/useStorage'
import { getMaxWeight, calculateStreak, getWorkoutDays, formatRelativeDate } from '../utils/workoutUtils'
import ExportButton from '../components/ExportButton'
import QuickLogModal from '../components/QuickLogModal'
import UpdateProgressModal from '../components/UpdateProgressModal'
import QuickEditModal from '../components/QuickEditModal'

const CATEGORIES = [
  { key: 'Push',        label: 'Push',        emoji: '💪', colorClass: 'push'   },
  { key: 'Pull',        label: 'Pull',        emoji: '🏋️', colorClass: 'pull'   },
  { key: 'Leg',         label: 'Leg',         emoji: '🦵', colorClass: 'leg'    },
  { key: 'Body Weight', label: 'Body Weight', emoji: '🤸', colorClass: 'bw'     },
  { key: 'Others',      label: 'Others',      emoji: '⚡', colorClass: 'others' },
]

const CAT_COLORS = {
  push:   'var(--push-color)',
  pull:   'var(--pull-color)',
  leg:    'var(--leg-color)',
  bw:     'var(--bw-color)',
  others: 'var(--others-color)',
}
const CAT_BG = {
  push:   'var(--push-bg)',
  pull:   'var(--pull-bg)',
  leg:    'var(--leg-bg)',
  bw:     'var(--bw-bg)',
  others: 'var(--others-bg)',
}

function getLastWeight(workouts, exerciseId) {
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
  if (trend === 'new')  return <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>NEW</span>
  return <Minus size={13} className="trend-same" />
}

function TrendLabel({ trend, weight, prevWeight, unit }) {
  if (trend === 'new')  return <span className="trend-new" style={{ fontSize: '12px', fontWeight: 500 }}>Pertama!</span>
  if (!prevWeight)      return null
  const diff = weight - prevWeight
  if (trend === 'up')   return <span className="trend-up"   style={{ fontSize: '12px', fontWeight: 500 }}>+{diff} {unit}</span>
  if (trend === 'down') return <span className="trend-down" style={{ fontSize: '12px', fontWeight: 500 }}>{diff} {unit}</span>
  return <span className="trend-same" style={{ fontSize: '12px', fontWeight: 500 }}>Sama</span>
}

function TodaySessionCard({ session, library, onUpdateProgress }) {
  const category = session.category || session.name
  const cat = CATEGORIES.find(c => c.key === category)
  const meta = cat || { emoji: '🏋️', colorClass: 'others' }
  const color = CAT_COLORS[meta.colorClass] || 'var(--accent)'
  const bg    = CAT_BG[meta.colorClass]    || 'var(--accent-glow-sm)'

  const exerciseCount = session.exercises?.length || 0
  const hasProgress = exerciseCount > 0

  return (
    <div
      style={{
        background: bg,
        border: `1px solid var(--border)`,
        borderRadius: '6px',
        padding: '14px 16px',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem' }}>{meta.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: color }}>
            {category}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 1 }}>
            {hasProgress
              ? `${exerciseCount} gerakan dicatat`
              : 'Belum ada gerakan — klik Update Progress'}
          </div>
        </div>
        <button
          className="btn btn-sm"
          id={`btn-update-${session.id}`}
          onClick={() => onUpdateProgress(session)}
          style={{
            background: color,
            color: 'var(--text-on-accent)',
            fontWeight: 500,
            fontSize: '12px',
            padding: '7px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Pencil size={12} />
          Update Progress
        </button>
      </div>

      {hasProgress && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
          {session.exercises.slice(0, 4).map(ex => {
            const def = library.find(l => l.id === ex.exerciseId)
            const maxW = getMaxWeight(ex)
            return (
              <span
                key={ex.exerciseId}
                style={{
                  background: 'var(--bg-card-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                }}
              >
                {def?.name || ex.exerciseId}
                {maxW > 0 && ` · ${maxW} ${ex.unit}`}
              </span>
            )
          })}
          {session.exercises.length > 4 && (
            <span
              style={{
                background: 'var(--bg-card-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                padding: '2px 8px',
              }}
            >
              +{session.exercises.length - 4} lagi
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { workouts } = useWorkouts()
  const { library } = useExerciseLibrary()
  const { settings } = useSettings()

  const [activeTab, setActiveTab]           = useState('Push')
  const [showExport, setShowExport]         = useState(false)
  const [showQuickLog, setShowQuickLog]     = useState(false)
  const [updateSession, setUpdateSession]   = useState(null)
  const [editExercise, setEditExercise]     = useState(null)

  const streak       = calculateStreak(workouts)
  const totalSessions = workouts.length

  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const todaySessions = workouts.filter(w => {
    const d = new Date(w.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return key === todayKey
  })

  const workoutDays = getWorkoutDays(workouts)
  const calDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return {
      key,
      day: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d.getDay()],
      num: d.getDate(),
      hasWorkout: workoutDays.has(key),
      isToday: i === 13,
    }
  })

  const lastSession = workouts.find(w => {
    const d = new Date(w.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return key !== todayKey
  })

  const lastAnySession = workouts.length
    ? [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null

  const prCount = lastAnySession?.exercises?.filter(ex => {
    const prev = workouts
      .filter(w => w.id !== lastAnySession.id && w.exercises.some(e => e.exerciseId === ex.exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      ?.exercises.find(e => e.exerciseId === ex.exerciseId)
    if (!prev) return false
    return getMaxWeight(ex) > getMaxWeight(prev)
  }).length || 0

  const activeCat = CATEGORIES.find(c => c.key === activeTab)

  const handleLogged = (session) => {
    setShowQuickLog(false)
    setUpdateSession(session)
  }

  const catExercises = library.filter(ex => ex.category === activeTab)

  return (
    <div className="page">

      <div className="brand-header">G Y M N O T E</div>

      <div className="greeting-card">
        <p style={{ marginBottom: 4, color: 'var(--text-on-dark-secondary)', fontSize: '12px' }}>
          Selamat datang kembali,
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 300, color: 'var(--text-on-dark)', letterSpacing: '-0.104px' }}>
            {settings.username} <span style={{ color: 'var(--accent)' }}>💪</span>
          </h1>
          <button
            className="btn btn-sm btn-icon"
            id="btn-export"
            onClick={() => setShowExport(true)}
            style={{ border: '1.5px solid rgba(255,255,255,0.2)', color: 'var(--text-on-dark)', background: 'transparent', borderRadius: '6px' }}
            title="Export Progress"
          >
            <Download size={17} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4 }}>🔥 Streak</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{totalSessions}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4 }}>📅 Sesi</div>
          </div>
          {prCount > 0 && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{prCount}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4 }}>🏆 PR Baru</div>
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary btn-full mb-4"
        id="btn-catat-latihan"
        onClick={() => setShowQuickLog(true)}
        style={{ fontSize: '16px', padding: '16px 24px' }}
      >
        <Plus size={19} />
        Catat Latihan Hari Ini
      </button>

      {todaySessions.length > 0 && (
        <div className="mb-4">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <h2 style={{ fontSize: '16px' }}>🗓 Hari Ini</h2>
            <span className="badge badge-green">{todaySessions.length} sesi</span>
          </div>
          {todaySessions.map(s => (
            <TodaySessionCard
              key={s.id}
              session={s}
              library={library}
              onUpdateProgress={setUpdateSession}
            />
          ))}
        </div>
      )}

      <div className="card mb-4">
        <div className="section-header">
          <h2 style={{ fontSize: '16px' }}>📅 Aktivitas 2 Minggu</h2>
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

      <div className="section-header" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: '16px' }}>📈 Progressive Overload</h2>
        {workouts.length > 0 && (
          <span
            className="text-xs text-muted"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/workout')}
          >
            Riwayat <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </span>
        )}
      </div>

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

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '16px',
          border: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>{activeCat.emoji}</span>
          <span style={{ fontWeight: 500, fontSize: '14px', color: CAT_COLORS[activeCat.colorClass] }}>
            {activeCat.label}
          </span>
          <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
            {catExercises.length} latihan
          </span>
        </div>

        {catExercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.2 }}>🏋️</div>
            <p className="text-xs text-muted">Belum ada latihan di kategori ini</p>
          </div>
        ) : (
          catExercises.map(ex => {
            const { weight, unit, trend, prevWeight } = getLastWeight(workouts, ex.id)
            return (
              <div
                key={ex.id}
                className="overload-row"
                style={{ cursor: 'pointer' }}
                onClick={() => setEditExercise(ex)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="overload-row-name">{ex.name}</div>
                  {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <TrendIcon trend={trend} />
                      <TrendLabel trend={trend} weight={weight} prevWeight={prevWeight} unit={unit} />
                    </div>
                  )}
                  {!trend && (
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>Tap untuk mulai catat</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div className="overload-row-meta">
                    {weight !== null ? (
                      <>
                        <div className="overload-row-weight">
                          {unit === 'BW' || unit === 'SEC' ? unit : `${weight} ${unit}`}
                        </div>
                        <div className="text-xs text-muted">terakhir</div>
                      </>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--accent)', fontWeight: 500 }}>+ Catat</div>
                    )}
                  </div>
                  <div
                    style={{
                      width: 30, height: 30,
                      borderRadius: 6,
                      background: 'var(--bg-card-2)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    <Pencil size={13} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {lastSession && todaySessions.length === 0 && (
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/workout')}>
          <div className="section-header">
            <h2 style={{ fontSize: '14px' }}>📋 Sesi Terakhir</h2>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
            {lastSession.category || lastSession.name || 'Latihan'} · {formatRelativeDate(lastSession.date)}
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

      {showExport && (
        <ExportButton
          workouts={workouts}
          library={library}
          username={settings.username}
          onClose={() => setShowExport(false)}
        />
      )}

      {showQuickLog && (
        <QuickLogModal
          onClose={() => setShowQuickLog(false)}
          onLogged={handleLogged}
        />
      )}

      {updateSession && (
        <UpdateProgressModal
          session={updateSession}
          library={library}
          onClose={() => setUpdateSession(null)}
        />
      )}

      {editExercise && (
        <QuickEditModal
          exercise={editExercise}
          workouts={workouts}
          onClose={() => setEditExercise(null)}
        />
      )}
    </div>
  )
}
