# iPODIFY

A mid-2000s Bluetooth-radio-styled YouTube music player for the web.

Pair a device (an artist with a curated YouTube playlist), tune the live radio, browse the combined library, and watch the listener count tick up as other people tune in — all inside a "Cyanide Tech" retro interface with an iPod Classic product-photo centerpiece.

Built with React + Vite, wired to real YouTube playback through the official IFrame Player API (audio-only, hidden 1x1 player instance).

## Features

- **Devices** — built-in "devices" are artists backed by curated YouTube playlists (or `{artist} official audio` search fallback). Pair/unpair your own playlist via Settings; pairing probes the source before saving.
- **Library** — every track across all devices, paginated with infinite scroll; tap a row to start playing.
- **Radio** — live-stream channel tuned from a single video ID; live mode never auto-advances.
- **Admin console** — `/#admin` updates the built-in playlists, the radio live stream and the YouTube API key at runtime (no rebuild/redeploy). Server-side overrides are stored in Upstash Redis and merged over the env defaults on every page load; writes are protected by an `ADMIN_TOKEN`. The API key is **write-only** — an admin can replace/clear it but never read it back; when an override is active, YouTube calls are proxied server-side (`/api/yt`) so the key is never exposed to the client. See [Admin console](#admin-console).
- **Queue** — full playlist transmission queue with infinite scroll, exactly one TRANSMITTING row, row-click jumping, auto-advance, and blocked-video self-healing (embed-restricted/removed videos are permanently filtered).
- **Realtime listener count** — centered in the header. Presence heartbeats (15s) are counted atomically server-side, so thousands of concurrent listeners never conflict. See [Architecture](#architecture).
- **PWA** — installable on Android Chrome for reliable background playback (iOS Safari limits background audio for hidden iframes regardless — noted in the UI).
- **Photorealistic iPod scene** — matte white aluminum iPod with glossy black display showing song details, the original circular click wheel (MENU / PREV / NEXT / PLAY + white center button), and classic wired EarPods coiled on the right.

## Tech stack

- React 18 + Vite 6 (Tailwind CSS v4 via `@tailwindcss/vite`)
- YouTube Data API v3 + IFrame Player API
- Node `http` presence backend (zero dependencies) — local dev
- Vercel serverless function + Upstash Redis REST — production presence
- PWA: `manifest.webmanifest`, service worker, `icon.png`

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the presence backend (`server.js`, port 8787) and the Vite dev server (port 5173) together; Vite proxies `/api` → `localhost:8787`. (Run `npm run server` + `vite` in two terminals if you prefer.)

### Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_YOUTUBE_API_KEY` | Yes | YouTube Data API v3 key (https://console.cloud.google.com/apis/credentials, enable "YouTube Data API v3"). Missing → "SIGNAL LOST" panel. |
| `VITE_PLAYLIST_<ID>` | No | Curated playlist per device/artist (raw ID or full URL). Missing → `{artist} official audio` search. |
| `VITE_LIVE_STREAM_ID` | No | Radio live stream video ID. Missing → "STATION OFFLINE". |
| `VITE_PRESENCE_URL` | No | Presence endpoint override. Defaults to `/api/presence`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | No (recommended) | Shared presence store. Set in the Vercel dashboard (and your shell for the local backend). |
| `ADMIN_TOKEN` | No | Server-side (not a `VITE_` var). Enables writes to `/api/admin/config` from the `/#admin` console. |

Never commit real keys — `.env` is gitignored.

## Admin console

Open `/#admin` to update the built-in device playlists, the radio live stream and the YouTube API key at runtime — no rebuild, no redeploy:

- `GET /api/admin/config` — current overrides `{ playlists: { deviceId: playlistId }, liveStreamId, apiKeySet }`. The player fetches this at boot and merges it over the `VITE_PLAYLIST_*` / `VITE_LIVE_STREAM_ID` defaults.
- `POST /api/admin/config` — same shape plus an optional `apiKey`; values accept raw IDs or full URLs, empty values clear an override. Requires the `x-admin-token` header to match the `ADMIN_TOKEN` env var (403 otherwise).
- The API key is **write-only**: `GET` returns only `apiKeySet`, never the key. When an override is set, `src/lib/youtube.js` routes calls through `api/yt.js` (`/api/yt`), which injects the key server-side; with no override the client keeps calling YouTube directly with its env key.

Overrides live in the Upstash Redis hash `ipodify:admin` (shared across all instances). Without `UPSTASH_REDIS_REST_URL`/`TOKEN` the console reports persistence offline and saves are rejected on Vercel; the local `server.js` backend falls back to a per-instance in-memory store, which is enough for local testing.

## Deployment (Vercel)

```bash
npm run build
```

Then import the repo on Vercel (framework preset auto-detected: Vite). Set env vars **in the Vercel project dashboard**:

- `VITE_YOUTUBE_API_KEY` (+ optional `VITE_PLAYLIST_*`, `VITE_LIVE_STREAM_ID`)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — create a free database at https://upstash.com, copy the REST URL + token.
- `ADMIN_TOKEN` (optional) — enables the `/#admin` console writes.

`vercel.json` rewrites all non-`/api` routes to `index.html` (deep links + PWA scope) so the `api/presence` function keeps its route. Missing env → the UI guides setup via "SIGNAL LOST" / "NO LIVE SOURCE" panels.

## Architecture

### Realtime listener presence

- `src/hooks/useListeners.js` — heartbeats this session every 15s (session id in `localStorage` `ipodify.presence.session`) and shows the count in the header's LISTENING pill. Falls back to counting this local session if no endpoint is reachable.
- `api/presence.js` — Vercel serverless: `POST { id }` scores the session into the `ipodify:online` Redis sorted set (score = last heartbeat); `GET` trims members idle >30s and returns `{ count }`. Atomic server-side, zero dependencies.
- `server.js` — identical local backend (Node `http`, in-memory store with 30s TTL, or Upstash REST when configured).

Because each listener owns its own hidden YouTube iframe (no shared mutable state), presence counts are the only shared data — the design scales to 1000+ concurrent listeners without conflicts.

### Admin overrides

- `api/admin/config.js` — Vercel serverless: `GET` returns the overrides from the `ipodify:admin` Redis hash (API key only as an `apiKeySet` flag — write-only); `POST` (auth: `x-admin-token` header == `ADMIN_TOKEN` env) writes them. Values are normalized to bare IDs server-side.
- `api/yt.js` — Vercel serverless YouTube proxy: forwards `/api/yt` calls to Google with the override key injected server-side; 503 when no override exists (client falls back to its env key).
- `server.js` — identical routes locally; falls back to an in-memory overrides map when Redis is absent (per-instance, lost on restart).
- `src/lib/adminConfig.js` — shared boot-time fetch (single cached promise); `useDeviceStore` merges playlist overrides into the built-ins, `PlayerContext` applies the live-stream override and enables proxy mode when an API-key override is set.
- `src/components/AdminView.jsx` — the `/#admin` console UI (hash-routed in `App.jsx`, outside the player shell).

### State & data flow

- All player/device state lives in `PlayerContext` (single store, no Zustand): devices, queue, playback, radio, errors. The hidden YouTube player host lives inside the provider.
- `useInfiniteLibrary` merges per-source pagination; `TransmissionQueue` infinite-scrolls the playlist.
- Blocked videos (embed-restricted/removed) are removed permanently (remembered in a session-level set).
- `code.html` is the original single-file design mockup — the source of truth for layout/styling; the design tokens live in `src/index.css` (`@theme`).

## Project structure

```
api/presence.js          Vercel serverless presence endpoint
api/admin/config.js       Vercel serverless admin endpoint (/#admin overrides)
api/yt.js                  Vercel serverless YouTube proxy (write-only API key)
server.js                Local backend: presence + admin (zero deps, port 8787)
scripts/dev.js           Runs backend + Vite together (npm run dev)
src/
  components/            Header, Sidebar, NowPlayingPanel (iPod photo scene),
                         TransmissionQueue, LibraryView, RadioView, AdminView, ...
  hooks/                 useYouTubePlayer, useInfiniteLibrary, useListeners, useMediaSession
  lib/youtube.js         Data API v3 fetchers, duration parser, error map
  lib/adminConfig.js     Admin override fetcher (shared boot-time cache)
  store/                 PlayerContext (player state), useDeviceStore (persisted devices)
  data/devices.js        Built-in devices (artists)
public/                  PWA: manifest, sw.js, icon.png
```

## Disclaimer

iPodify is a personal demo project. It is not affiliated with, endorsed by, or sponsored by Sony, Apple, YouTube, or Google. All music and content streamed through the player belongs to its respective owners and is played via the official YouTube IFrame Player — nothing is hosted or downloaded by this site. For entertainment and educational purposes only.

© 2026 iPODIFY. All rights reserved.