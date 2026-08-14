import { useEffect, useState } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { describeError, extractPlaylistId, getSource, probeSource } from '../lib/youtube'
import { deviceInitials, initialsAvatar } from '../lib/avatar'
import { Icon } from './Icon'

const SOURCE_TYPES = [
  { key: 'playlist', label: 'PLAYLIST URL/ID' },
  { key: 'search', label: 'ARTIST SEARCH' },
]

export function AddDeviceModal({ open, onClose }) {
  const { addDevice } = usePlayer()
  const [name, setName] = useState('')
  const [sourceType, setSourceType] = useState('playlist')
  const [sourceValue, setSourceValue] = useState('')
  const [pairing, setPairing] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanValue = sourceValue.trim()
    if (!cleanName) return setFormError('DEVICE NAME REQUIRED')
    if (!cleanValue) return setFormError('SOURCE REQUIRED')

    let finalValue = cleanValue
    if (sourceType === 'playlist') {
      finalValue = extractPlaylistId(cleanValue)
      if (!finalValue) return setFormError('INVALID PLAYLIST URL/ID')
    }

    setPairing(true)
    setFormError(null)
    try {
      const device = {
        id: `user-${Date.now()}`,
        name: cleanName,
        sourceType,
        sourceValue: finalValue,
        avatarUrl: initialsAvatar(cleanName),
        isUserAdded: true,
        createdAt: Date.now(),
      }
      const ok = await probeSource(getSource(device))
      if (!ok) throw new Error('EMPTY_QUEUE')
      addDevice(device)
      setName('')
      setSourceValue('')
      setSourceType('playlist')
      onClose()
    } catch (err) {
      const { code } = describeError(err)
      setFormError(
        code === 'NO_API_KEY'
          ? 'API KEY MISSING — SET VITE_YOUTUBE_API_KEY IN .env'
          : code === 'QUOTA_EXCEEDED'
            ? 'API QUOTA EXCEEDED — RETRY LATER'
            : 'PAIRING FAILED — CHECK PLAYLIST ID',
      )
    } finally {
      setPairing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={pairing ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative glass-panel chrome-bezel rounded-lg p-6 w-full max-w-md space-y-5"
      >
        <div className="text-center space-y-1">
          <Icon name="bluetooth_searching" filled className="text-tertiary text-3xl lcd-text-glow" />
          <h2 className="font-display-tech text-tertiary text-[16px] tracking-widest lcd-text-glow">
            ADD NEW PLAYLIST SOURCE
          </h2>
          <p className="font-label-caps text-[9px] text-on-surface-variant tracking-widest">
            BLUETOOTH PAIRING SIMULATION
          </p>
        </div>

        <div className="space-y-2">
          <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
            DEVICE / PLAYLIST NAME
          </label>
          <div className="lcd-screen rounded-sm px-3 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full chrome-bezel flex items-center justify-center shrink-0 overflow-hidden">
              <span className="font-label-caps text-[10px] text-tertiary">{deviceInitials(name || '?')}</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SynthWave Pro"
              className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">SOURCE TYPE</label>
          <div className="flex gap-2">
            {SOURCE_TYPES.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSourceType(opt.key)}
                className={`flex-1 chrome-button font-label-caps text-[10px] py-2 px-3 rounded-sm transition-colors ${
                  sourceType === opt.key
                    ? 'text-tertiary border-tertiary lcd-text-glow'
                    : 'text-outline hover:text-on-surface-variant'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-label-caps text-[10px] text-tertiary/70 tracking-widest">
            {sourceType === 'playlist' ? 'PLAYLIST URL OR ID' : 'ARTIST / CHANNEL NAME'}
          </label>
          <div className="lcd-screen rounded-sm px-3 py-2">
            <input
              type="text"
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              placeholder={
                sourceType === 'playlist'
                  ? 'https://youtube.com/playlist?list=PL... or PL...'
                  : 'artist name → searched with "official audio"'
              }
              className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
            />
          </div>
        </div>

        {formError && (
          <p className="font-label-caps text-[10px] text-error tracking-widest text-center">{formError}</p>
        )}

        {pairing && (
          <div className="flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary led-glow" />
            <span className="font-label-caps text-[10px] text-tertiary tracking-widest">PAIRING...</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={pairing}
            className="flex-1 chrome-button font-label-caps text-[10px] py-2 px-4 rounded-sm text-on-surface-variant hover:text-white transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={pairing}
            className="flex-1 chrome-button font-label-caps text-[10px] py-2 px-4 rounded-sm text-tertiary border-tertiary lcd-text-glow hover:text-white transition-colors disabled:opacity-50"
          >
            PAIR DEVICE
          </button>
        </div>
      </form>
    </div>
  )
}