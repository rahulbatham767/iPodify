import { useState } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { useListeners } from '../hooks/useListeners'
import { DevicePicker } from './DevicePicker'
import { Icon } from './Icon'

export function Header({ onToggleQueue, onNavigate }) {
  const { connectedDevice, pairing } = usePlayer()
  const { listeners, enabled } = useListeners()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <header className="bg-surface-container border-b-2 border-outline-variant bg-surface-dim border-b-2 border-black/50 ring-1 ring-inset ring-white/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.8)] grid grid-cols-[1fr_auto_1fr] items-center w-full px-3 md:px-10 py-2 h-14 sm:h-16 fixed top-0 z-50">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="min-w-0">
          {/* Spotify-style lockup: circular badge + bold wordmark */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64" className="w-[150px] sm:w-[220px] h-auto block" role="img" aria-label="iPodify">
            {/* Badge — cyan circle with the three sound arcs (dark bars via evenodd holes) */}
            <path
              fillRule="evenodd"
              d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
              fill="#00dbe9"
              transform="translate(8,8) scale(2)"
            />
            {/* Wordmark — bold rounded grotesque, Spotify style */}
            <text
              x="66"
              y="45"
              font-family="'Space Grotesk', 'Arial', sans-serif"
              font-size="37"
              font-weight="700"
              fill="#e8eaf0"
              letter-spacing="1"
            >
              iPodify
            </text>
          </svg>
        </h1>
      </div>
      {enabled && (
        <div className="flex items-center justify-center px-1 sm:px-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 px-2 sm:px-3 py-1 rounded-sm border border-outline-variant" title="Listeners currently tuned in">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="font-label-caps text-label-caps text-tertiary whitespace-nowrap">
              {listeners.toLocaleString()}
              <span className="hidden sm:inline"> LISTENING</span>
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-6 min-w-0">
        <button
          type="button"
          onClick={onToggleQueue}
          className="lg:hidden text-primary hover:text-tertiary transition-colors shrink-0"
          aria-label="Toggle transmission queue"
        >
          <Icon name="queue_music" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 px-2 sm:px-3 py-1 rounded-sm border border-outline-variant led-glow min-w-0">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${pairing ? 'bg-primary animate-pulse' : 'bg-tertiary animate-pulse'}`} />
          <span className="font-label-caps text-label-caps text-tertiary whitespace-nowrap truncate max-w-[28vw] sm:max-w-none">
            {pairing ? 'PAIRING...' : connectedDevice ? `CONNECTED: ${connectedDevice.name.toUpperCase()}` : 'NOT CONNECTED'}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-primary shrink-0">
          <button type="button" onClick={() => setPickerOpen(true)} className="hover:text-tertiary hover:brightness-125 transition-all active:translate-y-[1px]" aria-label="Select device">
            <Icon name="bluetooth_connected" filled />
          </button>
          <button type="button" onClick={() => onNavigate('settings')} className="hover:text-tertiary hover:brightness-125 transition-all active:translate-y-[1px]" aria-label="Settings">
            <Icon name="settings" filled />
          </button>
        </div>
      </div>
      <DevicePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </header>
  )
}