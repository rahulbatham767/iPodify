const CACHE = 'ipodify-v3'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== location.origin) return
  // API calls must always hit the network — the admin config is runtime
  // state and a cached 404 (or stale override) would brick the console.
  if (url.pathname.startsWith('/api/')) return

  // Navigation (the HTML shell): network-first. Returning users must see the
  // newest deployment immediately; the cache is only an offline fallback.
  // Cache-first here is what forced old users to clear their cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match('/index.html')),
        ),
    )
    return
  }

  // Everything else: cache-first, filling the cache with successful
  // responses. Hashed Vite assets are immutable by name, so this never
  // serves stale code once the HTML above is fresh.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        }),
    ),
  )
})