import { usePlayer } from '../store/PlayerContext'
import { TransmissionQueue } from './TransmissionQueue'
import { Icon } from './Icon'

// Tablet: right-side drawer. Mobile: bottom sheet. Mirrors the inline queue
// column on desktop (lg+).
export function QueueDrawer({ open, onClose }) {
  const { currentTrack, isPlaying, togglePlay } = usePlayer()

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed z-40 lg:hidden transition-transform duration-200 flex flex-col
          md:top-16 md:right-0 md:bottom-0 md:w-80 md:max-h-none
          inset-x-0 bottom-0 h-[75vh]
          ${open ? 'translate-x-0 translate-y-0' : 'md:translate-x-full translate-y-full'}`}
      >
        <div className="flex-1 min-h-0 p-2 md:p-0">
          <TransmissionQueue />
        </div>
        {/* NOTE: iOS Safari limits background iframe audio regardless of Media
            Session — install the PWA on Android Chrome for reliable
            background playback. */}
        <p className="md:hidden mx-3 my-2 font-label-caps text-[8px] text-outline leading-relaxed">
          NOTE: IOS SAFARI LIMITS BACKGROUND AUDIO — INSTALL THE PWA ON ANDROID CHROME FOR RELIABLE BACKGROUND PLAYBACK
        </p>
        <div className="md:hidden m-3 mb-4 glass-panel chrome-bezel rounded-lg p-2 flex items-center gap-3">
          {currentTrack?.thumbnail ? (
            <img src={currentTrack.thumbnail} alt="" className="w-10 h-10 object-cover rounded-sm border border-outline-variant" />
          ) : (
            <div className="w-10 h-10 rounded-sm border border-outline-variant flex items-center justify-center text-outline">
              <Icon name="music_note" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-label-caps text-[10px] text-tertiary truncate">
              {currentTrack?.title?.toUpperCase() || 'NO SIGNAL'}
            </p>
            <p className="font-label-caps text-[8px] text-on-surface-variant truncate">
              {currentTrack?.artist?.toUpperCase() || 'IPODIFY'}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-10 h-10 rounded-full chrome-button flex items-center justify-center text-tertiary led-glow disabled:opacity-40"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled />
          </button>
        </div>
      </div>
    </>
  )
}