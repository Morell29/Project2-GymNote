// public/sw.js
// Service Worker untuk GymNote PWA — network-first strategy
// Selalu ambil versi terbaru, fallback ke cache jika offline

const CACHE_NAME = 'gymnote-v4'

// Install: langsung aktifkan
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate: hapus cache lama, langsung claim
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first (selalu coba ambil yang terbaru)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // Untuk navigasi (HTML), selalu network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Untuk asset lain: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
