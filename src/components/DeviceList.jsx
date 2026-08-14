import { usePlayer } from '../store/PlayerContext'
import { Icon } from './Icon'

const SIGNAL_BARS = [20, 40, 60, 80]

export function DeviceList() {
  const { devices, activeDeviceId, connectedDeviceId, scanning, pairing, selectDevice } = usePlayer()

  return (
    <div className="ml-11 mt-2 mb-4 space-y-3">
      {scanning && (
        <div className="flex items-center justify-between pr-4 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary led-glow" />
            <span className="font-label-caps text-[11px] text-tertiary">SCANNING...</span>
          </div>
        </div>
      )}
      {devices.map((device) => {
        const isActive = activeDeviceId === device.id
        const isConnected = connectedDeviceId === device.id
        return (
          <button
            key={device.id}
            type="button"
            disabled={pairing}
            onClick={() => selectDevice(device.id)}
            className={`w-full flex items-center justify-between pr-4 group cursor-pointer disabled:opacity-50 text-left ${
              isConnected ? '' : 'opacity-80'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-tertiary led-glow' : 'bg-surface-variant'}`} />
              <span
                className={`font-label-caps text-[11px] truncate transition-colors ${
                  isActive ? 'text-tertiary' : 'text-on-surface-variant group-hover:text-tertiary'
                }`}
              >
                {device.name}
              </span>
            </div>
            {isActive && (
              <div className="flex gap-[1px] h-3 items-end shrink-0">
                {SIGNAL_BARS.map((h, i) => (
                  <div key={i} className="w-1 bg-tertiary" style={{ height: `${h}%` }} />
                ))}
                <div className="w-1 bg-surface-variant h-full" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}