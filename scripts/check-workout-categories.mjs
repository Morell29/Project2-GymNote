import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

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
