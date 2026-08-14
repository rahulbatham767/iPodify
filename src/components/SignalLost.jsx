import { usePlayer } from '../store/PlayerContext'
import { Icon } from './Icon'

export function SignalLost() {
  const { error, retry } = usePlayer()

  if (!error) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none p-4">
      <div className="pointer-events-auto glass-panel chrome-bezel rounded-lg p-6 max-w-sm w-full text-center">
        <Icon name="wifi_off" className="text-tertiary text-4xl mb-3 lcd-text-glow" />
        <h3 className="font-display-tech text-tertiary text-[18px] tracking-widest mb-2">SIGNAL LOST</h3>
        <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed mb-5">{error.message}</p>
        <button
          type="button"
          onClick={retry}
          className="chrome-button text-tertiary font-label-caps text-[10px] py-2 px-4 rounded-sm hover:text-white hover:border-tertiary transition-colors"
        >
          RETRY CONNECTION
        </button>
      </div>
    </div>
  )
}