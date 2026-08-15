// YouTube Data API v3 helpers. Always read the key from the environment —
// never hardcode it. Primary key VITE_YOUTUBE_API_KEY; when it's missing or
// exhausted (quota), fall back to VITE_YOUTUBE_API_KEY_2.
const API_KEYS = () =>
  [import.meta.env.VITE_YOUTUBE_API_KEY, import.meta.env.VITE_YOUTUBE_API_KEY_2].filter(
    (k) => Boolean(k) && k !== 'your_key_here',
  )

// When an admin-override API key exists (set write-only via the admin
// console), YouTube calls are routed through the server-side /api/yt proxy,
// which injects the key — so it can be changed but never read back. Without
// an override, calls go straight to Google with the env key (unchanged).
let apiProxyEnabled = false
export function setApiProxyEnabled(on) {
  apiProxyEnabled = Boolean(on)
}

// True when a usable key is set via the env — env beats the admin override
// so updating VITE_YOUTUBE_API_KEY is always reflected (after a restart).
export function envKeyConfigured() {
  return API_KEYS().length > 0
}

// One automatic retry on transient network failures (TypeError). HTTP errors
// and quota responses are not retried.
async function fetchWithRetry(url, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url)
    } catch (e) {
      if (i === attempts - 1) throw e
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
}

function handleStatus(res) {
  if (res.status === 403) {
    throw new Error('QUOTA_EXCEEDED')
  }
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`)
  }
  return res.json()
}

function mapFetchError(e, url) {
  if (e?.message === 'NO_API_KEY' || e?.message === 'QUOTA_EXCEEDED' || e?.message?.startsWith('HTTP_')) {
    throw e
  }
  // Network-level failure (DNS, connection, extension blocking). Attach
  // the raw reason so the SIGNAL LOST panel can show a real diagnostic.
  console.error('[soniclink] YouTube API fetch failed:', url?.href ?? url, e)
  const err = new Error('FETCH_FAILED')
  err.detail = e?.message || 'NETWORK_ERROR'
  throw err
}

async function youtubeApi(path, params) {
  if (apiProxyEnabled) {
    // Server-side key injection. 503 = no override key set → surface as a
    // missing key so the SIGNAL LOST panel guides setup.
    const url = new URL('/api/yt', window.location.origin)
    url.search = new URLSearchParams({ path, ...params })
    return fetchWithRetry(url)
      .then((res) => (res.status === 503 ? Promise.reject(new Error('NO_API_KEY')) : handleStatus(res)))
      .catch((e) => mapFetchError(e, url))
  }
  const keys = API_KEYS()
  if (!keys.length) {
    throw new Error('NO_API_KEY')
  }
  // Try each key in order; 403/quota on one key falls through to the next.
  let lastErr = null
  for (const key of keys) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
    url.search = new URLSearchParams({ key, ...params })
    try {
      return await fetchWithRetry(url).then(handleStatus)
    } catch (e) {
      if (e?.message !== 'QUOTA_EXCEEDED') throw mapFetchError(e, url)
      lastErr = e
    }
  }
  // Every key is exhausted — surface the quota error.
  throw mapFetchError(lastErr || new Error('API_ERROR'), null)
}

export const YT_ERROR_MESSAGES = {
  NO_API_KEY: 'YOUTUBE API KEY MISSING — SET VITE_YOUTUBE_API_KEY IN .env OR CONFIGURE IN ADMIN',
  QUOTA_EXCEEDED: 'YOUTUBE API QUOTA EXCEEDED — RETRY LATER',
  HTTP_403: 'YOUTUBE API QUOTA EXCEEDED — RETRY LATER',
  HTTP_429: 'YOUTUBE API RATE LIMIT HIT — PAUSE AND RETRY',
  HTTP_404: 'PLAYLIST NOT FOUND — CHECK SOURCE ID/URL',
  EMPTY_QUEUE: 'NO TRANSMISSIONS FOUND — CHECK PLAYLIST SOURCE',
  NO_LIVE_SOURCE: 'NO LIVE SOURCE — SET VITE_LIVE_STREAM_ID IN .env OR CONFIGURE IN ADMIN',
  PLAYBACK_BLOCKED: 'ALL VIDEOS BLOCKED BY YOUTUBE — EMBED RESTRICTION',
  FETCH_FAILED: 'COULD NOT REACH YOUTUBE — CHECK CONNECTION',
}

export function describeError(e) {
  const code = e?.message || 'FETCH_FAILED'
  return { code, message: YT_ERROR_MESSAGES[code] || YT_ERROR_MESSAGES.FETCH_FAILED, detail: e?.detail }
}

// ISO-8601 duration "PT1M2S" / "PT2H3M4S" -> seconds
export function parseIsoDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  if (!m) return 0
  return (parseInt(m[1] || 0, 10) * 3600) + (parseInt(m[2] || 0, 10) * 60) + parseInt(m[3] || 0, 10)
}

// Accepts a raw playlist ID (PL...) or a full playlist/watch URL; returns the
// bare playlist ID or null.
export function extractPlaylistId(value) {
  const raw = (value || '').trim()
  if (!raw) return null
  let url = null
  try {
    url = new URL(raw)
  } catch {
    try {
      url = new URL(`https://${raw}`)
    } catch {
      url = null
    }
  }
  if (url) {
    const id = url.searchParams.get('list') || url.searchParams.get('p')
    if (id) return id
  }
  return /^[A-Za-z0-9_-]{10,}$/.test(raw) ? raw : null
}

// Accepts a raw 11-char video ID or a watch/live/youtu.be URL; returns the
// bare video ID or null.
export function extractVideoId(value) {
  const raw = (value || '').trim()
  if (!raw) return null
  let url = null
  try {
    url = new URL(raw)
  } catch {
    try {
      url = new URL(`https://${raw}`)
    } catch {
      url = null
    }
  }
  if (url) {
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      return url.pathname.slice(1).split('/')[0] || null
    }
    const v = url.searchParams.get('v')
    if (v) return v
    if (url.pathname.startsWith('/live/')) {
      return url.pathname.split('/')[2] || null
    }
  }
  return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : null
}

// Title/channel/thumbnail for a single video (used by Radio tuning).
export async function fetchVideoInfo(videoId) {
  const data = await youtubeApi('videos', { part: 'snippet', id: videoId })
  const item = data.items?.[0]
  if (!item) return null
  return {
    videoId,
    title: item.snippet?.title || 'UNKNOWN',
    channel: item.snippet?.channelTitle || 'UNKNOWN',
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
  }
}

// Unified device source descriptor. Devices are either curated playlists or
// `{query} official audio` searches.
export function getSource(device) {
  if (device.sourceType === 'search') {
    return { type: 'search', query: device.sourceValue }
  }
  return { type: 'playlist', playlistId: device.sourceValue }
}

function pickThumbnail(thumbnails) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    null
  )
}

function normalizePlaylistItem(item) {
  return {
    videoId: item.contentDetails.videoId,
    title: item.snippet?.title || 'UNKNOWN',
    artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || 'UNKNOWN',
    year: (item.snippet?.publishedAt || '').slice(0, 4),
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
  }
}

function normalizeSearchItem(item) {
  return {
    videoId: item.id.videoId,
    title: item.snippet?.title || 'UNKNOWN',
    artist: item.snippet?.channelTitle || 'UNKNOWN',
    year: (item.snippet?.publishedAt || '').slice(0, 4),
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
  }
}

// One page of playlist items + the nextPageToken for continued paging.
export async function fetchPlaylistPage(playlistId, pageToken = null, maxResults = 20) {
  const params = { part: 'snippet,contentDetails', playlistId, maxResults }
  if (pageToken) params.pageToken = pageToken
  const data = await youtubeApi('playlistItems', params)
  return {
    items: (data.items || []).filter((item) => item.contentDetails?.videoId).map(normalizePlaylistItem),
    nextPageToken: data.nextPageToken || null,
  }
}

// One page of search results + nextPageToken.
export async function searchPage(query, pageToken = null, maxResults = 20) {
  const params = { part: 'snippet', type: 'video', q: query, maxResults }
  if (pageToken) params.pageToken = pageToken
  const data = await youtubeApi('search', params)
  return {
    items: (data.items || []).filter((item) => item.id?.videoId).map(normalizeSearchItem),
    nextPageToken: data.nextPageToken || null,
  }
}

// First page only (quota-cheap single-page helpers kept for legacy callers).
export async function fetchPlaylistVideos(playlistId) {
  const page = await fetchPlaylistPage(playlistId, null, 50)
  return page.items
}

export async function searchVideos(query) {
  const page = await searchPage(query, null, 20)
  return page.items
}

// Quick existence check used by the pairing modal before saving a device.
export async function probeSource(source) {
  const page =
    source.type === 'playlist'
      ? await fetchPlaylistPage(source.playlistId, null, 1)
      : await searchPage(source.query, null, 1)
  return page.items.length > 0
}

// Batch-fetch durations for a list of videoIds (50 per request).
export async function fetchDurations(videoIds) {
  const durations = {}
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50)
    const data = await youtubeApi('videos', {
      part: 'contentDetails',
      id: chunk.join(','),
    })
    for (const item of data.items || []) {
      durations[item.id] = parseIsoDuration(item.contentDetails?.duration)
    }
  }
  return durations
}

// Build one page of the transmission queue for a device/artist.
// Prefers the curated playlistSource; falls back to a search query.
// Returns { items, nextPageToken } — page through with loadDeviceQueue(device, token).
export async function loadDeviceQueue(device, pageToken = null) {
  const source = getSource(device)
  const page =
    source.type === 'playlist'
      ? await fetchPlaylistPage(source.playlistId, pageToken, 50)
      : await searchPage(source.query, pageToken, 20)

  const durations = await fetchDurations(page.items.map((item) => item.videoId))

  const items = page.items
    .filter((item) => (durations[item.videoId] || 0) > 0)
    .map((item) => ({
      id: item.videoId,
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      year: device.yearOverride || item.year || '',
      thumbnail: item.thumbnail,
      duration: durations[item.videoId] || 0,
    }))

  return { items, nextPageToken: page.nextPageToken || null }
}