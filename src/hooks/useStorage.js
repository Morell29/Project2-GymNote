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
    // === PUSH ===
    { id: 'bench-press',       name: 'Bench Press',       category: 'Push', defaultUnit: 'KG' },
    { id: 'incline-press',     name: 'Incline Press',     category: 'Push', defaultUnit: 'KG' },
    { id: 'decline-press',     name: 'Decline Press',     category: 'Push', defaultUnit: 'KG' },
    { id: 'chest-fly',         name: 'Chest Fly',         category: 'Push', defaultUnit: 'KG' },
    { id: 'overhead-press',    name: 'Overhead Press',    category: 'Push', defaultUnit: 'KG' },
    { id: 'lateral-raise',     name: 'Lateral Raise',     category: 'Push', defaultUnit: 'KG' },
    { id: 'tricep-pushdown',   name: 'Tricep Pushdown',   category: 'Push', defaultUnit: 'BAR' },
    { id: 'skull-crusher',     name: 'Skull Crusher',     category: 'Push', defaultUnit: 'KG' },
    { id: 'cable-chest-fly',   name: 'Cable Chest Fly',   category: 'Push', defaultUnit: 'BAR' },

    // === PULL ===
    { id: 'deadlift',          name: 'Deadlift',          category: 'Pull', defaultUnit: 'KG' },
    { id: 'pull-up',           name: 'Pull Up',           category: 'Pull', defaultUnit: 'KG' },
    { id: 'lat-pulldown',      name: 'Lat Pulldown',      category: 'Pull', defaultUnit: 'BAR' },
    { id: 'cable-row',         name: 'Cable Row',         category: 'Pull', defaultUnit: 'BAR' },
    { id: 'barbell-row',       name: 'Barbell Row',       category: 'Pull', defaultUnit: 'KG' },
    { id: 'bicep-curl',        name: 'Bicep Curl',        category: 'Pull', defaultUnit: 'KG' },
    { id: 'hammer-curl',       name: 'Hammer Curl',       category: 'Pull', defaultUnit: 'KG' },
    { id: 'face-pull',         name: 'Face Pull',         category: 'Pull', defaultUnit: 'BAR' },
    { id: 'shrug',             name: 'Shrug',             category: 'Pull', defaultUnit: 'KG' },

    // === LEG ===
    { id: 'squat',             name: 'Squat',             category: 'Leg',  defaultUnit: 'KG' },
    { id: 'leg-press',         name: 'Leg Press',         category: 'Leg',  defaultUnit: 'BAR' },
    { id: 'leg-extension',     name: 'Leg Extension',     category: 'Leg',  defaultUnit: 'BAR' },
    { id: 'leg-curl',          name: 'Leg Curl',          category: 'Leg',  defaultUnit: 'BAR' },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Leg',  defaultUnit: 'KG' },
    { id: 'calf-raise',        name: 'Calf Raise',        category: 'Leg',  defaultUnit: 'KG' },
    { id: 'hip-thrust',        name: 'Hip Thrust',        category: 'Leg',  defaultUnit: 'KG' },
    { id: 'lunges',            name: 'Lunges',            category: 'Leg',  defaultUnit: 'KG' },

    // === BODY WEIGHT ===
    { id: 'push-up',           name: 'Push Up',           category: 'Body Weight', defaultUnit: 'BW' },
    { id: 'pull-up-bw',        name: 'Pull Up (BW)',      category: 'Body Weight', defaultUnit: 'BW' },
    { id: 'dips',              name: 'Dips',              category: 'Body Weight', defaultUnit: 'BW' },
    { id: 'plank',             name: 'Plank',             category: 'Body Weight', defaultUnit: 'SEC' },
    { id: 'sit-up',            name: 'Sit Up',            category: 'Body Weight', defaultUnit: 'BW' },
    { id: 'burpee',            name: 'Burpee',            category: 'Body Weight', defaultUnit: 'BW' },
    { id: 'mountain-climber',  name: 'Mountain Climber',  category: 'Body Weight', defaultUnit: 'BW' },
  ]

  const [library, setLibrary] = useLocalStorage('gymNote_library', defaultExercises)
  return { library, setLibrary }
}

// Hook untuk workout templates
export function useTemplates() {
  const defaultTemplates = [
    {
      id: 'push-a',
      name: 'Push',
      emoji: '💪',
      exercises: ['bench-press', 'incline-press', 'overhead-press', 'lateral-raise', 'tricep-pushdown'],
    },
    {
      id: 'pull-b',
      name: 'Pull',
      emoji: '🏋️',
      exercises: ['deadlift', 'lat-pulldown', 'cable-row', 'bicep-curl', 'face-pull'],
    },
    {
      id: 'leg-c',
      name: 'Leg',
      emoji: '🦵',
      exercises: ['squat', 'leg-press', 'leg-extension', 'leg-curl', 'calf-raise'],
    },
    {
      id: 'bw-d',
      name: 'Body Weight',
      emoji: '🤸',
      exercises: ['push-up', 'pull-up-bw', 'dips', 'plank', 'sit-up'],
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
