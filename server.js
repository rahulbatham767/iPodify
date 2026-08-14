// Realtime listener presence — local backend (zero dependencies).
// Same contract as the Vercel serverless function (api/presence.js):
//   POST /api/presence { id } → heartbeat
//   GET  /api/presence        → { count }
//
// Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL/TOKEN are set
// (presence shared across every instance), otherwise an in-memory store.
// Sessions expire 30s after their last heartbeat. Per-session writes are
// atomic, so thousands of concurrent listeners never conflict.

import http from 'node:http'

const PORT = Number(process.env.PORT) || 8787
const WINDOW_MS = 30000
const KEY = 'ipodify:online'

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

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

http
  .createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    const path = new URL(req.url, `http://${req.headers.host}`).pathname
    if (path !== '/api/presence' || (req.method !== 'GET' && req.method !== 'POST')) {
      return json(res, 404, { error: 'not found' })
    }

    const now = Date.now()

    if (req.method === 'POST') {
      let body = ''
      for await (const chunk of req) body += chunk
      let id = ''
      try {
        id = String(JSON.parse(body || '{}').id || '').slice(0, 64)
      } catch {
        /* malformed body → empty id */
      }
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
      `[ipodify] presence backend on http://localhost:${PORT} (${UPSTASH_URL ? 'upstash redis' : 'in-memory'})`,
    )
  })