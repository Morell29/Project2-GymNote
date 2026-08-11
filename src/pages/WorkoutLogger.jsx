// src/pages/WorkoutLogger.jsx
// Halaman Latihan — gabungan log latihan + riwayat semua sesi
// Termasuk: tambah gerakan custom, update progress, hapus sesi

import { useState, useEffect } from 'react'
import { Plus, Save, X, Search, Clock, ChevronDown, ChevronUp,
         Trash2, TrendingUp, Pencil, BookOpen, Dumbbell } from 'lucide-react'
import ExerciseCard from '../components/ExerciseCard'
import RestTimer from '../components/RestTimer'
import UpdateProgressModal from '../components/UpdateProgressModal'
import { useWorkouts, useExerciseLibrary, useTemplates, useSettings } from '../hooks/useStorage'
import { generateId, createBlankSet, formatRelativeDate,
         calculateVolume, getMaxWeight } from '../utils/workoutUtils'

// ── Konstanta kategori ─────────────────────────────────────────────────────────
const ALL_CATS = ['Push', 'Pull', 'Leg', 'Body Weight', 'Others']
const UNITS    = ['KG', 'BAR', 'BW', 'SEC']

const CAT_META = {
  'Push':        { emoji: '💪', color: 'var(--push-color)',   bg: 'var(--push-bg)',   rgb: '224,123,106' },
  'Pull':        { emoji: '🏋️', color: 'var(--pull-color)',   bg: 'var(--pull-bg)',   rgb: '106,158,224' },
  'Leg':         { emoji: '🦵', color: 'var(--leg-color)',    bg: 'var(--leg-bg)',    rgb: '122,206,138' },
  'Body Weight': { emoji: '🤸', color: 'var(--bw-color)',     bg: 'var(--bw-bg)',     rgb: '201,138,224' },
  'Others':      { emoji: '⚡', color: 'var(--others-color)', bg: 'var(--others-bg)', rgb: '224,192,106' },
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function groupByCategory(lib) {
  return lib.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = []
    acc[ex.category].push(ex)
    return acc
  }, {})
}

function formatDuration(s) {
  if (!s) return null
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}j ${m % 60}m`
  return `${m}m`
}

function getCategoryFromSession(session, library) {
  if (session.category) return session.category
  // Coba deteksi dari exercise pertama
  const firstEx = session.exercises?.[0]
  if (firstEx) {
    const def = library.find(l => l.id === firstEx.exerciseId)
    if (def?.category) return def.category
  }
  return 'Others'
}

// ── Modal: Tambah Gerakan Custom ───────────────────────────────────────────────
function AddExerciseModal({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [cat, setCat]   = useState('Push')
  const [unit, setUnit] = useState('KG')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim()) { setError('Nama gerakan tidak boleh kosong'); return }
    const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const ex = { id, name: name.trim(), category: cat, defaultUnit: unit }
    onAdded(ex)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '1.1rem' }}>Tambah Gerakan Baru</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="btn-close-addex">
            <X size={18} />
          </button>
        </div>

        {/* Nama */}
        <div className="input-group mb-3">
          <label className="input-label">Nama Gerakan</label>
          <input
            className="input"
            id="input-ex-name"
            placeholder="misal: Incline Dumbbell Press"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          {error && <p className="text-xs" style={{ color: '#ff6b6b', marginTop: 4 }}>{error}</p>}
        </div>

        {/* Kategori */}
        <div className="input-group mb-3">
          <label className="input-label">Kategori</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
            {ALL_CATS.map(c => {
              const m = CAT_META[c]
              const active = cat === c
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    padding: '9px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${active ? m.color : 'var(--border)'}`,
                    background: active ? m.bg : 'var(--bg-card-2)',
                    color: active ? m.color : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>{m.emoji}</span>
                  <span>{c}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Unit */}
        <div className="input-group mb-4">
          <label className="input-label">Satuan</label>
          <div className="unit-toggle">
            {UNITS.map(u => (
              <button
                key={u}
                className={unit === u ? 'active' : ''}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 5 }}>
            KG/BAR = beban · BW = bodyweight (hitung reps) · SEC = detik (plank, dll)
          </p>
        </div>

        <button
          className="btn btn-primary btn-full"
          id="btn-save-addex"
          onClick={handleAdd}
          disabled={!name.trim()}
          style={{ opacity: name.trim() ? 1 : 0.45 }}
        >
          <Plus size={17} /> Tambah ke Library
        </button>
      </div>
    </div>
  )
}

// ── Kartu Sesi Riwayat ─────────────────────────────────────────────────────────
function SessionCard({ session, library, workouts, onUpdateProgress, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [exDetail, setExDetail] = useState(null) // exerciseId yang expand grafiknya

  const category = getCategoryFromSession(session, library)
  const meta     = CAT_META[category] || CAT_META['Others']

  const exerciseCount = session.exercises?.length || 0
  const totalVol = session.exercises?.reduce((s, ex) => s + calculateVolume(ex), 0) || 0
  const duration = formatDuration(session.duration)

  const dateStr = new Date(session.date).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${expanded ? `rgba(${meta.rgb},0.3)` : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row — tap to expand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 14px',
          cursor: 'pointer',
          gap: 10,
        }}
        onClick={() => setExpanded(p => !p)}
      >
        {/* Category dot */}
        <div
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: meta.bg,
            border: `1px solid rgba(${meta.rgb},0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}
        >
          {meta.emoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: meta.color, marginBottom: 2 }}>
            {session.category || session.name || 'Latihan'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="text-xs text-muted">{dateStr}</span>
            {duration && <span className="text-xs text-muted">· {duration}</span>}
            <span className="text-xs text-muted">· {exerciseCount} gerakan</span>
          </div>
        </div>

        {/* Right: volume + expand arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {totalVol > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent)' }}>
                {Math.round(totalVol)}
              </div>
              <div className="text-xs text-muted">vol</div>
            </div>
          )}
          {expanded
            ? <ChevronUp size={16} color="var(--text-muted)" />
            : <ChevronDown size={16} color="var(--text-muted)" />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, marginBottom: 12 }}>
            <button
              className="btn btn-sm"
              id={`btn-update-${session.id}`}
              onClick={() => onUpdateProgress(session)}
              style={{
                background: meta.color,
                color: 'var(--text-on-accent)',
                fontWeight: 700,
                fontSize: '0.78rem',
                flex: 1,
                gap: 5,
              }}
            >
              <Pencil size={13} /> Update Progress
            </button>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              id={`btn-delete-${session.id}`}
              onClick={() => onDelete(session.id)}
              style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.25)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Exercise rows */}
          {exerciseCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)' }}>
              <p className="text-xs">Belum ada gerakan — tap Update Progress untuk mengisi</p>
            </div>
          ) : (
            session.exercises.map(ex => {
              const def = library.find(l => l.id === ex.exerciseId)
              const maxW = getMaxWeight(ex)
              const isOpen = exDetail === ex.exerciseId

              return (
                <div
                  key={ex.exerciseId}
                  style={{
                    background: 'var(--bg-card-2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 6,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Exercise header */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '9px 12px', cursor: 'pointer', gap: 8,
                    }}
                    onClick={() => setExDetail(isOpen ? null : ex.exerciseId)}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>
                      {def?.name || ex.exerciseId}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {maxW > 0
                        ? (ex.unit === 'BW' || ex.unit === 'SEC' ? ex.unit : `${maxW} ${ex.unit}`)
                        : '—'}
                    </span>
                    <span className="text-xs text-muted" style={{ marginLeft: 4 }}>
                      {ex.sets.length}×
                    </span>
                    {isOpen
                      ? <ChevronUp size={13} color="var(--text-muted)" />
                      : <ChevronDown size={13} color="var(--text-muted)" />
                    }
                  </div>

                  {/* Set details */}
                  {isOpen && (
                    <div style={{ padding: '0 12px 10px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr 1fr',
                        gap: 6, marginBottom: 6,
                        fontSize: '0.65rem', fontWeight: 700,
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                        letterSpacing: '0.05em', textAlign: 'center',
                      }}>
                        <span>Set</span>
                        <span>{ex.unit === 'BW' ? 'Reps' : ex.unit === 'SEC' ? 'Detik' : `Berat (${ex.unit})`}</span>
                        <span>{ex.unit === 'BW' || ex.unit === 'SEC' ? '—' : 'Reps'}</span>
                      </div>
                      {ex.sets.map((s, idx) => (
                        <div key={s.id || idx} style={{
                          display: 'grid', gridTemplateColumns: '28px 1fr 1fr',
                          gap: 6, marginBottom: 5,
                        }}>
                          <div className="set-num done" style={{ fontSize: '0.72rem' }}>{idx + 1}</div>
                          <div style={{
                            textAlign: 'center', background: 'var(--bg-input)',
                            borderRadius: 6, padding: '6px 4px',
                            fontSize: '0.85rem', fontWeight: 700,
                          }}>{s.weight || '—'}</div>
                          <div style={{
                            textAlign: 'center', background: 'var(--bg-input)',
                            borderRadius: 6, padding: '6px 4px',
                            fontSize: '0.85rem', fontWeight: 700,
                          }}>{s.reps || '—'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── View: Sesi Aktif (timer-based) ─────────────────────────────────────────────
function ActiveSessionView({ onSaved }) {
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary }   = useExerciseLibrary()
  const { templates }             = useTemplates()
  const { settings }              = useSettings()

  const [sessionId]    = useState(() => generateId())
  const [sessionName, setSessionName] = useState('')
  const [exercises, setExercises]     = useState([])
  const [showPicker, setShowPicker]   = useState(false)
  const [showTimer, setShowTimer]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [startTime]    = useState(new Date())
  const [elapsed, setElapsed]         = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const addExercise = (ex) => {
    if (exercises.some(e => e.exerciseId === ex.id)) return
    setExercises(prev => [...prev, {
      id: generateId(), exerciseId: ex.id,
      unit: ex.defaultUnit || 'KG', sets: [createBlankSet()],
    }])
    setShowPicker(false)
  }

  const loadTemplate = (t) => {
    const newEx = t.exercises
      .map(exId => {
        const def = library.find(l => l.id === exId)
        if (!def || exercises.some(e => e.exerciseId === exId)) return null
        return { id: generateId(), exerciseId: exId, unit: def.defaultUnit || 'KG', sets: [createBlankSet()] }
      })
      .filter(Boolean)
    setExercises(prev => [...prev, ...newEx])
    setSessionName(t.name)
  }

  const saveSession = () => {
    if (!exercises.length) return
    const session = {
      id: sessionId,
      name: sessionName || 'Latihan',
      date: startTime.toISOString(),
      duration: elapsed,
      exercises,
    }
    setWorkouts(prev => [session, ...prev])
    onSaved()
  }

  const grouped         = groupByCategory(library)
  const filteredLibrary = searchQuery
    ? library.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null
  const doneCount = exercises.filter(ex => ex.sets.every(s => s.done) && ex.sets.length > 0).length

  return (
    <>
      {/* Session name */}
      <div className="page-header" style={{ paddingTop: 0 }}>
        <input
          className="input"
          style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', fontWeight: 800, padding: 0, outline: 'none' }}
          placeholder="Nama sesi (misal: Push A)"
          value={sessionName}
          onChange={e => setSessionName(e.target.value)}
        />
      </div>

      {/* Timer bar */}
      <div className="flex items-center justify-between mb-4" style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        padding: '11px 16px', border: '1px solid var(--border)',
      }}>
        <div className="flex items-center gap-2">
          <Clock size={15} color="var(--accent)" />
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            {formatElapsed(elapsed)}
          </span>
          <span className="text-muted text-xs">durasi</span>
        </div>
        <div className="flex items-center gap-2">
          {exercises.length > 0 && (
            <span className="text-xs text-muted">{doneCount}/{exercises.length} selesai</span>
          )}
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowTimer(true)}>⏱</button>
        </div>
      </div>

      {/* Template picker */}
      {exercises.length === 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted mb-3" style={{ textAlign: 'center' }}>
            Mulai dari template atau tambah gerakan manual
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            {templates.map(t => (
              <button
                key={t.id}
                className="btn btn-ghost btn-sm"
                style={{ flexDirection: 'column', gap: 4, padding: '12px 6px', height: 'auto' }}
                onClick={() => loadTemplate(t)}
              >
                <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                <span style={{ fontSize: '0.7rem' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise cards */}
      {exercises.map((ex, idx) => {
        const def = library.find(l => l.id === ex.exerciseId)
        return (
          <ExerciseCard
            key={ex.id}
            exerciseEntry={ex}
            exerciseDef={def}
            workouts={workouts}
            currentSessionId={sessionId}
            onChange={(updated) => setExercises(prev => prev.map((e, i) => i === idx ? updated : e))}
            onRemove={() => setExercises(prev => prev.filter((_, i) => i !== idx))}
            onStartTimer={() => setShowTimer(true)}
          />
        )
      })}

      {/* Add exercise */}
      <button
        className="btn btn-ghost btn-full mb-4"
        style={{ borderStyle: 'dashed', borderRadius: 'var(--radius-lg)', padding: 16 }}
        onClick={() => setShowPicker(true)}
      >
        <Plus size={18} /> Tambah Gerakan
      </button>

      {/* Save */}
      {exercises.length > 0 && (
        <button className="btn btn-primary btn-full btn-lg" onClick={saveSession}>
          <Save size={18} /> Simpan Sesi
        </button>
      )}

      {/* Rest timer overlay */}
      {showTimer && (
        <RestTimer
          defaultSeconds={settings.defaultRestSeconds || 90}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* Exercise picker */}
      {showPicker && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPicker(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2>Pilih Gerakan</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPicker(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="input-group mb-4">
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input" style={{ paddingLeft: 38 }}
                  placeholder="Cari gerakan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {filteredLibrary ? (
                filteredLibrary.map(ex => (
                  <button
                    key={ex.id}
                    className="history-item"
                    style={{ width: '100%', textAlign: 'left', opacity: exercises.some(e => e.exerciseId === ex.id) ? 0.4 : 1 }}
                    onClick={() => addExercise(ex)}
                    disabled={exercises.some(e => e.exerciseId === ex.id)}
                  >
                    <div>
                      <p style={{ fontWeight: 600 }}>{ex.name}</p>
                      <p className="text-xs text-muted">{ex.category}</p>
                    </div>
                    <span className="badge badge-blue">{ex.defaultUnit}</span>
                  </button>
                ))
              ) : (
                Object.entries(grouped).map(([cat, exs]) => (
                  <div key={cat} className="mb-3">
                    <p className="text-xs fw-bold" style={{
                      color: CAT_META[cat]?.color || 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '0 4px', marginBottom: 6,
                    }}>
                      {CAT_META[cat]?.emoji} {cat}
                    </p>
                    {exs.map(ex => (
                      <button
                        key={ex.id}
                        className="history-item"
                        style={{ width: '100%', textAlign: 'left', opacity: exercises.some(e => e.exerciseId === ex.id) ? 0.4 : 1 }}
                        onClick={() => addExercise(ex)}
                        disabled={exercises.some(e => e.exerciseId === ex.id)}
                      >
                        <span style={{ fontWeight: 600 }}>{ex.name}</span>
                        <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{ex.defaultUnit}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main: WorkoutLogger (Latihan + Riwayat) ────────────────────────────────────
export default function WorkoutLogger() {
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary }   = useExerciseLibrary()

  const [view, setView]                   = useState('list') // 'list' | 'active'
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [updateSession, setUpdateSession] = useState(null)
  const [filterCat, setFilterCat]         = useState('Semua')

  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))

  const displayedSessions = filterCat === 'Semua'
    ? sorted
    : sorted.filter(s => {
        const cat = getCategoryFromSession(s, library)
        return cat === filterCat
      })

  const deleteSession = (id) => setWorkouts(prev => prev.filter(w => w.id !== id))

  const handleAddExercise = (ex) => {
    setLibrary(prev => [...prev, ex])
  }

  if (view === 'active') {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, paddingTop: 16 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setView('list')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            ← Kembali
          </button>
          <span className="text-xs text-muted">Sesi Aktif dengan Timer</span>
        </div>
        <ActiveSessionView onSaved={() => setView('list')} />
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.6rem' }}>
            Latihan <span style={{ color: 'var(--accent)' }}>🏋️</span>
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            {sorted.length} sesi tersimpan
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
        <button
          className="btn btn-ghost"
          id="btn-start-timer-session"
          onClick={() => setView('active')}
          style={{ flexDirection: 'column', gap: 5, padding: '14px 10px', height: 'auto', borderRadius: 'var(--radius-md)' }}
        >
          <Clock size={20} color="var(--accent)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Sesi dengan Timer</span>
        </button>
        <button
          className="btn btn-ghost"
          id="btn-add-custom-exercise"
          onClick={() => setShowAddExercise(true)}
          style={{ flexDirection: 'column', gap: 5, padding: '14px 10px', height: 'auto', borderRadius: 'var(--radius-md)' }}
        >
          <Dumbbell size={20} color="var(--accent)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tambah Gerakan</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="category-tabs mb-3">
        {['Semua', ...Object.keys(CAT_META)].map(cat => {
          const meta = CAT_META[cat]
          const active = filterCat === cat
          return (
            <button
              key={cat}
              className="cat-tab"
              id={`filter-${cat.toLowerCase().replace(/\s/g,'-')}`}
              onClick={() => setFilterCat(cat)}
              style={active && meta ? {
                background: meta.bg,
                borderColor: meta.color,
                color: meta.color,
              } : active ? {
                background: 'var(--accent-glow-sm)',
                borderColor: 'var(--border-accent)',
                color: 'var(--accent)',
              } : {}}
            >
              {meta ? `${meta.emoji} ` : ''}{cat}
            </button>
          )
        })}
      </div>

      {/* Session list */}
      {displayedSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {filterCat === 'Semua' ? '📭' : CAT_META[filterCat]?.emoji || '🏋️'}
          </div>
          <h3>{filterCat === 'Semua' ? 'Belum ada latihan' : `Belum ada sesi ${filterCat}`}</h3>
          <p className="text-sm">
            {filterCat === 'Semua'
              ? 'Catat latihan dari Beranda atau mulai sesi dengan timer'
              : `Coba catat latihan kategori ${filterCat} dari Beranda`}
          </p>
        </div>
      ) : (
        displayedSessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            library={library}
            workouts={workouts}
            onUpdateProgress={setUpdateSession}
            onDelete={deleteSession}
          />
        ))
      )}

      {/* Modals */}
      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onAdded={handleAddExercise}
        />
      )}

      {updateSession && (
        <UpdateProgressModal
          session={updateSession}
          library={library}
          onClose={() => setUpdateSession(null)}
        />
      )}
    </div>
  )
}
