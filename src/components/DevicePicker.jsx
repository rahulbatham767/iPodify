import { useEffect } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { DeviceList } from './DeviceList'
import { Icon } from './Icon'

// Device picker opened from the header Bluetooth icon — lets mobile users
// (and anyone else) see and select a device without the sidebar.
export function DevicePicker({ open, onClose }) {
  const { scanning, scanDevices } = usePlayer()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative glass-panel chrome-bezel rounded-lg p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="bluetooth_searching" filled className="text-tertiary text-xl lcd-text-glow shrink-0" />
            <h2 className="font-display-tech text-tertiary text-[14px] tracking-widest lcd-text-glow truncate">
              AVAILABLE DEVICES
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close device picker"
            className="text-on-surface-variant hover:text-white transition-colors shrink-0"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          <DeviceList className="ml-0 mt-0 mb-0 space-y-3" onSelect={onClose} />
        </div>
        <button
          type="button"
          disabled={scanning}
          onClick={scanDevices}
          className="mt-3 w-full chrome-button text-tertiary font-label-caps text-[10px] py-2 px-4 rounded-sm hover:text-white hover:border-tertiary transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Icon name="sensors" className="text-[14px]" />
          {scanning ? 'SCANNING...' : 'SCAN DEVICES'}
        </button>
      </div>
    </div>
  )
}