// src/hooks/useStorage.js
// Custom hooks untuk localStorage

import { useState } from 'react'

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

// Hook untuk exercise library — 3 per kategori + custom
export function useExerciseLibrary() {
  const defaultExercises = [
    // === PUSH ===
    { id: 'bench-press',     name: 'Bench Press',     category: 'Push',        defaultUnit: 'KG'  },
    { id: 'overhead-press',  name: 'Overhead Press',  category: 'Push',        defaultUnit: 'KG'  },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Push',        defaultUnit: 'BAR' },

    // === PULL ===
    { id: 'deadlift',        name: 'Deadlift',        category: 'Pull',        defaultUnit: 'KG'  },
    { id: 'lat-pulldown',    name: 'Lat Pulldown',    category: 'Pull',        defaultUnit: 'BAR' },
    { id: 'bicep-curl',      name: 'Bicep Curl',      category: 'Pull',        defaultUnit: 'KG'  },

    // === LEG ===
    { id: 'squat',           name: 'Squat',           category: 'Leg',         defaultUnit: 'KG'  },
    { id: 'leg-press',       name: 'Leg Press',       category: 'Leg',         defaultUnit: 'BAR' },
    { id: 'leg-curl',        name: 'Leg Curl',        category: 'Leg',         defaultUnit: 'BAR' },

    // === BODY WEIGHT ===
    { id: 'push-up',         name: 'Push Up',         category: 'Body Weight', defaultUnit: 'BW'  },
    { id: 'pull-up-bw',      name: 'Pull Up',         category: 'Body Weight', defaultUnit: 'BW'  },
    { id: 'plank',           name: 'Plank',           category: 'Body Weight', defaultUnit: 'SEC' },

    // === OTHERS ===
    { id: 'ab-wheel',        name: 'Ab Wheel',        category: 'Others',      defaultUnit: 'BW'  },
    { id: 'box-jump',        name: 'Box Jump',        category: 'Others',      defaultUnit: 'BW'  },
    { id: 'jump-rope',       name: 'Jump Rope',       category: 'Others',      defaultUnit: 'BW'  },
  ]

  const [library, setLibrary] = useLocalStorage('gymNote_library', defaultExercises)
  return { library, setLibrary }
}

// Hook untuk workout templates
export function useTemplates() {
  const defaultTemplates = [
    { id: 'push-a',  name: 'Push',        emoji: '💪', exercises: ['bench-press', 'overhead-press', 'tricep-pushdown'] },
    { id: 'pull-b',  name: 'Pull',        emoji: '🏋️', exercises: ['deadlift', 'lat-pulldown', 'bicep-curl'] },
    { id: 'leg-c',   name: 'Leg',         emoji: '🦵', exercises: ['squat', 'leg-press', 'leg-curl'] },
    { id: 'bw-d',    name: 'Body Weight', emoji: '🤸', exercises: ['push-up', 'pull-up-bw', 'plank'] },
  ]
  const [templates, setTemplates] = useLocalStorage('gymNote_templates', defaultTemplates)
  return { templates, setTemplates }
}

// Hook untuk catatan kalender { 'YYYY-MM-DD': 'note text' }
export function useCalNotes() {
  const [calNotes, setCalNotes] = useLocalStorage('gymNote_calNotes', {})
  const setNote = (dateKey, text) => {
    setCalNotes(prev => {
      const next = { ...prev }
      if (text.trim()) next[dateKey] = text.trim()
      else delete next[dateKey]
      return next
    })
  }
  return { calNotes, setNote }
}

// Hook untuk user settings
export function useSettings() {
  const [settings, setSettings] = useLocalStorage('gymNote_settings', {
    username: 'Athlete',
    defaultRestSeconds: 90,
    darkMode: false,
  })
  return { settings, setSettings }
}
