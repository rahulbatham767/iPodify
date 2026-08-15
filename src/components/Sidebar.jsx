import { usePlayer } from '../store/PlayerContext'
import { DeviceList } from './DeviceList'
import { Icon } from './Icon'

const NAV = [
  { key: 'library', icon: 'library_music', label: 'Library' },
  { key: 'devices', icon: 'bluetooth', label: 'Devices' },
  { key: 'radio', icon: 'settings_input_antenna', label: 'Radio' },
  { key: 'info', icon: 'help', label: 'Info' },
  { key: 'settings', icon: 'tune', label: 'Settings' },
]

export function Sidebar({ activeView, onNavigate }) {
  const { connectedDevice, scanning, scanDevices } = usePlayer()

  return (
    <nav className="hidden md:flex bg-surface-container-low border-r-2 border-outline-variant w-64 h-full flex-col bg-gradient-to-r from-surface-container-low to-surface-container border-r border-black shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)] shrink-0">
      <div className="p-6 border-b border-outline-variant/30 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full chrome-bezel flex items-center justify-center mb-3 overflow-hidden">
          <img src="/icon.png" alt="iPodify Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="font-label-caps text-label-caps text-tertiary mb-1">
          {connectedDevice ? connectedDevice.name.toUpperCase() : 'BT-AUD-75'}
        </h2>
        <p className="font-label-caps text-[10px] text-on-surface-variant">
          {connectedDevice ? `CONNECTED: ${connectedDevice.name.toUpperCase()}` : 'NO DEVICE PAIRED'}
        </p>
        <button
          type="button"
          disabled={scanning}
          onClick={scanDevices}
          className="mt-4 w-full chrome-button text-tertiary font-label-caps text-[10px] py-2 px-4 rounded-sm hover:text-white hover:border-tertiary transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Icon name="sensors" className="text-[14px]" />
          {scanning ? 'SCANNING...' : 'SCAN DEVICES'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = activeView === item.key
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={`w-full px-4 py-2 flex items-center gap-3 transition-colors duration-200 active:scale-[0.98] ${active
                    ? 'bg-primary-container/40 text-on-primary-container border-l-4 border-tertiary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest border-l-4 border-transparent'
                    }`}
                >
                  <Icon name={item.icon} filled={active} />
                  <span
                    className={`font-label-caps text-label-caps ${active ? 'text-tertiary-fixed drop-shadow-[0_0_8px_rgba(0,219,233,0.6)]' : ''
                      }`}
                  >
                    {item.label}
                  </span>
                </button>
                {item.key === 'devices' && <DeviceList />}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="mt-auto border-t border-outline-variant/30 py-2">
        <p className="px-4 py-2 font-label-caps text-[8px] text-outline tracking-widest">
          © 2026 iPODIFY
        </p>
      </div>
    </nav>
  )
}