import { useEffect, useRef } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { useInfiniteLibrary } from '../hooks/useInfiniteLibrary'
import { describeError } from '../lib/youtube'
import { formatTime } from '../lib/format'
import { Icon } from './Icon'

export function LibraryView() {
  const { devices, currentTrack, playTrackFromLibrary } = usePlayer()
  const lib = useInfiniteLibrary(devices)
  const { filteredTracks, total, hasMore, isLoadingMore, initialLoading, error, loadMore, retry, search, setSearch } = lib

  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || isLoadingMore || error) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore()
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, isLoadingMore, error, loadMore])

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col overflow-y-auto pb-20 md:pb-2 px-1">
      <div className="glass-panel chrome-bezel rounded-lg flex flex-col h-full min-h-0">
        <div className="p-4 border-b border-black bg-surface-container-high/80 backdrop-blur-md space-y-3">
          <h2 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2">
            <Icon name="library_music" className="text-[16px]" />
            LIBRARY — {total} TRACKS
          </h2>
          <div className="lcd-screen rounded-sm flex items-center gap-2 px-3 py-2">
            <Icon name="search" className="text-[14px] text-outline shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="FILTER TITLE / ARTIST / SOURCE"
              className="w-full bg-transparent outline-none font-label-caps text-[11px] text-tertiary placeholder:text-outline"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
          {!devices.length && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-outline">
              <Icon name="bluetooth_disabled" className="text-3xl opacity-40" />
              <p className="font-label-caps text-[10px] tracking-widest">NO DEVICES — PAIR ONE FROM SETTINGS</p>
            </div>
          )}

          {initialLoading && (
            <div className="p-2 space-y-2 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-outline-variant/40 shrink-0" />
                  <div className="flex-1">
                    <div className="h-2 w-2/3 bg-outline-variant/60 mb-1.5" />
                    <div className="h-2 w-1/3 bg-outline-variant/40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!initialLoading && filteredTracks.length === 0 && !isLoadingMore && !error && devices.length > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-outline">
              <Icon name="music_off" className="text-3xl opacity-40" />
              <p className="font-label-caps text-[10px] tracking-widest">
                {search ? 'NO MATCHES FOR FILTER' : 'NO TRANSMISSIONS FOUND'}
              </p>
            </div>
          )}

          {filteredTracks.map((track, index) => {
            const playing = currentTrack?.videoId === track.videoId
            return (
              <button
                key={`${track.sourceDeviceId}-${track.videoId}-${index}`}
                type="button"
                onClick={() => playTrackFromLibrary(track)}
                className={`w-full text-left rounded-sm p-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  playing
                    ? 'bg-primary-container/20 border border-tertiary/50 hover:bg-primary-container/30'
                    : 'bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant'
                }`}
              >
                {track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt=""
                    loading="lazy"
                    className="w-10 h-10 object-cover rounded-sm border border-outline-variant/50 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-sm border border-outline-variant/50 flex items-center justify-center text-outline shrink-0">
                    <Icon name={playing ? 'bluetooth_audio' : 'music_note'} className="text-[16px]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-label-caps text-[11px] truncate ${playing ? 'text-tertiary' : 'text-on-surface'}`}>
                    {track.title}
                  </p>
                  <p className={`font-label-caps text-[9px] truncate ${playing ? 'text-on-surface-variant' : 'text-outline'}`}>
                    {track.artist}
                    {track.year ? ` // ${track.year}` : ''}
                  </p>
                </div>
                <span className="font-label-caps text-[8px] px-1.5 py-0.5 rounded-sm border border-outline-variant/50 text-on-surface-variant shrink-0">
                  VIA {track.sourceDeviceName.toUpperCase()}
                </span>
                <span className="font-label-caps text-[9px] text-outline shrink-0 w-10 text-right">
                  {formatTime(track.duration)}
                </span>
              </button>
            )
          })}

          {/* Sentinel: triggers the next round-robin page fetch */}
          {hasMore && !error && <div ref={sentinelRef} className="h-px" />}

          {error && (
            <div className="p-4 text-center border border-error-container/60 bg-error-container/20 rounded-sm space-y-3">
              <p className="font-label-caps text-[10px] text-on-error-container">{describeError(error).message}</p>
              <button
                type="button"
                onClick={retry}
                className="chrome-button text-tertiary font-label-caps text-[10px] py-1.5 px-4 rounded-sm hover:text-white hover:border-tertiary transition-colors"
              >
                RETRY LOAD
              </button>
            </div>
          )}

          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-3 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-primary led-glow" />
              <span className="font-label-caps text-[10px] text-tertiary tracking-widest">LOADING MORE SIGNAL...</span>
            </div>
          )}

          {!hasMore && !isLoadingMore && total > 0 && !error && (
            <div className="flex items-center justify-center gap-2 py-4 text-outline">
              <span className="font-label-caps text-[10px] tracking-widest">END OF LIBRARY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}