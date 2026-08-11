// src/components/UpdateProgressModal.jsx
// Modal untuk input berat & reps setelah mencatat jenis latihan

import { useState } from 'react'
import { X, Plus, Trash2, Check, ChevronDown, ChevronUp, SkipForward } from 'lucide-react'
import { useWorkouts } from '../hooks/useStorage'
import { generateId } from '../utils/workoutUtils'

const CAT_META = {
  'Push':        { emoji: '💪', color: 'var(--push-color)',   bg: 'var(--push-bg)'   },
  'Pull':        { emoji: '🏋️', color: 'var(--pull-color)',   bg: 'var(--pull-bg)'   },
  'Leg':         { emoji: '🦵', color: 'var(--leg-color)',    bg: 'var(--leg-bg)'    },
  'Body Weight': { emoji: '🤸', color: 'var(--bw-color)',     bg: 'var(--bw-bg)'     },
  'Others':      { emoji: '⚡', color: 'var(--others-color)', bg: 'var(--others-bg)' },
}

export default function UpdateProgressModal({ session, library, onClose }) {
  const { setWorkouts } = useWorkouts()

  const category = session.category || session.name
  const meta = CAT_META[category] || { emoji: '🏋️', color: 'var(--accent)', bg: 'var(--accent-glow-sm)' }

  // Exercises dalam kategori ini
  const catExercises = library.filter(ex => ex.category === category)

  // State: exerciseId → { unit, sets[], expanded }
  const [entries, setEntries] = useState(() => {
    // Pre-populate dari session jika sudah ada exercises
    const map = {}
    if (session.exercises?.length) {
      session.exercises.forEach(e => {
        map[e.exerciseId] = {
          unit: e.unit,
          sets: e.sets.map(s => ({ ...s })),
          expanded: true,
        }
      })
    }
    return map
  })

  const toggleExercise = (ex) => {
    setEntries(prev => {
      if (prev[ex.id]) {
        // Unselect — hapus
        const next = { ...prev }
        delete next[ex.id]
        return next
      }
      // Select — tambah dengan 1 set kosong
      return {
        ...prev,
        [ex.id]: {
          unit: ex.defaultUnit || 'KG',
          sets: [{ id: generateId(), weight: '', reps: '' }],
          expanded: true,
        },
      }
    })
  }

  const toggleExpanded = (exId) => {
    setEntries(prev => ({
      ...prev,
      [exId]: { ...prev[exId], expanded: !prev[exId].expanded },
    }))
  }

  const addSet = (exId) => {
    setEntries(prev => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        sets: [...prev[exId].sets, { id: generateId(), weight: '', reps: '' }],
      },
    }))
  }

  const removeSet = (exId, setId) => {
    setEntries(prev => {
      const newSets = prev[exId].sets.filter(s => s.id !== setId)
      if (newSets.length === 0) {
        // Jika set habis, unselect exercise
        const next = { ...prev }
        delete next[exId]
        return next
      }
      return { ...prev, [exId]: { ...prev[exId], sets: newSets } }
    })
  }

  const updateSet = (exId, setId, field, value) => {
    setEntries(prev => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        sets: prev[exId].sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
      },
    }))
  }

  const handleSave = () => {
    const updatedExercises = Object.entries(entries).map(([exId, entry]) => ({
      id: generateId(),
      exerciseId: exId,
      unit: entry.unit,
      sets: entry.sets.map(s => ({ ...s, done: true })),
    }))

    const updatedSession = { ...session, exercises: updatedExercises }

    setWorkouts(prev => {
      const exists = prev.some(w => w.id === session.id)
      if (exists) {
        return prev.map(w => w.id === session.id ? updatedSession : w)
      }
      return [updatedSession, ...prev]
    })

    onClose()
  }

  const selectedCount = Object.keys(entries).length
  const dateStr = new Date(session.date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet" style={{ maxHeight: '90dvh' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: '1.1rem' }}>{meta.emoji}</span>
              <h2 style={{ fontSize: '1.05rem' }}>Update Progress</h2>
            </div>
            <p className="text-xs text-muted">{category} · {dateStr}</p>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            id="btn-close-updateprogress"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Instruction */}
        <div
          style={{
            padding: '10px 12px',
            background: meta.bg,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${meta.color}30`,
            marginBottom: 14,
          }}
        >
          <p className="text-xs" style={{ color: meta.color, fontWeight: 600 }}>
            Centang gerakan yang kamu lakukan, lalu isi berat & repetisi setiap set.
          </p>
        </div>

        {/* Exercise list */}
        <div style={{ overflowY: 'auto', maxHeight: '52dvh', paddingRight: 2, marginBottom: 14 }}>
          {catExercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>🏋️</div>
              <p className="text-sm">Belum ada exercise di kategori ini</p>
            </div>
          ) : (
            catExercises.map(ex => {
              const entry = entries[ex.id]
              const isSelected = !!entry

              return (
                <div
                  key={ex.id}
                  style={{
                    marginBottom: 8,
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isSelected ? meta.color + '60' : 'var(--border)'}`,
                    overflow: 'hidden',
                    background: isSelected ? meta.bg : 'var(--bg-card-2)',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {/* Row: checkbox + name + expand toggle */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '11px 14px',
                      gap: 10,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleExercise(ex)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${isSelected ? meta.color : 'var(--border)'}`,
                        background: isSelected ? meta.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}
                    >
                      {isSelected && (
                        <Check size={13} color="var(--text-on-accent)" strokeWidth={3} />
                      )}
                    </div>

                    {/* Name */}
                    <span
                      onClick={() => toggleExercise(ex)}
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flex: 1,
                        cursor: 'pointer',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'color 0.2s',
                      }}
                    >
                      {ex.name}
                    </span>

                    {/* Unit badge + expand arrow */}
                    <span
                      className="text-xs text-muted"
                      style={{ fontWeight: 600, marginRight: 6 }}
                    >
                      {ex.defaultUnit}
                    </span>

                    {isSelected && (
                      <button
                        onClick={() => toggleExpanded(ex.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          padding: 2,
                        }}
                      >
                        {entry.expanded
                          ? <ChevronUp size={15} />
                          : <ChevronDown size={15} />
                        }
                      </button>
                    )}
                  </div>

                  {/* Set inputs (when selected & expanded) */}
                  {isSelected && entry.expanded && (
                    <div style={{ padding: '0 14px 12px' }}>
                      {/* Column headers */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '22px 1fr 1fr 30px',
                          gap: 6,
                          padding: '2px 0 7px',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textAlign: 'center',
                        }}
                      >
                        <span>#</span>
                        <span>
                          {entry.unit === 'BW' ? 'Reps' : entry.unit === 'SEC' ? 'Detik' : `Berat (${entry.unit})`}
                        </span>
                        <span>{entry.unit === 'BW' || entry.unit === 'SEC' ? 'Set' : 'Reps'}</span>
                        <span />
                      </div>

                      {entry.sets.map((set, idx) => (
                        <div
                          key={set.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '22px 1fr 1fr 30px',
                            gap: 6,
                            marginBottom: 6,
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              textAlign: 'center',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: meta.color,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <input
                            className="set-input"
                            type="number"
                            inputMode="decimal"
                            placeholder={entry.unit === 'SEC' ? 'detik' : entry.unit === 'BW' ? 'reps' : '0'}
                            value={set.weight}
                            onChange={e => updateSet(ex.id, set.id, 'weight', e.target.value)}
                          />
                          <input
                            className="set-input"
                            type="number"
                            inputMode="numeric"
                            placeholder={entry.unit === 'BW' || entry.unit === 'SEC' ? '—' : 'reps'}
                            value={set.reps}
                            onChange={e => updateSet(ex.id, set.id, 'reps', e.target.value)}
                            disabled={entry.unit === 'BW' || entry.unit === 'SEC'}
                            style={{ opacity: (entry.unit === 'BW' || entry.unit === 'SEC') ? 0.4 : 1 }}
                          />
                          <button
                            onClick={() => removeSet(ex.id, set.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              padding: 4,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => addSet(ex.id)}
                        style={{
                          width: '100%',
                          marginTop: 4,
                          borderStyle: 'dashed',
                          fontSize: '0.78rem',
                        }}
                      >
                        <Plus size={13} /> Tambah Set
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Save button */}
        <button
          className="btn btn-primary btn-full"
          id="btn-save-progress"
          onClick={handleSave}
          disabled={selectedCount === 0}
          style={{ opacity: selectedCount > 0 ? 1 : 0.45 }}
        >
          <Check size={17} />
          Simpan {selectedCount > 0 ? `${selectedCount} Gerakan` : 'Progress'}
        </button>

        {/* Lewati — simpan sesi tanpa detail */}
        <button
          className="btn btn-ghost btn-full"
          id="btn-skip-progress"
          onClick={() => {
            // Simpan sesi apa adanya (meski tanpa exercises)
            setWorkouts(prev => {
              const exists = prev.some(w => w.id === session.id)
              if (exists) return prev // sudah ada, tidak perlu ubah
              return [{ ...session, exercises: [] }, ...prev]
            })
            onClose()
          }}
          style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}
        >
          <SkipForward size={15} />
          Lewati — Simpan Tanpa Detail
        </button>
      </div>
    </div>
  )
}
