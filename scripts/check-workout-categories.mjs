import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getWorkoutDays, parseWorkoutDate } from '../src/utils/workoutUtils.js'

const previousTZ = process.env.TZ
try {
  for (const timezone of ['Asia/Jakarta', 'America/Los_Angeles']) {
    process.env.TZ = timezone
    for (const value of ['2024-02-29', '2025-12-31', '2026-01-01', '2026-03-08']) {
      const date = parseWorkoutDate(value)
      assert.ok(date instanceof Date)
      assert.ok(getWorkoutDays([{ date: date.toISOString() }]).has(value), `${timezone}: ${value}`)
    }
    for (const value of ['', 'invalid', '2025-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '0000-01-01']) {
      assert.equal(parseWorkoutDate(value), null, value)
    }
  }
} finally {
  if (previousTZ === undefined) delete process.env.TZ
  else process.env.TZ = previousTZ
}

const categories = ['Push', 'Pull', 'Leg', 'Body Weight', 'Others']
const push = Array.from({ length: 15 }, (_, i) => ({
  id: `push-${i + 1}`, name: `Push exercise ${i + 1}`, category: 'Push', defaultUnit: 'KG',
}))
const pull = { id: 'pull-1', name: 'Pull-only exercise', category: 'Pull', defaultUnit: 'KG' }
const storage = new Map([
  ['gymNote_library', JSON.stringify([...push, pull])],
  ['gymNote_workouts', '[]'],
])
const previousWindow = globalThis.window
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  globalThis.window = { localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  } }
  const { default: QuickLogModal } = await server.ssrLoadModule('/src/components/QuickLogModal.jsx')
  const calendar = renderToStaticMarkup(h(QuickLogModal))
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  assert.ok(!calendar.includes('type="date"'))
  assert.ok(calendar.includes('aria-label="Bulan sebelumnya"'))
  assert.ok(calendar.includes('aria-label="Bulan berikutnya"'))
  assert.equal((calendar.match(/aria-pressed=/g) ?? []).length, daysInMonth)
  assert.equal((calendar.match(/aria-pressed="true"/g) ?? []).length, 1)
  assert.equal((calendar.match(/aria-current="date"/g) ?? []).length, 1)

  const { default: WorkoutLogger } = await server.ssrLoadModule('/src/pages/WorkoutLogger.jsx')
  const render = path => renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] },
    h(Routes, null,
      h(Route, { path: '/workout', element: h(WorkoutLogger) }),
      h(Route, { path: '/workout/:category', element: h(WorkoutLogger) }),
    ),
  ))
  const index = render('/workout')
  assert.equal((index.match(/<a\b/g) ?? []).length, 5)
  for (const category of categories) {
    const slug = category.toLowerCase().replace(/\s/g, '-')
    assert.ok(index.includes(`href="/workout/${slug}"`), `${category} link missing`)
  }
  assert.ok(!index.includes('exercise-row-item'))
  for (const exercise of [...push, pull]) assert.ok(!index.includes(exercise.name))

  for (const category of categories) {
    const slug = category.toLowerCase().replace(/\s/g, '-')
    const html = render(`/workout/${slug}`)
    const expected = [...push, pull].filter(exercise => exercise.category === category)
    assert.match(html, new RegExp(`<h1\\b[^>]*>${category}<`))
    assert.ok(html.includes(`>${expected.length} gerakan tersimpan</p>`), `${category} count wrong`)
    assert.match(html, /<a\b[^>]*href="\/workout"[^>]*>.*?Semua kategori<\/a>/)
    assert.ok(!html.includes('exercise-list-enter'))
    assert.equal((html.match(/class="exercise-row-item"/g) ?? []).length, expected.length)
    for (const exercise of [...push, pull]) {
      assert.equal(html.includes(`>${exercise.name}</div>`), exercise.category === category, exercise.name)
    }
    assert.equal(html.includes('Belum ada gerakan'), expected.length === 0, `${category} empty state wrong`)
  }
  console.log('PASS: workout category SSR regression check')
} finally {
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
  await server.close()
}
