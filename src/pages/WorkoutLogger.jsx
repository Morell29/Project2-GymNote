// src/pages/WorkoutLogger.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, ChevronDown, X, Search, Clock } from 'lucide-react'
import ExerciseCard from '../components/ExerciseCard'
import RestTimer from '../components/RestTimer'
import { useWorkouts, useExerciseLibrary, useTemplates, useSettings } from '../hooks/useStorage'
import { generateId, createBlankSet } from '../utils/workoutUtils'

// Group exercises by category
function groupByCategory(library) {
  return library.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = []
    acc[ex.category].push(ex)
    return acc
  }, {})
}

export default function WorkoutLogger() {
  const navigate = useNavigate()
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary } = useExerciseLibrary()
  const { templates } = useTemplates()
  const { settings } = useSettings()

  const [sessionId] = useState(() => generateId())
  const [sessionName, setSessionName] = useState('')
  const [exercises, setExercises] = useState([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [startTime] = useState(new Date())
  const [elapsed, setElapsed] = useState(0)
  const [newExName, setNewExName] = useState('')
  const [newExCat, setNewExCat] = useState('Custom')

  // Elapsed timer
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

  // Add exercise from library
  const addExercise = (ex) => {
    if (exercises.some(e => e.exerciseId === ex.id)) return
    setExercises(prev => [
      ...prev,
      {
        id: generateId(),
        exerciseId: ex.id,
        unit: ex.defaultUnit || 'KG',
        sets: [createBlankSet()],
      }
    ])
    setShowExercisePicker(false)
  }

  // Load template
  const loadTemplate = (template) => {
    const newExercises = template.exercises
      .map(exId => {
        const def = library.find(l => l.id === exId)
        if (!def) return null
        if (exercises.some(e => e.exerciseId === exId)) return null
        return {
          id: generateId(),
          exerciseId: exId,
          unit: def.defaultUnit || 'KG',
          sets: [createBlankSet()],
        }
      })
      .filter(Boolean)
    setExercises(prev => [...prev, ...newExercises])
    setSessionName(template.name)
    setShowTemplatePicker(false)
  }

  // Update an exercise entry
  const updateExercise = (idx, updated) => {
    setExercises(prev => prev.map((e, i) => i === idx ? updated : e))
  }

  // Remove exercise
  const removeExercise = (idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  // Add custom exercise
  const addCustomExercise = () => {
    if (!newExName.trim()) return
    const id = newExName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const ex = { id, name: newExName.trim(), category: newExCat || 'Custom', defaultUnit: 'KG' }
    setLibrary(prev => [...prev, ex])
    addExercise(ex)
    setNewExName('')
  }

  // Save session
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
    navigate('/')
  }

  const grouped = groupByCategory(library)
  const filteredLibrary = searchQuery
    ? library.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  const doneExercises = exercises.filter(ex =>
    ex.sets.every(s => s.done) && ex.sets.length > 0
  ).length

  return (
    <div className="page">
      {/* Session Header */}
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <input
            className="input"
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 800, padding: '0', outline: 'none', width: '100%' }}
            placeholder="Nama Sesi (misal: Push A)"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
        </div>
      </div>

      {/* Timer row */}
      <div className="flex items-center justify-between mb-4" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        border: '1px solid var(--border)',
      }}>
        <div className="flex items-center gap-2">
          <Clock size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            {formatElapsed(elapsed)}
          </span>
          <span className="text-muted text-xs">durasi latihan</span>
        </div>
        <div className="flex items-center gap-2">
          {exercises.length > 0 && (
            <span className="text-xs text-muted">
              {doneExercises}/{exercises.length} selesai
            </span>
          )}
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowTimer(true)}>
            ⏱
          </button>
        </div>
      </div>

      {/* Template picker trigger */}
      {exercises.length === 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted mb-3" style={{ textAlign: 'center' }}>Mulai dari template atau tambah gerakan manual</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {templates.map(t => (
              <button
                key={t.id}
                className="btn btn-ghost btn-sm"
                style={{ flexDirection: 'column', gap: 4, padding: '14px 8px', height: 'auto' }}
                onClick={() => loadTemplate(t)}
              >
                <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
                <span style={{ fontSize: '0.78rem' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.map((ex, idx) => {
        const def = library.find(l => l.id === ex.exerciseId)
        return (
          <ExerciseCard
            key={ex.id}
            exerciseEntry={ex}
            exerciseDef={def}
            workouts={workouts}
            currentSessionId={sessionId}
            onChange={(updated) => updateExercise(idx, updated)}
            onRemove={() => removeExercise(idx)}
            onStartTimer={() => setShowTimer(true)}
          />
        )
      })}

      {/* Add exercise button */}
      <button
        className="btn btn-ghost btn-full mb-4"
        style={{ borderStyle: 'dashed', borderRadius: 'var(--radius-lg)', padding: 16 }}
        onClick={() => setShowExercisePicker(true)}
      >
        <Plus size={18} /> Tambah Gerakan
      </button>

      {/* Save button */}
      {exercises.length > 0 && (
        <button className="btn btn-primary btn-full btn-lg" onClick={saveSession}>
          <Save size={18} /> Simpan Sesi
        </button>
      )}

      {/* Rest Timer Overlay */}
      {showTimer && (
        <RestTimer defaultSeconds={settings.defaultRestSeconds || 90} onClose={() => setShowTimer(false)} />
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExercisePicker(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2>Pilih Gerakan</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowExercisePicker(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="input-group mb-4">
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Cari gerakan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Add custom */}
            <div className="card mb-4" style={{ background: 'var(--bg-card-2)' }}>
              <p className="text-xs text-muted mb-2" style={{ fontWeight: 700 }}>TAMBAH CUSTOM</p>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Nama gerakan..."
                  value={newExName}
                  onChange={e => setNewExName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomExercise()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={addCustomExercise}>
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Exercise list */}
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {filteredLibrary ? (
                filteredLibrary.map(ex => (
                  <button
                    key={ex.id}
                    className="history-item"
                    style={{ width: '100%', textAlign: 'left' }}
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
                    <p className="text-xs fw-bold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px', marginBottom: 6 }}>
                      {cat}
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
    </div>
  )
}
