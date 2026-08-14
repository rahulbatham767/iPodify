import { useEffect, useRef } from 'react'

// NOTE: iOS Safari cannot keep hidden iframe audio playing in the background
// no matter what Media Session does. The reliable path is installing the PWA
// (display: standalone) on Android Chrome, which suspends the tab and keeps
// the iframe alive. Mirror this caveat in the UI (see QueueSheet note).
export function useMediaSession({ track, isPlaying, currentTime, duration, onPlay, onPause, onPrev, onNext }) {
  const handlersRef = useRef({ onPlay, onPause, onPrev, onNext })
  handlersRef.current = { onPlay, onPause, onPrev, onNext }

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession

    if (track) {
      ms.metadata = new MediaMetadata({
        title: track.title || 'UNKNOWN',
        artist: track.artist || '',
        album: 'iPodify',
        artwork: track.thumbnail
          ? [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      })
    } else {
      ms.metadata = null
    }

    ms.setActionHandler('play', () => handlersRef.current.onPlay?.())
    ms.setActionHandler('pause', () => handlersRef.current.onPause?.())
    ms.setActionHandler('previoustrack', () => handlersRef.current.onPrev?.())
    ms.setActionHandler('nexttrack', () => handlersRef.current.onNext?.())

    return () => {
      try {
        ms.setActionHandler('play', null)
        ms.setActionHandler('pause', null)
        ms.setActionHandler('previoustrack', null)
        ms.setActionHandler('nexttrack', null)
      } catch {
        // no-op — older browsers throw on null handlers
      }
    }
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!track || !isFinite(duration) || duration <= 0) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      })
    } catch {
      // no-op — setPositionState throws when position exceeds duration
    }
  }, [track, currentTime, duration, isPlaying])
}