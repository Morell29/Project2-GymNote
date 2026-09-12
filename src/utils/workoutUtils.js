// src/utils/workoutUtils.js
// Helper functions for progressive overload calculations

/**
 * Get the last workout session that contains a specific exercise
 */
export function getLastSessionForExercise(workouts, exerciseId, excludeSessionId = null) {
  const relevant = workouts
    .filter(w => w.id !== excludeSessionId && w.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (!relevant.length) return null

  const session = relevant[0]
  const exercise = session.exercises.find(e => e.exerciseId === exerciseId)
  return { session, exercise }
}

/**
 * Calculate total volume for an exercise entry (weight x reps across sets)
 */
export function calculateVolume(exerciseEntry) {
  return exerciseEntry.sets.reduce((sum, set) => {
    const w = parseFloat(set.weight) || 0
    const r = parseInt(set.reps) || 0
    return sum + w * r
  }, 0)
}

/**
 * Get max weight from an exercise entry
 */
export function getMaxWeight(exerciseEntry) {
  return Math.max(...exerciseEntry.sets.map(s => parseFloat(s.weight) || 0))
}

/**
 * Get max reps from an exercise entry (across sets with same max weight)
 */
export function getMaxReps(exerciseEntry) {
  const maxW = getMaxWeight(exerciseEntry)
  const topSets = exerciseEntry.sets.filter(s => (parseFloat(s.weight) || 0) === maxW)
  return Math.max(...topSets.map(s => parseInt(s.reps) || 0))
}

/**
 * Compare current exercise with last session
 * Returns { direction: 'up'|'down'|'same', diff, label }
 */
export function compareWithLast(currentExercise, lastExercise) {
  if (!lastExercise) return null

  const currentMax = getMaxWeight(currentExercise)
  const lastMax = getMaxWeight(lastExercise)
  const unit = currentExercise.unit || 'KG'

  const diff = currentMax - lastMax

  if (diff > 0) return { direction: 'up', diff, label: `↗ +${diff} ${unit} dari sesi terakhir` }
  if (diff < 0) return { direction: 'down', diff: Math.abs(diff), label: `↘ -${Math.abs(diff)} ${unit} dari sesi terakhir` }
  return { direction: 'same', diff: 0, label: `→ Sama dengan sesi terakhir` }
}

/**
 * Get historical weight progress for a specific exercise across all sessions
 */
export function getExerciseHistory(workouts, exerciseId) {
  return workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(w => {
      const exercise = w.exercises.find(e => e.exerciseId === exerciseId)
      return {
        date: new Date(w.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        maxWeight: getMaxWeight(exercise),
        volume: calculateVolume(exercise),
        unit: exercise.unit || 'KG',
      }
    })
}

/**
 * Format date relative to today
 */
export function formatRelativeDate(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  if (diff < 7) return `${diff} hari lalu`
  if (diff < 30) return `${Math.floor(diff / 7)} minggu lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
}

/**
 * Get workout days in last N days (for streak/calendar)
 */
export function getWorkoutDays(workouts, days = 14) {
  const result = new Set()
  workouts.forEach(w => {
    const d = new Date(w.date)
    result.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  })
  return result
}

/**
 * Calculate current workout streak
 */
export function calculateStreak(workouts) {
  const days = getWorkoutDays(workouts)
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (days.has(key)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

/**
 * Generate unique session ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Create a blank set
 */
export function createBlankSet() {
  return { id: generateId(), weight: '', reps: '', rpe: '', done: false }
}
