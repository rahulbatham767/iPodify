// Admin overrides — the runtime source of truth for built-in playlist IDs,
// the radio live stream and the YouTube API key. Fetched once at boot from
// the admin endpoint (VITE_ADMIN_URL or /api/admin) and merged over the
// env-derived defaults:
//   { playlists: { deviceId: playlistId }, liveStreamId, apiKeySet }
//
// The API key itself is WRITE-ONLY — the endpoint only reports whether an
// override is set (apiKeySet). When it is, YouTube API calls go through the
// server-side proxy (/api/yt) which injects the key, so it can be changed by
// an admin but never stolen through the app.
//
// A single shared promise means every consumer (device store, player, admin
// view) resolves the same data without duplicate requests. `enabled: false`
// responses (no persistence configured) simply mean "no overrides".

const ENDPOINT = import.meta.env.VITE_ADMIN_URL || '/api/admin'

let cached = null
let inflight = null

function apply(json) {
  cached = {
    enabled: json?.enabled !== false,
    playlists: json?.playlists && typeof json.playlists === 'object' ? json.playlists : {},
    liveStreamId: json?.liveStreamId || null,
    apiKeySet: Boolean(json?.apiKeySet),
  }
  return cached
}

// Resolve the current overrides (cached after the first successful call).
export function fetchAdminConfig() {
  if (!inflight) {
    inflight = fetch(`${ENDPOINT}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => (json ? apply(json) : cached))
      .catch(() => cached)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

// Re-fetch and refresh the shared cache (used by the admin view after save).
export async function refreshAdminConfig() {
  const res = await fetch(`${ENDPOINT}/config`)
  const json = res.ok ? await res.json() : null
  return json ? apply(json) : cached
}

// POST the overrides. `playlists` values, `liveStreamId` and `apiKey` accept
// raw values; empty/null clears an override (env default takes over). The
// API key is write-only — sent here, never returned by the endpoint.
export async function saveAdminConfig({ playlists, liveStreamId, apiKey, token }) {
  const body = {}
  if (playlists !== undefined) body.playlists = playlists
  if (liveStreamId !== undefined) body.liveStreamId = liveStreamId
  if (apiKey !== undefined) body.apiKey = apiKey
  const res = await fetch(`${ENDPOINT}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}