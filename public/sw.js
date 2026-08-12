// public/sw.js
// Service Worker untuk GymNote PWA
// Mengaktifkan mode offline & membuat app bisa diinstall sebagai native-like app

const CACHE_NAME = 'gymnote-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install: cache aset utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: cache-first untuk aset statis, network-first untuk lainnya
self.addEventListener('fetch', (event) => {
  // Hanya handle request GET
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Cache response yang valid
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      }).catch(() => {
        // Offline fallback ke index.html untuk navigasi
        if (event.request.destination === 'document') {
          return caches.match('/index.html')
        }
      })
    })
  )
})
