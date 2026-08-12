// src/pages/WorkoutLogger.jsx
// Halaman Latihan — riwayat semua sesi + tambah gerakan custom
// (Timer-based session dihapus, fokus ke progressive overload tracking)

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Trash2, Pencil, Dumbbell } from 'lucide-react'
import UpdateProgressModal from '../components/UpdateProgressModal'
import { useWorkouts, useExerciseLibrary } from '../hooks/useStorage'
import { generateId, formatRelativeDate, calculateVolume, getMaxWeight } from '../utils/workoutUtils'

// ── Konstanta ──────────────────────────────────────────────────────────────────
const ALL_CATS = ['Push', 'Pull', 'Leg', 'Body Weight', 'Others']
const UNITS    = ['KG', 'BAR', 'BW', 'SEC']

const CAT_META = {
  'Push':        { emoji: '💪', color: 'var(--push-color)',   bg: 'var(--push-bg)',   rgb: '224,123,106' },
  'Pull':        { emoji: '🏋️', color: 'var(--pull-color)',   bg: 'var(--pull-bg)',   rgb: '106,158,224' },
  'Leg':         { emoji: '🦵', color: 'var(--leg-color)',    bg: 'var(--leg-bg)',    rgb: '122,206,138' },
  'Body Weight': { emoji: '🤸', color: 'var(--bw-color)',     bg: 'var(--bw-bg)',     rgb: '201,138,224' },
  'Others':      { emoji: '⚡', color: 'var(--others-color)', bg: 'var(--others-bg)', rgb: '224,192,106' },
}

function getCategoryFromSession(session, library) {
  if (session.category) return session.category
  const firstEx = session.exercises?.[0]
  if (firstEx) {
    const def = library.find(l => l.id === firstEx.exerciseId)
    if (def?.category) return def.category
  }
  return 'Others'
}

function formatDuration(s) {
  if (!s) return null
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}j ${m % 60}m` : `${m}m`
}

// ── Modal: Tambah Gerakan Custom ───────────────────────────────────────────────
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
          <h2 style={{ fontSize: '1.1rem' }}>Tambah Gerakan Baru</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="btn-close-addex">
            <X size={18} />
          </button>
        </div>

        {/* Nama */}
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
                    padding: '9px 6px', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${active ? m.color : 'var(--border)'}`,
                    background: active ? m.bg : 'var(--bg-card-2)',
                    color: active ? m.color : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <span>{m.emoji}</span><span>{c}</span>
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

// ── Kartu Sesi Riwayat ─────────────────────────────────────────────────────────
function SessionCard({ session, library, workouts, onUpdateProgress, onDelete }) {
  const [expanded, setExpanded]   = useState(false)
  const [exDetail, setExDetail]   = useState(null)

  const category = getCategoryFromSession(session, library)
  const meta     = CAT_META[category] || CAT_META['Others']
  const exCount  = session.exercises?.length || 0
  const totalVol = session.exercises?.reduce((s, ex) => s + calculateVolume(ex), 0) || 0
  const dur      = formatDuration(session.duration)

  const dateStr = new Date(session.date).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${expanded ? `rgba(${meta.rgb},0.3)` : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', marginBottom: 10, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', cursor: 'pointer', gap: 10 }}
        onClick={() => setExpanded(p => !p)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: meta.bg, border: `1px solid rgba(${meta.rgb},0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>
          {meta.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: meta.color, marginBottom: 2 }}>
            {session.category || session.name || 'Latihan'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="text-xs text-muted">{dateStr}</span>
            {dur && <span className="text-xs text-muted">· {dur}</span>}
            <span className="text-xs text-muted">· {exCount} gerakan</span>
          </div>
        </div>

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

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, marginBottom: 12 }}>
            <button
              className="btn btn-sm"
              id={`btn-update-${session.id}`}
              onClick={() => onUpdateProgress(session)}
              style={{
                background: meta.color, color: 'var(--text-on-accent)',
                fontWeight: 700, fontSize: '0.78rem', flex: 1, gap: 5,
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
          {exCount === 0 ? (
            <p className="text-xs text-muted" style={{ textAlign: 'center', padding: '10px 0' }}>
              Belum ada gerakan — tap Update Progress untuk mengisi
            </p>
          ) : (
            session.exercises.map(ex => {
              const def   = library.find(l => l.id === ex.exerciseId)
              const maxW  = getMaxWeight(ex)
              const isOpen = exDetail === ex.exerciseId

              return (
                <div key={ex.exerciseId} style={{
                  background: 'var(--bg-card-2)', borderRadius: 'var(--radius-sm)',
                  marginBottom: 6, overflow: 'hidden', border: '1px solid var(--border)',
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', cursor: 'pointer', gap: 8 }}
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
                    <span className="text-xs text-muted">{ex.sets.length}×</span>
                    {isOpen ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0 12px 10px' }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '28px 1fr 1fr',
                        gap: 6, marginBottom: 6,
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center',
                      }}>
                        <span>Set</span>
                        <span>{ex.unit === 'BW' ? 'Reps' : ex.unit === 'SEC' ? 'Detik' : `Berat`}</span>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WorkoutLogger() {
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary }   = useExerciseLibrary()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [updateSession, setUpdateSession]     = useState(null)
  const [expandedCat, setExpandedCat]         = useState(null) // kategori yang sedang terbuka

  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const deleteSession = (id) => setWorkouts(prev => prev.filter(w => w.id !== id))
  const handleAddEx   = (ex) => setLibrary(prev => [...prev, ex])

  // Hitung jumlah exercise per kategori
  const catCounts = {}
  ALL_CATS.forEach(cat => {
    catCounts[cat] = library.filter(ex => ex.category === cat).length
  })

  // Hitung jumlah sesi per kategori
  const sessionCounts = {}
  ALL_CATS.forEach(cat => {
    sessionCounts[cat] = workouts.filter(w => getCategoryFromSession(w, library) === cat).length
  })

  // Exercise dalam kategori yang di-expand
  const expandedExercises = expandedCat ? library.filter(ex => ex.category === expandedCat) : []

  // Sesi di kategori yang dipilih
  const expandedSessions = expandedCat
    ? sorted.filter(s => getCategoryFromSession(s, library) === expandedCat)
    : []

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.6rem' }}>
            Latihan <span style={{ color: 'var(--accent)' }}>🏋️</span>
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            {sorted.length} sesi · {library.length} gerakan tersimpan
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          id="btn-add-custom-exercise"
          onClick={() => setShowAddExercise(true)}
          style={{ gap: 6 }}
        >
          <Dumbbell size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>+ Gerakan</span>
        </button>
      </div>

      {/* Vertical Category List */}
      <div className="cat-list-vertical">
        {ALL_CATS.map(cat => {
          const meta       = CAT_META[cat]
          const isExpanded = expandedCat === cat
          const exCount    = catCounts[cat]
          const sesCount   = sessionCounts[cat]

          return (
            <div key={cat}>
              {/* Category row */}
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
                    background: isExpanded ? `rgba(${meta.rgb}, 0.2)` : meta.bg,
                    border: `1.5px solid rgba(${meta.rgb}, ${isExpanded ? 0.4 : 0.2})`,
                  }}
                >
                  {meta.emoji}
                </div>
                <div className="cat-info">
                  <div className="cat-name" style={{ color: isExpanded ? meta.color : 'var(--text-primary)' }}>
                    {cat}
                  </div>
                  <div className="cat-count" style={{ color: isExpanded ? meta.color : 'var(--text-muted)' }}>
                    {exCount} gerakan · {sesCount} sesi
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

              {/* Expanded: exercise list + session history */}
              {isExpanded && (
                <div className="exercise-list-enter" style={{ marginTop: 4, marginBottom: 8 }}>
                  {/* Exercise gerakan */}
                  {expandedExercises.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="text-xs text-muted" style={{
                        fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', padding: '8px 0 6px 24px',
                        color: meta.color, opacity: 0.7,
                      }}>
                        Gerakan
                      </div>
                      {expandedExercises.map((ex, idx) => {
                        // Cari data terakhir untuk exercise ini
                        const lastSession = sorted.find(w =>
                          w.exercises?.some(e => e.exerciseId === ex.id)
                        )
                        const lastEntry = lastSession?.exercises?.find(e => e.exerciseId === ex.id)
                        const maxW = lastEntry ? getMaxWeight(lastEntry) : null

                        return (
                          <div
                            key={ex.id}
                            className="exercise-row-item"
                            style={{
                              animationDelay: `${idx * 0.04}s`,
                              borderLeftColor: `rgba(${meta.rgb}, 0.25)`,
                            }}
                          >
                            {/* Dot */}
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: meta.color, opacity: 0.6, flexShrink: 0,
                            }} />

                            {/* Name */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ex.name}</div>
                              <div className="text-xs text-muted" style={{ marginTop: 1 }}>
                                {ex.defaultUnit}
                                {maxW !== null && maxW > 0 && (
                                  <> · terakhir: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                                    {ex.defaultUnit === 'BW' || ex.defaultUnit === 'SEC' ? `${maxW} reps` : `${maxW} ${ex.defaultUnit}`}
                                  </span></>
                                )}
                              </div>
                            </div>
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

                  {/* Session history for this category */}
                  {expandedSessions.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div className="text-xs text-muted" style={{
                        fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', padding: '6px 0 6px 4px',
                        color: meta.color, opacity: 0.7,
                      }}>
                        Riwayat Sesi
                      </div>
                      {expandedSessions.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          library={library}
                          workouts={workouts}
                          onUpdateProgress={setUpdateSession}
                          onDelete={deleteSession}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onAdded={handleAddEx}
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
