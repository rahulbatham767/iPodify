import { useEffect, useRef } from 'react'

function loadIFrameApi() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve()
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev && prev()
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => reject(new Error('IFRAME_API_LOAD_FAILED'))
    document.head.appendChild(script)
  })
}

// Hidden 1x1 IFrame Player for audio-only playback. The host element is a
// fixed, invisible 1px div that the API replaces with the iframe.
export function useYouTubePlayer({ onReady, onPlayerStateChange, onError }) {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const readyRef = useRef(false)
  const handlersRef = useRef({ onReady, onPlayerStateChange, onError })
  handlersRef.current = { onReady, onPlayerStateChange, onError }

  useEffect(() => {
    let cancelled = false
    let player = null
    loadIFrameApi()
      .then(() => {
        if (cancelled || !window.YT || !window.YT.Player) return
        player = new window.YT.Player(hostRef.current, {
          width: 1,
          height: 1,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              readyRef.current = true
              handlersRef.current.onReady?.()
            },
            onStateChange: (e) => handlersRef.current.onPlayerStateChange?.(e.data),
            onError: (e) => handlersRef.current.onError?.(e.data),
          },
        })
        playerRef.current = player
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    hostRef,
    isReady: () => readyRef.current,
    loadAndPlay(videoId) {
      if (!readyRef.current || !playerRef.current) return
      playerRef.current.loadVideoById(videoId)
      playerRef.current.playVideo()
    },
    play() {
      if (readyRef.current) playerRef.current?.playVideo()
    },
    pause() {
      if (readyRef.current) playerRef.current?.pauseVideo()
    },
    seekTo(seconds) {
      if (readyRef.current) playerRef.current?.seekTo(seconds, true)
    },
    getState() {
      return readyRef.current && playerRef.current ? playerRef.current.getPlayerState() : -1
    },
    getCurrentTime() {
      return readyRef.current && playerRef.current ? playerRef.current.getCurrentTime() : 0
    },
    getDuration() {
      return readyRef.current && playerRef.current ? playerRef.current.getDuration() : 0
    },
  }
}