import { usePlayer } from '../store/PlayerContext'
import { NowPlayingPanel, formatIpodTime } from './NowPlayingPanel'

// Feeds the presentational photorealistic iPod panel from the single
// PlayerContext store: track metadata, elapsed/-remaining, live/radio
// mode, and click-wheel wiring.
export function NowPlayingHost() {
  const {
    currentTrack,
    currentTime,
    duration,
    pairing,
    connectedDevice,
    radioInfo,
    queue,
    currentTrackIndex,
    isPlaying,
    togglePlay,
    next,
    prev,
    stopRadio,
  } = usePlayer()

  const live = Boolean(radioInfo)
  const hasTrack = Boolean(currentTrack) || live
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const remaining = Math.max(0, duration - currentTime)

  const title = pairing
    ? 'Receiving Signal...'
    : live
      ? (radioInfo?.title || 'Live Station')
      : currentTrack?.title || 'No Signal'

  const artist = live
    ? radioInfo?.channel || 'iPodify Radio'
    : currentTrack?.artist || (connectedDevice ? 'Awaiting transmission' : 'Scan devices to begin')

  const album = live
    ? 'iPodify Radio'
    : currentTrack?.year
      ? `Album ${currentTrack.year}`
      : 'iPodify'

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
      <div className="scale-[0.8] sm:scale-90 lg:scale-100 origin-center shrink-0">
        <NowPlayingPanel
          title={title}
          artist={artist}
          album={album}
          currentTime={hasTrack ? formatIpodTime(currentTime) : '0:00'}
          duration={hasTrack ? `-${formatIpodTime(remaining)}` : '-0:00'}
          trackNumber={currentTrackIndex + 1}
          totalTracks={queue.length}
          progress={live ? 100 : pct}
          live={live}
          pairing={pairing}
          isPlaying={isPlaying}
          disabled={!hasTrack}
          onMenu={() => (live ? stopRadio() : isPlaying && togglePlay())}
          onPrev={() => hasTrack && prev()}
          onNext={() => hasTrack && next()}
          onTogglePlay={() => (live ? stopRadio() : hasTrack && togglePlay())}
        />
      </div>
    </div>
  )
}