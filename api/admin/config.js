// Admin config — Vercel serverless function.
// GET  /api/admin/config                    → current overrides
// POST /api/admin/config { playlists, liveStreamId } + `x-admin-token` header
//
// Lets the owner update the built-in device playlists and the radio live
// stream at runtime, without rebuilding/redeploying the app. Overrides are
// stored in the Upstash Redis hash `ipodify:admin` (field per device id +
// `liveStreamId`); the client fetches them at boot and merges them over the
// env-derived defaults.
//
// Writes require the `x-admin-token` header to match the ADMIN_TOKEN env var.
// Without ADMIN_TOKEN configured, writes are rejected (403). Without Upstash
// Redis credentials the endpoint reports { enabled: false } — nothing is
// persisted anywhere (env defaults apply).
//
// Values accept raw IDs or full URLs (playlist list=/p= param, video v=/live=
// path) and are normalized before storing; empty/null values delete an
// override so the env default takes over again.

const KEY = 'ipodify:admin'

function normalize(raw, minLen) {
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

const normalizePlaylist = (v) => normalize(v, 10)
const normalizeVideo = (v) => normalize(v, 11)

function json(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
    return res.status(204).end()
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const hasRedis = Boolean(url && token)
  const auth = hasRedis ? { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' } : null

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'method not allowed' })
  }

  // GET — read the current overrides (public; the player needs them at boot).
  if (req.method === 'GET') {
    if (!hasRedis) {
      return json(res, 200, { enabled: false, playlists: {}, liveStreamId: null })
    }
    try {
      const result = await fetch(`${url}/hgetall/${KEY}`, auth).then((r) => r.json())
      const all = result?.result || {}
      const playlists = {}
      for (const [field, value] of Object.entries(all)) {
        if (field !== 'liveStreamId') playlists[field] = value
      }
      return json(res, 200, {
        enabled: true,
        playlists,
        liveStreamId: all.liveStreamId || null,
      })
    } catch {
      return json(res, 200, { enabled: false, playlists: {}, liveStreamId: null })
    }
  }

  // POST — update overrides (owner-only).
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) {
    return json(res, 403, { error: 'ADMIN DISABLED — SET ADMIN_TOKEN' })
  }
  const provided = String(req.headers['x-admin-token'] || '')
  if (provided !== adminToken) {
    return json(res, 403, { error: 'FORBIDDEN' })
  }
  if (!hasRedis) {
    return json(res, 501, { error: 'NO STORAGE — SET UPSTASH_REDIS_REST_URL/TOKEN' })
  }

  const body = req.body || {}
  const playlists = typeof body.playlists === 'object' && body.playlists ? body.playlists : {}
  const liveStreamRaw = body.liveStreamId

  try {
    for (const [field, value] of Object.entries(playlists)) {
      const id = normalizePlaylist(value)
      const safeField = encodeURIComponent(field)
      if (id) {
        await fetch(`${url}/hset/${KEY}/${safeField}/${encodeURIComponent(id)}`, auth)
      } else {
        await fetch(`${url}/hdel/${KEY}/${safeField}`, auth)
      }
    }
    if (liveStreamRaw !== undefined) {
      const id = normalizeVideo(liveStreamRaw)
      if (id) {
        await fetch(`${url}/hset/${KEY}/liveStreamId/${encodeURIComponent(id)}`, auth)
      } else {
        await fetch(`${url}/hdel/${KEY}/liveStreamId`, auth)
      }
    }
    return json(res, 200, { ok: true })
  } catch {
    return json(res, 500, { error: 'STORAGE_FAILED' })
  }
}