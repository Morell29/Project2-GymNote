import { useState, useRef } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Trash2, Pencil, Dumbbell, ArrowUpFromLine, MoveDown, Activity, Zap, GripVertical } from 'lucide-react'
import QuickEditModal from '../components/QuickEditModal'
import { useWorkouts, useExerciseLibrary } from '../hooks/useStorage'
import { getMaxWeight } from '../utils/workoutUtils'

const ALL_CATS = ['Push', 'Pull', 'Leg', 'Body Weight', 'Others']
const UNITS    = ['KG', 'BAR', 'BW', 'SEC']

const CAT_META = {
  'Push':        { Icon: ArrowUpFromLine, color: 'var(--push-color)',   bg: 'var(--push-bg)' },
  'Pull':        { Icon: Dumbbell,        color: 'var(--pull-color)',   bg: 'var(--pull-bg)' },
  'Leg':         { Icon: MoveDown,        color: 'var(--leg-color)',    bg: 'var(--leg-bg)' },
  'Body Weight': { Icon: Activity,        color: 'var(--bw-color)',     bg: 'var(--bw-bg)' },
  'Others':      { Icon: Zap,             color: 'var(--others-color)', bg: 'var(--others-bg)' },
}

function AddExerciseModal({ onClose, onAdded }) {
  const [name, setName]   = useState('')
  const [cat, setCat]     = useState('Push')
  const [unit, setUnit]   = useState('KG')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim()) { setError('Nama tidak boleh kosong'); return }
    const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    onAdded({ id, name: name.trim(), category: cat, defaultUnit: unit })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '18px' }}>Tambah Gerakan Baru</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="btn-close-addex">
            <X size={18} />
          </button>
        </div>

        <div className="input-group mb-3">
          <label className="input-label">Nama Gerakan</label>
          <input
            className="input" id="input-ex-name"
            placeholder="misal: Incline Dumbbell Press"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          {error && <p className="text-xs" style={{ color: 'var(--accent)', marginTop: 4 }}>{error}</p>}
        </div>

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
                    padding: '9px 6px', borderRadius: '6px',
                    border: `1.5px solid ${active ? m.color : 'var(--border)'}`,
                    background: active ? m.bg : 'var(--bg-card-2)',
                    color: active ? m.color : 'var(--text-muted)',
                    fontWeight: 500, fontSize: '12px', cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <m.Icon size={18} color={active ? m.color : 'var(--text-muted)'} /><span>{c}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="input-group mb-4">
          <label className="input-label">Satuan</label>
          <div className="unit-toggle">
            {UNITS.map(u => (
              <button key={u} className={unit === u ? 'active' : ''} onClick={() => setUnit(u)}>
                {u}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 5 }}>
            KG / BAR = beban · BW = bodyweight (reps) · SEC = waktu (plank, dll)
          </p>
        </div>

        <button
          className="btn btn-primary btn-full" id="btn-save-addex"
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

export default function WorkoutLogger() {
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary }   = useExerciseLibrary()

  const [showAddExercise, setShowAddExercise]   = useState(false)
  const [expandedCat, setExpandedCat]           = useState(null)
  const [editExercise, setEditExercise]         = useState(null)
  const dragIdx     = useRef(null)
  const dragOverIdx = useRef(null)

  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const handleAddEx    = (ex) => setLibrary(prev => [...prev, ex])
  const deleteExercise = (exId) => {
    if (!confirm('Hapus gerakan ini dari library?')) return
    setLibrary(prev => prev.filter(ex => ex.id !== exId))
  }

  const reorderExercise = (cat, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    setLibrary(prev => {
      const catItems = prev.filter(ex => ex.category === cat)
      const others   = prev.filter(ex => ex.category !== cat)
      const moved = [...catItems]
      const [item] = moved.splice(fromIdx, 1)
      moved.splice(toIdx, 0, item)
      return [...others, ...moved]
    })
  }

  const catCounts = {}
  ALL_CATS.forEach(cat => {
    catCounts[cat] = library.filter(ex => ex.category === cat).length
  })

  const expandedExercises = expandedCat ? library.filter(ex => ex.category === expandedCat) : []

  return (
    <div className="page">
      <div className="page-header" style={{ paddingTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '-0.104px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Latihan <Dumbbell size={22} color="var(--accent)" />
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            {library.length} gerakan tersimpan
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          id="btn-add-custom-exercise"
          onClick={() => setShowAddExercise(true)}
          style={{ gap: 6 }}
        >
          <Dumbbell size={16} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>+ Gerakan</span>
        </button>
      </div>

      <div className="cat-list-vertical">
        {ALL_CATS.map(cat => {
          const meta       = CAT_META[cat]
          const isExpanded = expandedCat === cat
          const exCount    = catCounts[cat]

          return (
            <div key={cat}>
              <div
                className="cat-list-item"
                id={`cat-${cat.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
                style={{
                  borderColor: isExpanded ? meta.color : 'var(--border)',
                  background: isExpanded ? meta.bg : 'var(--bg-card)',
                }}
              >
                <div
                  className="cat-icon"
                  style={{
                    background: meta.bg,
                    border: `1px solid var(--border)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <meta.Icon size={18} color={meta.color} />
                </div>
                <div className="cat-info">
                  <div className="cat-name" style={{ color: isExpanded ? meta.color : 'var(--text-primary)' }}>
                    {cat}
                  </div>
                  <div className="cat-count" style={{ color: isExpanded ? meta.color : 'var(--text-muted)' }}>
                    {exCount} gerakan
                  </div>
                </div>
                <div
                  className="cat-arrow"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: isExpanded ? meta.color : 'var(--text-muted)',
                  }}
                >
                  <ChevronDown size={18} />
                </div>
              </div>

              {isExpanded && (
                <div className="exercise-list-enter" style={{ marginTop: 4, marginBottom: 8 }}>
                  {expandedExercises.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="text-xs" style={{
                        fontWeight: 500, textTransform: 'uppercase',
                        letterSpacing: '0.3px', padding: '8px 0 6px 24px',
                        color: meta.color, opacity: 0.8,
                      }}>
                        Gerakan
                      </div>
                      {expandedExercises.map((ex, idx) => {
                        const lastSession = sorted.find(w =>
                          w.exercises?.some(e => e.exerciseId === ex.id)
                        )
                        const lastEntry = lastSession?.exercises?.find(e => e.exerciseId === ex.id)
                        const maxW = lastEntry ? getMaxWeight(lastEntry) : null

                        return (
                          <div
                            key={ex.id}
                            className="exercise-row-item"
                            style={{ animationDelay: `${idx * 0.04}s` }}
                            draggable
                            onDragStart={() => { dragIdx.current = idx }}
                            onDragEnter={() => { dragOverIdx.current = idx }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => {
                              reorderExercise(expandedCat, dragIdx.current, dragOverIdx.current)
                              dragIdx.current = null
                              dragOverIdx.current = null
                            }}
                          >
                            <span
                              style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </span>

                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: '14px' }}>{ex.name}</div>
                              <div className="text-xs text-muted" style={{ marginTop: 1 }}>
                                {ex.defaultUnit}
                                {maxW !== null && maxW > 0 && (
                                  <> · terakhir: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {ex.defaultUnit === 'BW' || ex.defaultUnit === 'SEC' ? `${maxW} reps` : `${maxW} ${ex.defaultUnit}`}
                                  </span></>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); setEditExercise(ex) }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--accent)', padding: 6,
                                display: 'flex', alignItems: 'center',
                                borderRadius: 6, flexShrink: 0,
                                transition: 'color 0.2s ease, background 0.2s ease',
                              }}
                              title="Catat berat"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); deleteExercise(ex.id) }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 6,
                                display: 'flex', alignItems: 'center',
                                borderRadius: 6, flexShrink: 0,
                                transition: 'color 0.2s ease, background 0.2s ease',
                              }}
                              title="Hapus gerakan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {expandedExercises.length === 0 && (
                    <div style={{ padding: '14px 24px', marginLeft: 20, borderLeft: '2px solid var(--border)' }}>
                      <p className="text-xs text-muted">
                        Belum ada gerakan — tambahkan via tombol "+ Gerakan" di atas
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onAdded={handleAddEx}
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
