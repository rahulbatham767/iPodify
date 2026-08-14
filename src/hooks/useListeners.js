import { useEffect, useState } from 'react'

// Realtime listener counter: heartbeats this session to the presence
// endpoint every 15s and reports the number of listeners currently online.
// When no presence service is reachable (local dev has no /api route,
// production lacks Upstash Redis credentials) it falls back to counting
// this local session, so the counter always shows something.

const SESSION_KEY = 'ipodify.presence.session'
const INTERVAL_MS = 15000
const ENDPOINT = import.meta.env.VITE_PRESENCE_URL || '/api/presence'

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function useListeners() {
  const [listeners, setListeners] = useState(1)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let alive = true
    let stopped = false
    const id = getSessionId()

    const beat = async () => {
      if (stopped) return
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const json = await res.json()
        if (!alive) return
        if (json.enabled === false) {
          setListeners(1)
          setEnabled(true)
          stopped = true
          return
        }
        setEnabled(true)
        setListeners(Number(json.count) || 0)
      } catch {
        if (alive) {
          setListeners(1)
          setEnabled(true)
          stopped = true
        }
      }
    }

    beat()
    const timer = setInterval(beat, INTERVAL_MS)
    return () => {
      alive = false
      stopped = true
      clearInterval(timer)
    }
  }, [])

  return { listeners, enabled }
}