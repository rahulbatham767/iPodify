import { usePlayer } from '../store/PlayerContext'
import { useListeners } from '../hooks/useListeners'
import { Icon } from './Icon'

export function Header({ onToggleQueue, onNavigate }) {
  const { connectedDevice, pairing } = usePlayer()
  const { listeners, enabled } = useListeners()

  return (
    <header className="bg-surface-container border-b-2 border-outline-variant bg-surface-dim border-b-2 border-black/50 ring-1 ring-inset ring-white/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.8)] grid grid-cols-[1fr_auto_1fr] items-center w-full px-4 md:px-10 py-2 h-16 fixed top-0 z-50">
      <div className="flex items-center gap-4 min-w-0">
        <img
          alt="iPodify Logo"
          className="h-10 w-10 object-contain rounded-sm hidden sm:block"
          src="/icon.png"
        />
        <h1 className="font-display-tech text-tertiary-fixed tracking-tighter uppercase text-[24px] lcd-text-glow">
          iPodify
        </h1>
      </div>
      {enabled && (
        <div className="hidden sm:flex items-center justify-center px-2">
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-sm border border-outline-variant" title="Listeners currently tuned in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-caps text-label-caps text-tertiary whitespace-nowrap">
              {listeners.toLocaleString()} LISTENING
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-3 md:gap-6">
        <button
          type="button"
          onClick={onToggleQueue}
          className="lg:hidden text-primary hover:text-tertiary transition-colors"
          aria-label="Toggle transmission queue"
        >
          <Icon name="queue_music" />
        </button>
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-sm border border-outline-variant led-glow">
          <div className={`w-2 h-2 rounded-full ${pairing ? 'bg-primary animate-pulse' : 'bg-tertiary animate-pulse'}`} />
          <span className="font-label-caps text-label-caps text-tertiary whitespace-nowrap">
            {pairing ? 'PAIRING...' : connectedDevice ? `CONNECTED: ${connectedDevice.name.toUpperCase()}` : 'NOT CONNECTED'}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-primary">
          <button type="button" className="hover:text-tertiary hover:brightness-125 transition-all active:translate-y-[1px]" aria-label="Bluetooth">
            <Icon name="bluetooth_connected" filled />
          </button>
          <button type="button" onClick={() => onNavigate('settings')} className="hover:text-tertiary hover:brightness-125 transition-all active:translate-y-[1px]" aria-label="Settings">
            <Icon name="settings" filled />
          </button>
        </div>
      </div>
    </header>
  )
}