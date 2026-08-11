// src/components/QuickEditModal.jsx
// Edit berat & reps langsung dari beranda tanpa perlu log sesi

import { useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { useWorkouts } from '../hooks/useStorage'
import { generateId, getMaxWeight } from '../utils/workoutUtils'

export default function QuickEditModal({ exercise, workouts, onClose }) {
  const { setWorkouts } = useWorkouts()
  const unit = exercise.defaultUnit || 'KG'
  const isBW  = unit === 'BW'
  const isSEC = unit === 'SEC'

  // Pre-fill dari sesi terakhir supaya user tinggal ubah angkanya
  const lastSession = [...workouts]
    .filter(w => w.exercises?.some(e => e.exerciseId === exercise.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  const lastEntry = lastSession?.exercises?.find(e => e.exerciseId === exercise.id)
  const lastMax   = lastEntry ? getMaxWeight(lastEntry) : null

  const [sets, setSets] = useState(() => {
    if (lastEntry?.sets?.length) {
      return lastEntry.sets.map(s => ({
        id: generateId(),
        weight: s.weight || '',
        reps: s.reps || '',
      }))
    }
    return [{ id: generateId(), weight: '', reps: '' }]
  })

  const addSet    = () => setSets(p => [...p, { id: generateId(), weight: '', reps: '' }])
  const removeSet = (id) => setSets(p => p.length > 1 ? p.filter(s => s.id !== id) : p)
  const updateSet = (id, field, val) =>
    setSets(p => p.map(s => s.id === id ? { ...s, [field]: val } : s))

  const handleSave = () => {
    // Filter set yang ada isian
    const validSets = sets.filter(s => s.weight !== '' || s.reps !== '')
    if (!validSets.length) { onClose(); return }

    // Buat entry session baru (hari ini) dengan exercise ini
    const today = new Date()
    const session = {
      id: generateId(),
      name: exercise.category,
      category: exercise.category,
      date: today.toISOString(),
      duration: 0,
      exercises: [{
        id: generateId(),
        exerciseId: exercise.id,
        unit,
        sets: validSets.map(s => ({ ...s, done: true })),
      }],
    }
    setWorkouts(prev => [session, ...prev])
    onClose()
  }

  // Hitung current max dari input user (untuk realtime feedback)
  const currentMax = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
  const isNewPR    = lastMax !== null && currentMax > lastMax

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 3 }}>{exercise.name}</h2>
            <p className="text-xs text-muted">{exercise.category} · {unit}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" id="btn-close-quickedit" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Reference: last recorded */}
        {lastMax !== null && lastMax > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--bg-card-2)',
              borderRadius: 'var(--radius-sm)',
              margin: '12px 0',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-xs text-muted">📊 Catatan terakhir:</span>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--accent)' }}>
              {isBW || isSEC ? `${lastEntry?.sets?.length || 0} set` : `${lastMax} ${unit}`}
            </span>
            {isNewPR && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(122,206,138,0.15)',
                  border: '1px solid rgba(122,206,138,0.3)',
                  color: '#7ace8a',
                  borderRadius: 100,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                }}
              >
                🏆 PR BARU!
              </span>
            )}
          </div>
        )}

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isBW || isSEC ? '26px 1fr 28px' : '26px 1fr 1fr 28px',
            gap: 8,
            padding: '8px 0 6px',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          <span>#</span>
          <span>
            {isSEC ? 'Detik' : isBW ? 'Reps' : `Berat (${unit})`}
          </span>
          {!isBW && !isSEC && <span>Reps</span>}
          <span />
        </div>

        {/* Set rows */}
        <div style={{ marginBottom: 10 }}>
          {sets.map((set, idx) => (
            <div
              key={set.id}
              style={{
                display: 'grid',
                gridTemplateColumns: isBW || isSEC ? '26px 1fr 28px' : '26px 1fr 1fr 28px',
                gap: 8,
                marginBottom: 7,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                }}
              >
                {idx + 1}
              </span>

              {/* Weight / reps / seconds input */}
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                placeholder={isSEC ? 'detik' : isBW ? 'reps' : '0'}
                value={set.weight}
                onChange={e => updateSet(set.id, 'weight', e.target.value)}
                autoFocus={idx === 0}
              />

              {/* Reps (hanya untuk KG/BAR) */}
              {!isBW && !isSEC && (
                <input
                  className="set-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="reps"
                  value={set.reps}
                  onChange={e => updateSet(set.id, 'reps', e.target.value)}
                />
              )}

              {/* Delete set */}
              <button
                onClick={() => removeSet(set.id)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', padding: 4,
                  opacity: sets.length === 1 ? 0.3 : 1,
                }}
                disabled={sets.length === 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add set */}
        <button
          className="btn btn-ghost btn-sm btn-full"
          onClick={addSet}
          style={{ borderStyle: 'dashed', marginBottom: 14 }}
        >
          <Plus size={13} /> Tambah Set
        </button>

        {/* Save */}
        <button
          className="btn btn-primary btn-full"
          id="btn-save-quickedit"
          onClick={handleSave}
        >
          <Check size={17} />
          {isNewPR ? '🏆 Simpan PR Baru!' : 'Simpan Catatan'}
        </button>
      </div>
    </div>
  )
}
