// Local backend (zero dependencies) — same contract as the Vercel
// serverless functions:
//   POST /api/presence { id }  → heartbeat
//   GET  /api/presence         → { count }
//   GET  /api/admin/config     → runtime overrides
//   POST /api/admin/config     → update overrides (x-admin-token header)
//
// Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL/TOKEN are set
// (presence shared across every instance, admin overrides shared too),
// otherwise in-memory stores. Sessions expire 30s after their last
// heartbeat. Per-session writes are atomic, so thousands of concurrent
// listeners never conflict. Admin writes require the ADMIN_TOKEN env var.

import http from 'node:http'

const PORT = Number(process.env.PORT) || 8787
const WINDOW_MS = 30000
const KEY = 'ipodify:online'
const ADMIN_KEY = 'ipodify:admin'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const sessions = new Map() // sessionId -> last heartbeat ms

async function redisCount() {
  const res = await fetch(`${UPSTASH_URL}/zcard/${KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: 'no-store',
  })
  const json = await res.json()
  return Number(json.result) || 0
}

async function trimRedis(now) {
  await fetch(`${UPSTASH_URL}/zremrangebyscore/${KEY}/-inf/${now - WINDOW_MS}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: 'no-store',
  })
}

function memoryCount(now) {
  for (const [id, last] of sessions) {
    if (now - last > WINDOW_MS) sessions.delete(id)
  }
  return sessions.size
}

// Admin overrides: { playlists: { deviceId: playlistId }, liveStreamId }.
const adminOverrides = { playlists: {}, liveStreamId: null }

async function redisAdminGet() {
  const res = await fetch(`${UPSTASH_URL}/hgetall/${ADMIN_KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: 'no-store',
  })
  const json = await res.json()
  const all = json?.result || {}
  const playlists = {}
  for (const [field, value] of Object.entries(all)) {
    if (field !== 'liveStreamId') playlists[field] = value
  }
  return { playlists, liveStreamId: all.liveStreamId || null }
}

// Accepts a raw ID (playlist ≥10 chars, video 11 chars) or a full URL
// (list=/p=/v= params, /live/ path); returns the bare ID or null.
function normalizeId(raw, minLen) {
  const value = String(raw || '').trim()
  if (!value) return null
  let url = null
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`)
  } catch {
    url = null
  }
  if (url) {
    const id = url.searchParams.get('list') || url.searchParams.get('p') || url.searchParams.get('v')
    if (id) return id
    if (url.pathname.startsWith('/live/')) {
      const live = url.pathname.split('/')[2]
      if (live) return live
    }
  }
  return new RegExp(`^[A-Za-z0-9_-]{${minLen},}$`).test(value) ? value : null
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function handleAdmin(req, res, body) {
  const hasRedis = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

  if (req.method === 'GET') {
    if (!hasRedis) {
      return json(res, 200, {
        enabled: false,
        playlists: adminOverrides.playlists,
        liveStreamId: adminOverrides.liveStreamId,
      })
    }
    try {
      const { playlists, liveStreamId } = await redisAdminGet()
      return json(res, 200, { enabled: true, playlists, liveStreamId })
    } catch {
      return json(res, 200, {
        enabled: false,
        playlists: adminOverrides.playlists,
        liveStreamId: adminOverrides.liveStreamId,
      })
    }
  }

  // POST — owner-only writes.
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) {
    return json(res, 403, { error: 'ADMIN DISABLED — SET ADMIN_TOKEN' })
  }
  if (String(req.headers['x-admin-token'] || '') !== adminToken) {
    return json(res, 403, { error: 'FORBIDDEN' })
  }

  const playlists = typeof body?.playlists === 'object' && body.playlists ? body.playlists : {}
  const liveStreamRaw = body?.liveStreamId

  if (!hasRedis) {
    // In-memory fallback (per-instance; lost on restart). Keeps local dev
    // usable without Upstash — on Vercel this path is never hit (api/admin.js
    // rejects writes without storage).
    for (const [field, value] of Object.entries(playlists)) {
      const id = normalizeId(value, 10)
      if (id) adminOverrides.playlists[field] = id
      else delete adminOverrides.playlists[field]
    }
    if (liveStreamRaw !== undefined) {
      adminOverrides.liveStreamId = normalizeId(liveStreamRaw, 11) || null
    }
    return json(res, 200, { ok: true, persistent: false })
  }

  try {
    for (const [field, value] of Object.entries(playlists)) {
      const id = normalizeId(value, 10)
      const safeField = encodeURIComponent(field)
      if (id) {
        await fetch(`${UPSTASH_URL}/hset/${ADMIN_KEY}/${safeField}/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        })
      } else {
        await fetch(`${UPSTASH_URL}/hdel/${ADMIN_KEY}/${safeField}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        })
      }
    }
    if (liveStreamRaw !== undefined) {
      const id = normalizeId(liveStreamRaw, 11)
      if (id) {
        await fetch(`${UPSTASH_URL}/hset/${ADMIN_KEY}/liveStreamId/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        })
      } else {
        await fetch(`${UPSTASH_URL}/hdel/${ADMIN_KEY}/liveStreamId`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        })
      }
    }
    return json(res, 200, { ok: true, persistent: true })
  } catch {
    return json(res, 500, { error: 'STORAGE_FAILED' })
  }
}

async function readBody(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  try {
    return JSON.parse(body || '{}')
  } catch {
    return {}
  }
}

http
  .createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    const path = new URL(req.url, `http://${req.headers.host}`).pathname
    if (path === '/api/admin/config') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return json(res, 405, { error: 'method not allowed' })
      }
      return handleAdmin(req, res, await readBody(req))
    }
    if (path !== '/api/presence' || (req.method !== 'GET' && req.method !== 'POST')) {
      return json(res, 404, { error: 'not found' })
    }

    const now = Date.now()

    if (req.method === 'POST') {
      const body = await readBody(req)
      const id = String(body.id || '').slice(0, 64)
      if (!id) return json(res, 400, { enabled: true, count: 0 })

      if (UPSTASH_URL && UPSTASH_TOKEN) {
        try {
          await fetch(`${UPSTASH_URL}/zadd/${KEY}/${now}/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
            cache: 'no-store',
          })
          await trimRedis(now)
          return json(res, 200, { enabled: true, count: await redisCount() })
        } catch {
          /* fall through to in-memory */
        }
      }
      sessions.set(id, now)
      return json(res, 200, { enabled: true, count: memoryCount(now) })
    }

    // GET
    if (UPSTASH_URL && UPSTASH_TOKEN) {
      try {
        await trimRedis(now)
        return json(res, 200, { enabled: true, count: await redisCount() })
      } catch {
        /* fall through to in-memory */
      }
    }
    return json(res, 200, { enabled: true, count: memoryCount(now) })
  })
  .listen(PORT, () => {
    console.log(
      `[ipodify] backend on http://localhost:${PORT} (${UPSTASH_URL ? 'upstash redis' : 'in-memory'})`,
    )
  })