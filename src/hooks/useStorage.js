// src/hooks/useStorage.js
// Custom hooks untuk localStorage

import { useState, useEffect } from 'react'

// Generic hook untuk localStorage
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (e) {
      console.error('localStorage error:', e)
    }
  }

  return [storedValue, setValue]
}

// Hook untuk data workout sessions
export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage('gymNote_workouts', [])
  return { workouts, setWorkouts }
}

// Hook untuk exercise templates/definitions
export function useExerciseLibrary() {
  const defaultExercises = [
    { id: 'bench-press', name: 'Bench Press', category: 'Dada', defaultUnit: 'KG' },
    { id: 'incline-press', name: 'Incline Press', category: 'Dada', defaultUnit: 'KG' },
    { id: 'chest-fly', name: 'Chest Fly', category: 'Dada', defaultUnit: 'KG' },
    { id: 'squat', name: 'Squat', category: 'Kaki', defaultUnit: 'KG' },
    { id: 'leg-press', name: 'Leg Press', category: 'Kaki', defaultUnit: 'BAR' },
    { id: 'leg-extension', name: 'Leg Extension', category: 'Kaki', defaultUnit: 'BAR' },
    { id: 'leg-curl', name: 'Leg Curl', category: 'Kaki', defaultUnit: 'BAR' },
    { id: 'deadlift', name: 'Deadlift', category: 'Punggung', defaultUnit: 'KG' },
    { id: 'pull-up', name: 'Pull Up', category: 'Punggung', defaultUnit: 'KG' },
    { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Punggung', defaultUnit: 'BAR' },
    { id: 'cable-row', name: 'Cable Row', category: 'Punggung', defaultUnit: 'BAR' },
    { id: 'overhead-press', name: 'Overhead Press', category: 'Bahu', defaultUnit: 'KG' },
    { id: 'lateral-raise', name: 'Lateral Raise', category: 'Bahu', defaultUnit: 'KG' },
    { id: 'face-pull', name: 'Face Pull', category: 'Bahu', defaultUnit: 'BAR' },
    { id: 'bicep-curl', name: 'Bicep Curl', category: 'Bisep', defaultUnit: 'KG' },
    { id: 'hammer-curl', name: 'Hammer Curl', category: 'Bisep', defaultUnit: 'KG' },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Trisep', defaultUnit: 'BAR' },
    { id: 'skull-crusher', name: 'Skull Crusher', category: 'Trisep', defaultUnit: 'KG' },
    { id: 'calf-raise', name: 'Calf Raise', category: 'Kaki', defaultUnit: 'KG' },
    { id: 'plank', name: 'Plank', category: 'Core', defaultUnit: 'KG' },
  ]

  const [library, setLibrary] = useLocalStorage('gymNote_library', defaultExercises)
  return { library, setLibrary }
}

// Hook untuk workout templates
export function useTemplates() {
  const defaultTemplates = [
    {
      id: 'push-a',
      name: 'Push A',
      emoji: '💪',
      exercises: ['bench-press', 'incline-press', 'overhead-press', 'lateral-raise', 'tricep-pushdown'],
    },
    {
      id: 'pull-b',
      name: 'Pull B',
      emoji: '🏋️',
      exercises: ['deadlift', 'lat-pulldown', 'cable-row', 'bicep-curl', 'face-pull'],
    },
    {
      id: 'leg-c',
      name: 'Leg C',
      emoji: '🦵',
      exercises: ['squat', 'leg-press', 'leg-extension', 'leg-curl', 'calf-raise'],
    },
  ]
  const [templates, setTemplates] = useLocalStorage('gymNote_templates', defaultTemplates)
  return { templates, setTemplates }
}

// Hook untuk user settings
export function useSettings() {
  const [settings, setSettings] = useLocalStorage('gymNote_settings', {
    username: 'Athlete',
    defaultRestSeconds: 90,
  })
  return { settings, setSettings }
}
