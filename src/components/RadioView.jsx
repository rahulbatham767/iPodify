import { usePlayer } from '../store/PlayerContext'
import { Icon } from './Icon'

export function RadioView() {
  const { radioInfo, playRadio, stopRadio, pairing } = usePlayer()
  const live = Boolean(radioInfo)

  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-0 px-1">
      <div className="glass-panel chrome-bezel rounded-lg p-6 flex flex-col items-center gap-4 text-center">
        <Icon name="settings_input_antenna" filled={live} className="text-4xl text-tertiary lcd-text-glow" />
        <h2 className="font-display-tech text-tertiary text-[18px] tracking-widest lcd-text-glow">RADIO</h2>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live ? 'bg-tertiary led-glow animate-pulse' : 'bg-surface-variant'}`} />
          <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">
            {live ? 'LIVE TRANSMISSION' : pairing ? 'TUNING IN...' : 'STATION OFFLINE'}
          </span>
        </div>

        {radioInfo?.thumbnail && (
          <img
            src={radioInfo.thumbnail}
            alt="Live stream thumbnail"
            className="w-40 h-40 object-cover rounded-sm chrome-bezel p-1"
          />
        )}

        <p className="font-label-caps text-[12px] text-on-surface max-w-full truncate">
          {(radioInfo?.title || 'IPODIFY LIVE').toUpperCase()}
        </p>
        {radioInfo?.channel && (
          <p className="font-label-caps text-[9px] text-outline max-w-full truncate">
            {radioInfo.channel.toUpperCase()} // LIVE
          </p>
        )}

        <button
          type="button"
          disabled={pairing}
          onClick={live ? stopRadio : playRadio}
          className="mt-2 chrome-button font-label-caps text-[11px] py-2.5 px-8 rounded-sm text-tertiary border-tertiary lcd-text-glow hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Icon name={live ? 'stop' : 'play_arrow'} filled />
          {live ? 'STOP TRANSMISSION' : 'TUNE IN'}
        </button>
      </div>
    </div>
  )
}