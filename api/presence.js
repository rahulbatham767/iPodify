// Realtime listener presence — Vercel serverless function.
// POST /api/presence { id }  → heartbeat (registers/refreshes the session)
// GET  /api/presence        → { count }
//
// Backed by Upstash Redis REST (free tier). Each session is a member of a
// sorted set scored by last-heartbeat timestamp; stale members (no heartbeat
// for 30s) are trimmed and only fresh ones count. All operations are atomic
// server-side, so thousands of concurrent listeners never conflict.
// Without UPSTASH_REDIS_REST_URL/TOKEN it degrades to { enabled: false }.

const KEY = 'ipodify:online'
const WINDOW_MS = 30000

async function count(url, auth) {
  const res = await fetch(`${url}/zcard/${KEY}`, auth)
  const json = await res.json()
  return Number(json.result) || 0
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return res.status(200).json({ enabled: false, count: 0 })
  }

  const auth = {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }

  try {
    if (req.method === 'POST') {
      const id = String(req.body?.id || '').slice(0, 64)
      if (!id) return res.status(400).json({ enabled: true, count: 0 })
      await fetch(`${url}/zadd/${KEY}/${Date.now()}/${encodeURIComponent(id)}`, auth)
    }
    await fetch(`${url}/zremrangebyscore/${KEY}/-inf/${Date.now() - WINDOW_MS}`, auth)
    return res.status(200).json({ enabled: true, count: await count(url, auth) })
  } catch {
    return res.status(200).json({ enabled: false, count: 0 })
  }
}