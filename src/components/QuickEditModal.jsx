import { useState } from 'react'
import { X, Plus, Trash2, Check, BarChart2, Trophy } from 'lucide-react'
import { generateId, getMaxWeight } from '../utils/workoutUtils'

export default function QuickEditModal({ exercise, workouts, onClose, setWorkouts }) {
  const unit = exercise.defaultUnit || 'KG'
  const isBW  = unit === 'BW'
  const isSEC = unit === 'SEC'

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
    const validSets = sets.filter(s => s.weight !== '' || s.reps !== '')
    if (!validSets.length) { onClose(); return }

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

  const currentMax = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
  const isNewPR    = lastMax !== null && currentMax > lastMax

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: 3 }}>{exercise.name}</h2>
            <p className="text-xs text-muted">{exercise.category} · {unit}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" id="btn-close-quickedit" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {lastMax !== null && lastMax > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--bg-card-2)',
              borderRadius: '6px',
              margin: '12px 0',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BarChart2 size={12} /> Catatan terakhir:</span>
            <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>
              {isBW || isSEC ? `${lastEntry?.sets?.length || 0} set` : `${lastMax} ${unit}`}
            </span>
            {isNewPR && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(45,157,74,0.08)',
                  border: '1px solid rgba(45,157,74,0.2)',
                  color: '#2d9d4a',
                  borderRadius: 6,
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trophy size={11} /> PR BARU!
              </span>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isBW || isSEC ? '26px 1fr 28px' : '26px 1fr 1fr 28px',
            gap: 8,
            padding: '8px 0 6px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
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
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--accent)',
                }}
              >
                {idx + 1}
              </span>

              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                placeholder={isSEC ? 'detik' : isBW ? 'reps' : '0'}
                value={set.weight}
                onChange={e => updateSet(set.id, 'weight', e.target.value)}
                autoFocus={idx === 0}
              />

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

        <button
          className="btn btn-ghost btn-sm btn-full"
          onClick={addSet}
          style={{ borderStyle: 'dashed', marginBottom: 14 }}
        >
          <Plus size={13} /> Tambah Set
        </button>

        <button
          className="btn btn-primary btn-full"
          id="btn-save-quickedit"
          onClick={handleSave}
        >
          <Check size={17} />
          {isNewPR ? <><Trophy size={15} /> Simpan PR Baru!</> : 'Simpan Catatan'}
        </button>
      </div>
    </div>
  )
}
