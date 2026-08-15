// YouTube API proxy — Vercel serverless function.
// GET /api/yt?path=<v3-path>&<query-params>  → forwarded to Google with the
// admin-override API key injected server-side.
//
// The override key is WRITE-ONLY: the admin console can set/clear it via
// POST /api/admin/config, but no endpoint ever returns it — so someone with
// admin access can change the key but never steal it. When no override key
// is set the proxy answers 503 and the client keeps calling YouTube directly
// with its env key (unchanged behavior).
//
// Requires Upstash Redis (where the override lives). Response status/body are
// passed through unchanged (403 quota, 404 playlist, 429 rate limit, ...).

const KEY = 'ipodify:admin'

function json(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)
  if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
  if (pathname !== '/api/yt') return json(res, 404, { error: 'not found' })

  const path = searchParams.get('path')
  if (!path || !/^[a-z]+$/.test(path)) return json(res, 400, { error: 'bad path' })
  searchParams.delete('path')

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return json(res, 503, { error: 'NO_SERVER_KEY' })

  try {
    const r = await fetch(`${url}/hget/${KEY}/apiKey`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const key = (await r.json())?.result
    if (!key) return json(res, 503, { error: 'NO_SERVER_KEY' })

    const target = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
    target.search = new URLSearchParams({ key, ...Object.fromEntries(searchParams) })
    const upstream = await fetch(target.href, { cache: 'no-store' })
    const body = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').end(body)
  } catch {
    return json(res, 500, { error: 'PROXY_FAILED' })
  }
}