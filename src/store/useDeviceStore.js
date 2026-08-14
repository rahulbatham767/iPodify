import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultDevices } from '../data/devices'

// User-paired devices persist to localStorage; built-ins regenerate from env
// each boot (minus any the user forgot). Never store playlist IDs in code —
// only in .env (built-ins) or localStorage (user-added).
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

  const devices = useMemo(() => {
    const defaults = defaultDevices.filter((d) => !removedDefaults.includes(d.id))
    return [...defaults, ...userDevices]
  }, [userDevices, removedDefaults])

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