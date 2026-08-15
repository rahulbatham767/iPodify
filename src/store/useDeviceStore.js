import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultDevices } from '../data/devices'
import { extractPlaylistId } from '../lib/youtube'
import { fetchAdminConfig } from '../lib/adminConfig'

// User-paired devices persist to localStorage; built-ins regenerate from env
// each boot (minus any the user forgot), overridden at runtime by the admin
// endpoint config. Never store playlist IDs in code — only in .env (built-ins),
// localStorage (user-added), or the admin endpoint overrides.
const STORAGE_KEY = 'soniclink.devices.v1'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      userDevices: Array.isArray(parsed.userDevices) ? parsed.userDevices : [],
      removedDefaults: Array.isArray(parsed.removedDefaults) ? parsed.removedDefaults : [],
    }
  } catch {
    return null
  }
}

export function useDeviceStore() {
  const [persisted] = useState(loadPersisted)
  const [userDevices, setUserDevices] = useState(persisted?.userDevices || [])
  const [removedDefaults, setRemovedDefaults] = useState(persisted?.removedDefaults || [])
  const [adminPlaylists, setAdminPlaylists] = useState(null)

  useEffect(() => {
    let alive = true
    fetchAdminConfig().then((cfg) => {
      if (alive) setAdminPlaylists(cfg?.playlists || {})
    })
    return () => {
      alive = false
    }
  }, [])

  const devices = useMemo(() => {
    const defaults = defaultDevices
      .filter((d) => !removedDefaults.includes(d.id))
      .map((d) => {
        // Admin endpoint override (runtime, shared) beats the env default.
        const override = adminPlaylists?.[d.id]
        if (!override) return d
        const playlistId = extractPlaylistId(override)
        return playlistId ? { ...d, sourceType: 'playlist', sourceValue: playlistId } : d
      })
    return [...defaults, ...userDevices]
  }, [userDevices, removedDefaults, adminPlaylists])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userDevices, removedDefaults }))
    } catch {
      // storage unavailable — in-memory only
    }
  }, [userDevices, removedDefaults])

  const addDevice = useCallback((device) => {
    setUserDevices((prev) => [...prev, device])
  }, [])

  const removeDevice = useCallback((id) => {
    setUserDevices((prev) => prev.filter((d) => d.id !== id))
    setRemovedDefaults((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  return { devices, addDevice, removeDevice }
}