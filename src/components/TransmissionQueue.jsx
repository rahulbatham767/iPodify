import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../store/PlayerContext'
import { Icon } from './Icon'

export function TransmissionQueue() {
  const { queue, currentTrackIndex, pairing, jumpTo, queuePageToken, queueLoading, loadMoreQueue } = usePlayer()
  const sentinelRef = useRef(null)
  const [sentinelVisible, setSentinelVisible] = useState(false)

  // Infinite scroll: when the sentinel row scrolls into view, pull the next
  // playlist/search page into the queue — repeat until the playlist ends.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setSentinelVisible(entry.isIntersecting), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [queue.length])

  useEffect(() => {
    if (sentinelVisible && queuePageToken && !queueLoading) loadMoreQueue()
  }, [sentinelVisible, queuePageToken, queueLoading, loadMoreQueue])

  return (
    <div className="glass-panel chrome-bezel rounded-lg flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-black bg-surface-container-high/80 backdrop-blur-md">
        <h3 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2">
          <Icon name="queue_music" className="text-[16px]" />
          TRANSMISSION QUEUE{queue.length > 0 ? ` (${queue.length})` : ''}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pairing && !queue.length && (
          <div className="p-2 space-y-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-3 flex items-center gap-3">
                <Icon name="music_note" className="text-on-surface-variant opacity-50" />
                <div className="flex-1">
                  <div className="h-2 w-2/3 bg-outline-variant/60 mb-1.5" />
                  <div className="h-2 w-1/3 bg-outline-variant/40" />
                </div>
                <span className="font-label-caps text-[9px] text-tertiary/60">SYNC...</span>
              </div>
            ))}
          </div>
        )}
        {!pairing && !queue.length && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-outline">
            <Icon name="radio" className="text-3xl opacity-40" />
            <p className="font-label-caps text-[10px] tracking-widest">NO TRANSMISSIONS</p>
          </div>
        )}
        {queue.map((track, index) => {
          const transmitting = index === currentTrackIndex
          return (
            <button
              key={`${track.id}-${index}`}
              type="button"
              onClick={() => jumpTo(index)}
              className={`w-full text-left rounded-sm p-3 flex items-center gap-3 cursor-pointer transition-colors [content-visibility:auto] ${
                transmitting
                  ? 'bg-primary-container/20 border border-tertiary/50 hover:bg-primary-container/30'
                  : 'bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant'
              }`}
            >
              <Icon
                name={transmitting ? 'bluetooth_audio' : 'music_note'}
                filled={transmitting}
                className={transmitting ? 'text-tertiary led-glow animate-pulse' : 'text-on-surface-variant'}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-label-caps text-[11px] truncate ${transmitting ? 'text-tertiary' : 'text-on-surface'}`}>
                  {track.title}
                </p>
                <p className={`font-label-caps text-[9px] truncate ${transmitting ? 'text-on-surface-variant' : 'text-outline'}`}>
                  {track.artist}
                </p>
              </div>
              <span
                className={`font-label-caps text-[9px] shrink-0 ${
                  transmitting ? 'text-tertiary lcd-text-glow' : 'text-outline'
                }`}
              >
                {transmitting ? 'TRANSMITTING' : 'WAIT'}
              </span>
            </button>
          )
        })}
        <div ref={sentinelRef} className="py-1">
          {queueLoading && (
            <div className="flex items-center justify-center gap-2 py-3 text-tertiary animate-pulse">
              <Icon name="sensors" className="text-[14px]" />
              <span className="font-label-caps text-[9px] tracking-widest">SYNCING MORE TRANSMISSIONS...</span>
            </div>
          )}
          {!queueLoading && !queuePageToken && queue.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-outline">
              <Icon name="stop_circle" className="text-[14px]" />
              <span className="font-label-caps text-[9px] tracking-widest">END OF TRANSMISSION</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
