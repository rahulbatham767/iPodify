import { useEffect, useState } from 'react'
import { defaultDevices } from '../data/devices'
import { fetchAdminConfig, refreshAdminConfig, saveAdminConfig } from '../lib/adminConfig'
import { Icon } from './Icon'

// Admin console — reached at `/#admin`. Updates the built-in device
// playlists, the radio live stream and the YouTube API key at runtime via
// POST /api/admin/config (x-admin-token header). Overrides persist
// server-side and the player picks them up on the next page load. The API
// key is WRITE-ONLY: it can be replaced or cleared here but is never
// displayed — the endpoint only reports whether an override is active.
export function AdminView() {
  const [config, setConfig] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  const [liveStream, setLiveStream] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [keySaving, setKeySaving] = useState(false)
  const [keyStatus, setKeyStatus] = useState(null)

  useEffect(() => {
    let alive = true
    fetchAdminConfig().then((cfg) => {
      if (!alive) return
      setConfig(cfg)
      setPlaylists(
        Object.fromEntries(
          defaultDevices.map((d) => [
            d.id,
            cfg?.playlists?.[d.id] || (d.envVar ? import.meta.env[d.envVar] || '' : ''),
          ]),
        ),
      )
      setLiveStream(cfg?.liveStreamId || import.meta.env.VITE_LIVE_STREAM_ID || '')
    })
    return () => {
      alive = false
    }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!playlists) return
    setSaving(true)
    setStatus(null)
    try {
      const body = {}
      for (const [id, value] of Object.entries(playlists)) {
        body[id] = value.trim() || null
      }
      const { ok, status: code, json } = await saveAdminConfig({
        playlists: body,
        liveStreamId: liveStream.trim() || null,
        token: token.trim(),
      })
      if (!ok) {
        const text =
          code === 403
            ? json.error === 'ADMIN DISABLED — SET ADMIN_TOKEN'
              ? 'ADMIN DISABLED — SET ADMIN_TOKEN ON THE SERVER'
              : 'FORBIDDEN — WRONG ADMIN TOKEN'
            : json.error === 'NO STORAGE — SET UPSTASH_REDIS_REST_URL/TOKEN'
              ? 'NO STORAGE — SET STORAGE CREDENTIALS ON THE SERVER'
              : `SAVE FAILED (HTTP ${code})`
        setStatus({ ok: false, text })
        return
      }
      setConfig(await refreshAdminConfig())
      setStatus({ ok: true, text: 'SAVED — RELOAD THE PLAYER TO APPLY' })
    } catch {
      setStatus({ ok: false, text: 'COULD NOT REACH ADMIN ENDPOINT' })
    } finally {
      setSaving(false)
    }
  }

  // The API key is write-only: replace or clear it, never read it back.
  const handleKeySave = async (clear) => {
    setKeySaving(true)
    setKeyStatus(null)
    try {
      const { ok, status: code, json } = await saveAdminConfig({
        apiKey: clear ? null : apiKey.trim(),
        token: token.trim(),
      })
      if (!ok) {
        const text =
          code === 400
            ? 'INVALID API KEY'
            : code === 403
              ? json.error === 'ADMIN DISABLED — SET ADMIN_TOKEN'
                ? 'ADMIN DISABLED — SET ADMIN_TOKEN ON THE SERVER'
                : 'FORBIDDEN — WRONG ADMIN TOKEN'
              : json.error === 'NO STORAGE — SET UPSTASH_REDIS_REST_URL/TOKEN'
                ? 'NO STORAGE — SET STORAGE CREDENTIALS ON THE SERVER'
                : `SAVE FAILED (HTTP ${code})`
        setKeyStatus({ ok: false, text })
        return
      }
      setApiKey('')
      setConfig(await refreshAdminConfig())
      setKeyStatus({ ok: true, text: clear ? 'OVERRIDE CLEARED — DEFAULT KEY ACTIVE' : 'API KEY UPDATED — RELOAD TO APPLY' })
    } catch {
      setKeyStatus({ ok: false, text: 'COULD NOT REACH ADMIN ENDPOINT' })
    } finally {
      setKeySaving(false)
    }
  }

  const isLoading = !config

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 scanline-overlay z-10 pointer-events-none" />
      <div className="flex-1 overflow-y-auto z-20 relative">
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h1 className="font-display-tech text-tertiary text-[20px] tracking-widest lcd-text-glow">
                ADMIN CONSOLE
              </h1>
              <p className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">
                RUNTIME OVERRIDES — PLAYLISTS, LIVE STREAM & API KEY
              </p>
            </div>
            <a
              href="#devices"
              className="chrome-button font-label-caps text-[10px] py-2 px-4 rounded-sm text-on-surface-variant hover:text-white transition-colors flex items-center gap-2"
            >
              <Icon name="arrow_back" className="text-[14px]" />
              BACK TO PLAYER
            </a>
          </div>

          <section className="glass-panel chrome-bezel rounded-lg p-5 mb-4">
            <h3 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2 mb-2">
              <Icon name="settings_remote" className="text-[16px] text-tertiary" />
              STATUS
            </h3>
            {isLoading ? (
              <p className="font-label-caps text-[10px] text-outline tracking-widest animate-pulse">
                LOADING CONFIG...
              </p>
            ) : (
              <div className="space-y-1">
                <p className="font-label-caps text-[10px] text-on-surface-variant tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-tertiary led-glow' : 'bg-error'}`} />
                  {config.enabled
                    ? 'SHARED STORAGE ONLINE'
                    : 'PERSISTENCE OFFLINE — OVERRIDES NOT SHARED ACROSS INSTANCES'}
                </p>
                <p className="font-label-caps text-[10px] text-outline tracking-widest">
                  CHANGES TAKE EFFECT AFTER RELOADING THE PLAYER
                </p>
              </div>
            )}
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleKeySave(false)
            }}
            className="glass-panel chrome-bezel rounded-lg p-5 mb-4 space-y-4"
          >
            <h3 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2">
              <Icon name="key" className="text-[16px] text-tertiary" />
              YOUTUBE API KEY — WRITE-ONLY
            </h3>
            <p className="font-label-caps text-[9px] text-outline tracking-widest">
              THE CURRENT KEY IS NEVER SHOWN — YOU CAN ONLY REPLACE OR CLEAR IT
            </p>
            <div className="space-y-2">
              <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
                NEW API KEY <span className="text-outline">(LEAVE EMPTY TO KEEP THE CURRENT ONE)</span>
              </label>
              <div className="lcd-screen rounded-sm px-3 py-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza... (never displayed)"
                  autoComplete="new-password"
                  className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
                />
              </div>
            </div>
            {!isLoading && (
              <p className="font-label-caps text-[10px] tracking-widest flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.apiKeySet ? 'bg-tertiary led-glow' : 'bg-outline'}`} />
                {config.apiKeySet
                  ? 'OVERRIDE ACTIVE — SERVER USES THE ADMIN KEY'
                  : 'NO OVERRIDE — APP USES ITS DEFAULT KEY'}
              </p>
            )}
            {keyStatus && (
              <p
                className={`font-label-caps text-[10px] tracking-widest text-center ${
                  keyStatus.ok ? 'text-tertiary' : 'text-error'
                }`}
              >
                {keyStatus.text}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={keySaving || isLoading}
                className="flex-1 chrome-button font-label-caps text-[10px] py-2 px-4 rounded-sm text-tertiary border-tertiary lcd-text-glow hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {keySaving ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-primary led-glow animate-pulse" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <Icon name="key" className="text-[14px]" />
                    SET NEW KEY
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleKeySave(true)}
                disabled={keySaving || isLoading || !config.apiKeySet}
                className="flex-1 chrome-button font-label-caps text-[10px] py-2 px-4 rounded-sm text-on-surface-variant hover:text-white transition-colors disabled:opacity-50"
              >
                CLEAR OVERRIDE
              </button>
            </div>
          </form>

          <form onSubmit={handleSave} className="glass-panel chrome-bezel rounded-lg p-5 space-y-5">
            <div className="space-y-4">
              {defaultDevices.map((device) => (
                <div key={device.id} className="space-y-2">
                  <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
                    {device.name.toUpperCase()} — PLAYLIST URL/ID
                    <span className="text-outline ml-2">({device.envVar || device.id})</span>
                  </label>
                  <div className="lcd-screen rounded-sm px-3 py-2">
                    <input
                      type="text"
                      value={playlists?.[device.id] || ''}
                      onChange={(e) =>
                        setPlaylists((prev) => ({ ...prev, [device.id]: e.target.value }))
                      }
                      placeholder="PL... or https://youtube.com/playlist?list=..."
                      className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
                    />
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
                  RADIO LIVE STREAM — VIDEO URL/ID
                  <span className="text-outline ml-2">(VITE_LIVE_STREAM_ID)</span>
                </label>
                <div className="lcd-screen rounded-sm px-3 py-2">
                  <input
                    type="text"
                    value={liveStream}
                    onChange={(e) => setLiveStream(e.target.value)}
                    placeholder="https://youtube.com/live/... or 11-char video ID"
                    className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
                ADMIN TOKEN <span className="text-outline">(REQUIRED — X-ADMIN-TOKEN)</span>
              </label>
              <div className="lcd-screen rounded-sm px-3 py-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
                />
              </div>
            </div>

            {status && (
              <p
                className={`font-label-caps text-[10px] tracking-widest text-center ${
                  status.ok ? 'text-tertiary' : 'text-error'
                }`}
              >
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || isLoading}
              className="w-full chrome-button font-label-caps text-[11px] py-3 px-4 rounded-sm text-tertiary border-tertiary lcd-text-glow hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-primary led-glow animate-pulse" />
                  SAVING...
                </>
              ) : (
                <>
                  <Icon name="save" className="text-[14px]" />
                  SAVE OVERRIDES
                </>
              )}
            </button>
            <p className="font-label-caps text-[9px] text-outline tracking-widest text-center">
              EMPTY FIELDS CLEAR THE OVERRIDE — THE DEFAULT TAKES OVER AGAIN
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}