import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronLeft, Plus, Pencil, Maximize2, Minimize2, StickyNote, ArrowUpFromLine, Dumbbell, MoveDown, Activity, Zap, Flame, Calendar, Trophy } from 'lucide-react'
import { useWorkouts, useExerciseLibrary, useSettings, useCalNotes } from '../hooks/useStorage'
import { getMaxWeight, getMaxReps, calculateStreak, getWorkoutDays } from '../utils/workoutUtils'
import ExportButton from '../components/ExportButton'
import QuickLogModal from '../components/QuickLogModal'
import UpdateProgressModal from '../components/UpdateProgressModal'
import QuickEditModal from '../components/QuickEditModal'

const CATEGORIES = [
  { key: 'Push',        label: 'Push',        Icon: ArrowUpFromLine, colorClass: 'push'   },
  { key: 'Pull',        label: 'Pull',        Icon: Dumbbell,        colorClass: 'pull'   },
  { key: 'Leg',         label: 'Leg',         Icon: MoveDown,        colorClass: 'leg'    },
  { key: 'Body Weight', label: 'Body Weight', Icon: Activity,        colorClass: 'bw'     },
  { key: 'Others',      label: 'Others',      Icon: Zap,             colorClass: 'others' },
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

  if (!sessions.length) return { weight: null, unit: 'KG', trend: null, prevWeight: null, repsTrend: null }

  const latest = sessions[0].exercises.find(e => e.exerciseId === exerciseId)
  const latestMax = getMaxWeight(latest)
  const latestMaxReps = getMaxReps(latest)
  const unit = latest.unit || 'KG'

  if (sessions.length < 2) return { weight: latestMax, unit, trend: 'new', prevWeight: null, repsTrend: null }

  const prev = sessions[1].exercises.find(e => e.exerciseId === exerciseId)
  const prevMax = getMaxWeight(prev)
  const prevMaxReps = getMaxReps(prev)
  let trend = 'same'
  let repsTrend = null
  if (latestMax > prevMax) trend = 'up'
  else if (latestMax < prevMax) trend = 'down'
  else if (latestMaxReps > prevMaxReps) repsTrend = latestMaxReps - prevMaxReps

  return { weight: latestMax, unit, trend, prevWeight: prevMax, repsTrend }
}

function TrendIcon({ trend }) {
  if (trend === 'up')   return <TrendingUp  size={13} className="trend-up" />
  if (trend === 'down') return <TrendingDown size={13} className="trend-down" />
  if (trend === 'new')  return <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>NEW</span>
  return <Minus size={13} className="trend-same" />
}

function TrendLabel({ trend, weight, prevWeight, unit, repsTrend }) {
  if (trend === 'new')  return <span className="trend-new" style={{ fontSize: '12px', fontWeight: 500 }}>Pertama!</span>
  if (!prevWeight)      return null
  const diff = weight - prevWeight
  if (trend === 'up')   return <span className="trend-up"   style={{ fontSize: '12px', fontWeight: 500 }}>+{diff} {unit}</span>
  if (trend === 'down') return <span className="trend-down" style={{ fontSize: '12px', fontWeight: 500 }}>{diff} {unit}</span>
  if (repsTrend)        return <span className="trend-up"   style={{ fontSize: '12px', fontWeight: 500 }}>+{repsTrend} reps</span>
  return <span className="trend-same" style={{ fontSize: '12px', fontWeight: 500 }}>Sama</span>
}


export default function Dashboard() {
  const navigate = useNavigate()
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary } = useExerciseLibrary()
  const { settings } = useSettings()
  const { calNotes, setNote } = useCalNotes()

  const [activeTab, setActiveTab]           = useState('Push')
  const [showExport, setShowExport]         = useState(false)
  const [showQuickLog, setShowQuickLog]     = useState(false)
  const [updateSession, setUpdateSession]   = useState(null)
  const [editExercise, setEditExercise]     = useState(null)
  const [calMonth, setCalMonth]             = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [calExpanded, setCalExpanded]       = useState(false)
  const [noteTarget, setNoteTarget]         = useState(null)
  const [noteText, setNoteText]             = useState('')
  const noteInputRef = useRef(null)

  const streak       = calculateStreak(workouts)
  const totalSessions = workouts.length

  const workoutDays = getWorkoutDays(workouts)

  const calYear = calMonth.getFullYear()
  const calMon = calMonth.getMonth()
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMon, 1).getDay()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const calMonthLabel = new Date(calYear, calMon).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const calGrid = []
  for (let i = 0; i < firstDayOfWeek; i++) calGrid.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${String(calMon+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    calGrid.push({ day: d, key, hasWorkout: workoutDays.has(key), isToday: key === todayStr })
  }

  const prevMonth = () => setCalMonth(new Date(calYear, calMon - 1, 1))
  const nextMonth = () => setCalMonth(new Date(calYear, calMon + 1, 1))

  const openNote = (cell) => {
    if (!cell) return
    setNoteTarget(cell)
    setNoteText(calNotes[cell.key] || '')
  }
  const saveNote = () => {
    if (noteTarget) setNote(noteTarget.key, noteText)
    setNoteTarget(null)
  }

  useEffect(() => {
    if (noteTarget && noteInputRef.current) noteInputRef.current.focus()
  }, [noteTarget])

  const lastAnySession = workouts.length
    ? [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null

  const prCount = lastAnySession?.exercises?.filter(ex => {
    const prev = workouts
      .filter(w => w.id !== lastAnySession.id && w.exercises.some(e => e.exerciseId === ex.exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      ?.exercises.find(e => e.exerciseId === ex.exerciseId)
    if (!prev) return false
    if (getMaxWeight(ex) > getMaxWeight(prev)) return true
    if (getMaxWeight(ex) === getMaxWeight(prev) && getMaxReps(ex) > getMaxReps(prev)) return true
    return false
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
          Welcome back KING!!
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 300, color: 'var(--text-on-dark)', letterSpacing: '-0.104px', display: 'flex', alignItems: 'center', gap: 8 }}>
            {settings.username} <ArrowUpFromLine size={20} color="var(--accent)" />
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
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={11} color="#f97316" /> Streak</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{totalSessions}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Sesi</div>
          </div>
          {prCount > 0 && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{prCount}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={11} /> PR Baru</div>
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



      <div className="card mb-4">
        <div className="section-header">
          <button onClick={prevMonth} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 6 }}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ fontSize: '14px', textTransform: 'capitalize' }}>{calMonthLabel}</h2>
          <button onClick={nextMonth} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 6 }}>
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setCalExpanded(v => !v)}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ padding: 6, marginLeft: 2 }}
            title={calExpanded ? 'Perkecil' : 'Perbesar'}
          >
            {calExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: calExpanded ? 4 : 2, textAlign: 'center' }}>
          {['M','S','S','R','K','J','S'].map((d, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', padding: calExpanded ? '4px 0' : '2px 0' }}>{d}</div>
          ))}
          {calGrid.map((cell, i) => {
            const hasNote = cell && !!calNotes[cell.key]
            return (
              <div
                key={i}
                onClick={() => openNote(cell)}
                style={{
                  height: calExpanded ? undefined : 28,
                  aspectRatio: calExpanded ? '1' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: calExpanded ? '6px' : '4px',
                  fontSize: calExpanded ? '13px' : '11px',
                  fontWeight: cell?.isToday ? 600 : 400,
                  color: cell ? (cell.isToday ? 'var(--accent)' : 'var(--text-primary)') : 'transparent',
                  background: cell?.hasWorkout ? 'var(--accent-glow-sm)' : 'transparent',
                  border: cell?.isToday ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  position: 'relative',
                  cursor: cell ? 'pointer' : 'default',
                }}
              >
                {cell ? cell.day : ''}
                {cell?.hasWorkout && (
                  <span style={{ width: calExpanded ? 4 : 3, height: calExpanded ? 4 : 3, borderRadius: '50%', background: 'var(--accent)', position: 'absolute', bottom: calExpanded ? 3 : 2 }} />
                )}
                {hasNote && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '15%',
                    width: '70%',
                    height: 2,
                    borderRadius: 1,
                    background: 'var(--text-muted)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <span className="badge badge-yellow">{streak} hari streak</span>
          </div>
        )}
      </div>

      {noteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && saveNote()}>
          <div className="modal-sheet" style={{ maxHeight: '60dvh' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <StickyNote size={16} color="var(--accent)" />
              <h2 style={{ fontSize: '15px' }}>
                Catatan — {new Date(noteTarget.key).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </h2>
            </div>
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Tulis catatan singkat..."
              rows={4}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveNote() }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setNoteTarget(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={saveNote}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={16} /> Progressive Overload</h2>
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
            <cat.Icon size={14} />
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
          <activeCat.Icon size={16} color={CAT_COLORS[activeCat.colorClass]} />
          <span style={{ fontWeight: 500, fontSize: '14px', color: CAT_COLORS[activeCat.colorClass] }}>
            {activeCat.label}
          </span>
          <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
            {catExercises.length} latihan
          </span>
        </div>

        {catExercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, opacity: 0.2 }}><Dumbbell size={32} /></div>
            <p className="text-xs text-muted">Belum ada latihan di kategori ini</p>
          </div>
        ) : (
          catExercises.map(ex => {
            const { weight, unit, trend, prevWeight, repsTrend } = getLastWeight(workouts, ex.id)
            return (
              <div
                key={ex.id}
                className="overload-row"
                style={{ cursor: 'pointer' }}
                onClick={() => setEditExercise(ex)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="overload-row-name">{ex.name}</div>
                  {(trend || repsTrend) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <TrendIcon trend={repsTrend && trend === 'same' ? 'up' : trend} />
                      <TrendLabel trend={trend} weight={weight} prevWeight={prevWeight} unit={unit} repsTrend={repsTrend} />
                    </div>
                  )}
                  {!trend && !repsTrend && (
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
          setWorkouts={setWorkouts}
        />
      )}

      {updateSession && (
        <UpdateProgressModal
          session={updateSession}
          library={library}
          onClose={() => setUpdateSession(null)}
          setWorkouts={setWorkouts}
        />
      )}

      {editExercise && (
        <QuickEditModal
          exercise={editExercise}
          workouts={workouts}
          onClose={() => setEditExercise(null)}
          setWorkouts={setWorkouts}
          setLibrary={setLibrary}
        />
      )}
    </div>
  )
}
