# AGENTS.md

## What this repo is

**iPodify** — a mid-2000s Bluetooth-radio-styled YouTube music player. A static design mockup (`code.html`) was ported to a React + Vite app wired to real YouTube playback. Not a git repo.

## Commands

- `npm install` — install deps
- `npm run dev` — starts the presence backend (`server.js`, :8787) + Vite dev server (:5173, `/api` proxied to the backend); same as `npm run server` + `vite` in two terminals
- `npm run server` — presence backend alone
- `npm run build` — production build (verification: must pass)
- No test/lint/typecheck tooling exists; `npm run build` is the only automated check.
- `mobile application/` is a separate Expo (React Native + TypeScript) app — its checks are `npx tsc --noEmit` and `npx expo export --platform android` (see its README).

## File layout

- `code.html` — original single-file Tailwind-CDN mockup; **source of truth for layout/styling**. When in doubt, match it, don't redesign.
- `README.md` — user-facing project readme (features, setup, deployment, architecture); keep in sync with changes.
- `DESIGN.md` — "Cyanide Tech" design system spec (colors, fonts, component styles).
- `src/index.css` — Tailwind v4 `@theme` tokens + custom classes. **The design tokens only exist here and in `code.html` — don't invent new colors/fonts; reuse these.**
- `src/App.jsx` — layout: header, sidebar, 4-views main (devices/library/radio/settings; views stay mounted & hidden so Library cache survives switches), mobile nav/drawer wiring.
- `src/store/PlayerContext.jsx` — all player/device state (`Context`, no Zustand): `devices, connectedDeviceId, activeDeviceId, queue, queuePageToken, queueLoading, currentTrackIndex, isPlaying, currentTime, duration, scanning, pairing, error, radioInfo` + actions (`selectDevice`, `scanDevices`, `togglePlay`, `next`, `prev`, `jumpTo`, `retry`, `playTrackFromLibrary`, `loadMoreQueue`, `playRadio`, `stopRadio`). Owner of the hidden YouTube iframe. Player-side failures (embed-restricted/removed videos) remove the failed track from the queue permanently (videoId remembered in a session `blockedVideoIdsRef` Set, filtered on re-pair/page-load) — broken songs never show in the list again; if every track fails, the queue empties into SIGNAL LOST (`PLAYBACK_BLOCKED`).
- `src/store/useDeviceStore.js` — device list state + `addDevice`/`removeDevice`, persisted to localStorage key `soniclink.devices.v1` (`{ userDevices, removedDefaults }`). Built-ins regenerate from env each boot minus forgotten ones; user-added devices persist.
- `src/data/devices.js` — built-in "devices" = artists; `{ id, name, avatarUrl, sourceType, sourceValue, yearOverride, isUserAdded }`. `sourceType`: `"playlist"` (env var `VITE_PLAYLIST_<ID>` resolved via `extractPlaylistId`, accepts URL or raw ID) or `"search"` (`{name} official audio` fallback when env var unset). **Never hardcode playlist IDs in source** — env or localStorage only.
- `src/lib/youtube.js` — Data API v3 fetchers (paginated `fetchPlaylistPage`/`searchPage` with `nextPageToken`, `probeSource` for pairing validation, `extractPlaylistId`, `extractVideoId`, `getSource`, `loadDeviceQueue` (one page → `{ items, nextPageToken }`), `fetchVideoInfo`) + ISO-8601 duration parser + `describeError` error map.
- `src/hooks/useYouTubePlayer.js` — loads `iframe_api` script, manages hidden 1x1 `YT.Player`. `useYouTubePlayer.js` host element lives in `PlayerContext` (`youtube-player-host` CSS class).
- `src/hooks/useInfiniteLibrary.js` — merged Library pagination: per-source page tokens, round-robin `loadMore`, single in-flight request, IntersectionObserver sentinel consumed by `LibraryView`.
- `src/hooks/useMediaSession.js` — lock-screen metadata/actions/positionState + iOS limitation comment.
- `vercel.json` — Vercel config: SPA rewrite to `index.html` (deep links + PWA scope), `/api/*` excluded so the presence function keeps its route. Deployable as-is: run `npm run build`, import the repo on Vercel (framework preset auto-detected: Vite), then set env vars **in the Vercel project dashboard** (`VITE_YOUTUBE_API_KEY`, `VITE_PLAYLIST_*`, `VITE_LIVE_STREAM_ID`, plus presence: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). `.env` is gitignored and never deployed; missing env → "SIGNAL LOST" / "NO LIVE SOURCE" panels guide setup.
- `api/presence.js` — Vercel serverless presence endpoint: `POST { id }` heartbeats a session into a Redis sorted set (`ipodify:online`, score = last-heartbeat ms), `GET` returns `{ count }` after trimming members idle >30s. All ops are atomic server-side (Upstash Redis REST, zero deps) so 1000+ concurrent listeners never conflict; without `UPSTASH_REDIS_REST_URL`/`TOKEN` it returns `{ enabled: false, count: 0 }`.
- `server.js` — local presence backend (zero deps, Node http): identical contract to `api/presence.js`; uses Upstash Redis REST when `UPSTASH_REDIS_REST_URL`/`TOKEN` are set, otherwise an in-memory map with 30s TTL. Port `8787` (override `PORT`). `scripts/dev.js` (`npm run dev`) launches it alongside Vite, which proxies `/api` → `localhost:8787` (`vite.config.js`).
- `src/hooks/useListeners.js` — client presence: POSTs a heartbeat every 15s (session id persisted in `localStorage` `ipodify.presence.session`, endpoint `VITE_PRESENCE_URL` or `/api/presence`), exposes `{ listeners, enabled }`. Without a reachable presence service (dev has no `/api` route) it falls back to counting this local session, so the counter always shows. The LISTENING pill in `Header.jsx` renders it, centered in the header. Playback itself is per-user (hidden iframe, no shared mutable state), so listener counts are the only shared data and scale by design.
- `src/components/InfoView.jsx` — "SUPPORT & INFO" view (`info` nav item, sidebar + mobile): about, how-to, support, **disclaimer** (demo project, content owned by its creators, streamed via official IFrame Player only) and **copyright** (© 2026 iPODIFY). Sidebar footer shows the same copyright line. Dead `<a href="#">` links removed.
- Public/queue details: `TransmissionQueue` infinite-scrolls the full playlist (IntersectionObserver sentinel + `loadMoreQueue` in `PlayerContext` paginating via `queuePageToken`; "END OF TRANSMISSION" when the playlist is exhausted; `content-visibility:auto` rows). Built-in devices have no FORGET button — only `isUserAdded` devices can be removed. Header settings icon navigates to the settings view like the sidebar item; the header Bluetooth icon opens `DevicePicker` (reuses `DeviceList` + scan button — the mobile way to pick a device, since the sidebar is hidden below `md`).
- `public/` — PWA: `manifest.webmanifest`, `sw.js`, `icon.svg`. SW registers only in `PROD` (don't change that; dev caching breaks iteration).
- `.env.example` — copy to `.env`, set `VITE_YOUTUBE_API_KEY` + optional `VITE_PLAYLIST_*` playlist IDs + `VITE_LIVE_STREAM_ID` (radio). **Never hardcode the key or IDs.** Missing key → "SIGNAL LOST" panel with `NO_API_KEY` message. `.env` is gitignored.
- `mobile application/` — Expo (React Native + TypeScript) port of the app for iOS/Android. Same design tokens (`src/theme.ts`), same player model (`src/store/PlayerContext.tsx`), hidden 1x1 `react-native-youtube-iframe` host driven via `src/lib/playerHost.ts` bridge. Env: `EXPO_PUBLIC_YOUTUBE_API_KEY`, `EXPO_PUBLIC_PLAYLIST_*`, `EXPO_PUBLIC_LIVE_STREAM_ID` (in `.env`, see `.env.example`). Bottom-tab shell in `App.tsx`, five screens in `src/screens/`. Custom devices persist via AsyncStorage (`ipodify.mobile.devices.v1`).
- `.opencode/` — ignore (tooling state).

## Design system (must match exactly)

- Dark theme (`darkMode: class` equivalent; `#10141a` background), `tertiary #00dbe9` is the LED/glow cyan, `primary-container #3d90ff` active bars, `on-surface #dfe2eb` text.
- Fonts (Google Fonts in `index.html`): **Space Mono** for all data/LCD/label text (uppercase mono labels, often with cyan glow), **Space Grotesk** headlines, **Hanken Grotesk** body.
- Custom classes in `index.css`: `.chrome-bezel` (2px inset chrome + black stroke), `.chrome-button` (extruded tactile), `.led-glow` (cyan bloom), `.lcd-screen` (dark inset LCD), `.glass-panel` (blur), `.scanline-overlay`, `.lcd-text-glow`, themed scrollbar. Reproduce from `code.html`, don't improve.
- Background: WebGL radar-pulse shader (`BackgroundShader.jsx`, ported from the `STITCH_SHADER_START/END` block in `code.html`) + scanline overlay — both are part of the aesthetic.
- `src/components/NowPlayingPanel.jsx` — **intentional exception to the dark theme**: photorealistic product-photo scene with a transparent background (the app's dark theme shows through — no fabric panel). Matte white aluminum iPod body (taller/slimmer with softer corners, straight/level) with a glossy black display (thin black bezel) showing the song details: header (play icon / "Now Playing" or "Live Station" / battery), `X of Y` count ("LIVE FEED" / "CONNECTING"), LCD-truncated title/artist/album, progress bar with elapsed/negative remaining (minutes unpadded via `formatIpodTime`), all light-on-black. The original circular black click wheel (MENU top / PREV left / NEXT right / PLAY bottom + white pressed center button; PREV/NEXT skip, MENU stops radio or pauses music, PLAY shows play/pause/stop-square by state, all disabled until something plays) and a 3.5mm jack at the bottom center with classic white wired EarPods plugged in — the long cable drops to the surface and wraps into loose coils on the right, with the Y-split rising to both buds. Presentational and prop-driven (`title, artist, album, currentTime, duration, trackNumber, totalTracks, progress` + `live/pairing/isPlaying/disabled/onMenu/onPrev/onNext/onTogglePlay`; `formatIpodTime` export). `NowPlayingHost.jsx` feeds it from `PlayerContext` (radio mode → center button and PLAY act as STOP).

## Behavior contract (hard requirements)

- YouTube: IFrame Player API as hidden/1x1 instance, **audio-only**. Prefer `playlistSource` (quota conservation); search `{artist} official audio` only when playlist ID missing.
- UI copy is exact and dated on purpose: "CONNECTED: [DEVICE]" pill (top header + sidebar), "SCANNING..." in device list, "PAIRING..." in pill, "SIGNAL LOST" error panel with retry, "TRANSMITTING"/"WAIT" queue tags, LCD title truncation, "ARTIST // YEAR" subtitle, elapsed / **negative** remaining time (`02:14` / `-01:46`).
- Queue must always have exactly one TRANSMITTING row; statuses shift as playback advances. Row click jumps to track. Auto-advance on video end; prev restarts track if >3s in.
- State must live in `PlayerContext` — components consume it via `usePlayer()`; don't add prop-drilling or a second store.
- Background playback: Media Session handlers + positionState; PWA required for reliable Android background audio; **iOS Safari cannot background hidden iframes regardless** — keep the note in UI (QueueDrawer) and code comment (useMediaSession).
- Responsive: desktop 3 columns; tablet (`md`) queue = right drawer; mobile (`<md`) = bottom nav + bottom-sheet queue + mini-player; the sheet/mini-player live in `QueueDrawer.jsx`.
- Views: nav items (sidebar + mobile bottom nav) switch an App-level `view` state ('devices'|'library'|'radio'|'info'|'settings'). Settings → `ManageDevicesPanel` + `AddDeviceModal` (pairing probes the source via `probeSource` before saving). Library rows carry `sourceDeviceId` and play via `playTrackFromLibrary` (loads that device's queue, starts at clicked track, switches device context). Radio → `RadioView` tunes the player to a live stream from `VITE_LIVE_STREAM_ID` (`playRadio`/`stopRadio`; radio mode clears the queue — live never auto-advances; re-pair a device to leave it).

## Gotchas

- Don't "improve" the design when fixing logic — dated is intentional (LCD truncation, all-caps, glow).
- YouTube iframe autoplay depends on a user gesture; device selection/play clicks supply it. If playback seems dead in dev, check the console for quota/API errors first.
- The hidden player must exist inside `PlayerProvider` (it renders the host div) — moving it breaks playback.
- `fetchDurations` batches 50 video IDs per `videos` call; queue items with no duration are filtered out (avoid clutter from live streams).
