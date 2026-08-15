import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Timer, TrendingUp } from 'lucide-react'
import { createBlankSet, compareWithLast, getLastSessionForExercise } from '../utils/workoutUtils'

export default function ExerciseCard({
  exerciseEntry,
  exerciseDef,
  workouts,
  currentSessionId,
  onChange,
  onRemove,
  onStartTimer,
}) {
  const [expanded, setExpanded] = useState(true)

  const lastData = getLastSessionForExercise(workouts, exerciseEntry.exerciseId, currentSessionId)
  const lastExercise = lastData?.exercise
  const comparison = compareWithLast(exerciseEntry, lastExercise)

  const updateSet = (setIdx, field, value) => {
    const newSets = exerciseEntry.sets.map((s, i) =>
      i === setIdx ? { ...s, [field]: value } : s
    )
    onChange({ ...exerciseEntry, sets: newSets })
  }

  const toggleDone = (setIdx) => {
    const newSets = exerciseEntry.sets.map((s, i) =>
      i === setIdx ? { ...s, done: !s.done } : s
    )
    onChange({ ...exerciseEntry, sets: newSets })
    if (!exerciseEntry.sets[setIdx].done) {
      onStartTimer()
    }
  }

  const addSet = () => {
    const lastSet = exerciseEntry.sets[exerciseEntry.sets.length - 1]
    const newSet = lastSet
      ? { ...createBlankSet(), weight: lastSet.weight, reps: lastSet.reps }
      : createBlankSet()
    onChange({ ...exerciseEntry, sets: [...exerciseEntry.sets, newSet] })
  }

  const removeSet = (setIdx) => {
    if (exerciseEntry.sets.length <= 1) return
    onChange({ ...exerciseEntry, sets: exerciseEntry.sets.filter((_, i) => i !== setIdx) })
  }

  const setUnit = (unit) => {
    onChange({ ...exerciseEntry, unit })
  }

  const doneCount = exerciseEntry.sets.filter(s => s.done).length

  return (
    <div className={`exercise-card ${doneCount === exerciseEntry.sets.length && doneCount > 0 ? 'card-accent' : ''}`}>
      <div className="exercise-header" onClick={() => setExpanded(e => !e)}>
        <div className="exercise-name">
          <span>{exerciseDef?.name || exerciseEntry.exerciseId}</span>
          {doneCount > 0 && (
            <span className="badge badge-green" style={{ fontSize: '11px' }}>
              {doneCount}/{exerciseEntry.sets.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div className="exercise-body">
          <div className="flex items-center justify-between mb-3">
            <div className="unit-toggle" style={{ maxWidth: 120 }}>
              <button className={exerciseEntry.unit === 'KG' ? 'active' : ''} onClick={() => setUnit('KG')}>KG</button>
              <button className={exerciseEntry.unit === 'BAR' ? 'active' : ''} onClick={() => setUnit('BAR')}>BAR</button>
            </div>

            {comparison && (
              <div className={`overload-indicator ${
                comparison.direction === 'up' ? 'overload-up' :
                comparison.direction === 'down' ? 'overload-down' : 'overload-same'
              }`}>
                {comparison.label}
              </div>
            )}
          </div>

          {lastExercise && (
            <div className="mb-3" style={{
              background: 'var(--bg-card-2)',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border)',
            }}>
              <TrendingUp size={13} />
              Sesi terakhir: {lastExercise.sets.map(s => `${s.weight||'?'}${lastExercise.unit||'KG'} × ${s.reps||'?'}`).join(', ')}
            </div>
          )}

          <div className="set-header-row">
            <span>Set</span>
            <span>{exerciseEntry.unit || 'KG'}</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
          </div>

          {exerciseEntry.sets.map((set, idx) => (
            <div key={set.id} className="set-row">
              <button
                className={`set-num ${set.done ? 'done' : ''}`}
                onClick={() => toggleDone(idx)}
                style={{ cursor: 'pointer', border: 'none', width: '100%' }}
                title="Tandai selesai"
              >
                {set.done ? '✓' : idx + 1}
              </button>
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                placeholder={lastExercise?.sets[idx]?.weight || '0'}
                value={set.weight}
                onChange={e => updateSet(idx, 'weight', e.target.value)}
              />
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                placeholder={lastExercise?.sets[idx]?.reps || '0'}
                value={set.reps}
                onChange={e => updateSet(idx, 'reps', e.target.value)}
              />
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="1"
                max="10"
                placeholder="RPE"
                value={set.rpe}
                onChange={e => updateSet(idx, 'rpe', e.target.value)}
              />
              <button
                className="btn btn-danger btn-icon btn-sm"
                onClick={() => removeSet(idx)}
                disabled={exerciseEntry.sets.length <= 1}
                style={{ opacity: exerciseEntry.sets.length <= 1 ? 0.3 : 1 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <button className="btn btn-ghost btn-sm" onClick={addSet} style={{ flex: 1 }}>
              <Plus size={15} /> Tambah Set
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onStartTimer}>
              <Timer size={15} /> Rest
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
