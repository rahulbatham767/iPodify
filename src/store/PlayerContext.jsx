import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadDeviceQueue, describeError, extractVideoId, fetchVideoInfo } from '../lib/youtube'
import { useYouTubePlayer } from '../hooks/useYouTubePlayer'
import { useMediaSession } from '../hooks/useMediaSession'
import { useDeviceStore } from './useDeviceStore'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const deviceStore = useDeviceStore()
  const { devices, addDevice, removeDevice } = deviceStore

  const [activeDeviceId, setActiveDeviceId] = useState(null)
  const [connectedDeviceId, setConnectedDeviceId] = useState(null)
  const [queue, setQueue] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  // Paging: the queue grows as the user scrolls. nextPageToken is null when
  // the playlist/search is exhausted; queueLoading guards duplicate fetches.
  const [queuePageToken, setQueuePageToken] = useState(null)
  const [queueLoading, setQueueLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [pairing, setPairing] = useState(false)
  const [error, setError] = useState(null)
  const [playerReady, setPlayerReady] = useState(false)
  // Radio live-stream mode: when set, the player is tuned to a live video
  // instead of a device queue. Live streams never end, so auto-advance must
  // not run — queue is cleared on tune-in and restored by re-pairing.
  const liveVideoIdRef = useRef(extractVideoId(import.meta.env.VITE_LIVE_STREAM_ID))
  const [radioInfo, setRadioInfo] = useState(null)

  const currentTrack = queue[currentTrackIndex] || null

  const player = useYouTubePlayer({
    onReady: () => setPlayerReady(true),
    onPlayerStateChange: (state) => {
      if (state === 1) {
        setIsPlaying(true)
      } else if (state === 2 || state === 0) {
        setIsPlaying(false)
      }
      // Auto-advance only on a genuine end: previous state PLAYING and the
      // playback position is at the video duration. loadVideoById() can fire
      // a transient ENDED (0) while switching tracks — treating it as an end
      // makes one NEXT/PREV click skip several songs. The manual-skip window
      // additionally suppresses any spurious ENDED that follows a user click.
      if (
        state === 0 &&
        prevPlayerStateRef.current === 1 &&
        Date.now() - lastManualSkipRef.current > MANUAL_SKIP_SUPPRESS_MS
      ) {
        const t = player.getCurrentTime()
        const d = player.getDuration()
        if (d > 0 && t >= d - 0.75) nextRef.current?.()
      }
      prevPlayerStateRef.current = state
    },
    // Player-side failures (embed-restricted video, invalid ID, codec issue).
    // The failed track is removed from the queue so it never shows in the
    // list again, and its videoId is remembered for the session so re-pairing
    // or paging can't bring it back. The next track loads automatically; when
    // every track fails, the queue empties and SIGNAL LOST (PLAYBACK_BLOCKED)
    // takes over.
    onError: () => {
      if (radioInfoRef.current) return
      const failed = currentTrackRef.current
      const q = queueRef.current
      if (!failed || !q.length) return
      blockedVideoIdsRef.current.add(failed.videoId)
      const remaining = q.filter((t) => t.videoId !== failed.videoId)
      if (!remaining.length) {
        setQueue([])
        setQueuePageToken(null)
        setCurrentTrackIndex(0)
        setError(describeError({ message: 'PLAYBACK_BLOCKED' }))
        return
      }
      setQueue(remaining)
      setCurrentTrackIndex((i) => Math.min(i, remaining.length - 1))
    },
  })

  const queueRef = useRef([])
  const currentTrackRef = useRef(null)
  const currentTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const loadedVideoRef = useRef(null)
  const pendingVideoRef = useRef(null)
  const nextRef = useRef(null)
  // Last reported IFrame player state — used to distinguish a genuine video
  // end from the transient ENDED fired while switching tracks.
  const prevPlayerStateRef = useRef(-1)
  // Timestamp of the last manual skip (next/prev/jumpTo). The iframe can fire
  // a spurious ENDED (0) right after loadVideoById() even mid-song, so any
  // auto-advance within this window after a manual skip is ignored — one
  // click advances exactly one track, no cascade.
  const lastManualSkipRef = useRef(0)
  const MANUAL_SKIP_SUPPRESS_MS = 3000
  // Video IDs that failed to play in the embedded player (embed-restricted,
  // removed, codec issue). Removed from the queue on error and remembered for
  // the session so re-pairing/paging never shows them in the list again.
  const blockedVideoIdsRef = useRef(new Set())
  const radioInfoRef = useRef(null)
  const queuePageTokenRef = useRef(null)
  const queueLoadingRef = useRef(false)
  const connectedDeviceIdRef = useRef(null)
  const devicesRef = useRef([])

  useEffect(() => {
    queueRef.current = queue
    currentTrackRef.current = currentTrack
  }, [queue, currentTrack])
  useEffect(() => {
    radioInfoRef.current = radioInfo
  }, [radioInfo])
  useEffect(() => {
    queuePageTokenRef.current = queuePageToken
  }, [queuePageToken])
  useEffect(() => {
    queueLoadingRef.current = queueLoading
  }, [queueLoading])
  useEffect(() => {
    connectedDeviceIdRef.current = connectedDeviceId
  }, [connectedDeviceId])
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

const next = useCallback(() => {
    lastManualSkipRef.current = Date.now()
    const q = queueRef.current
    if (!q.length) return
    if (q.length === 1) {
      player.loadAndPlay(q[0].videoId)
      return
    }
    setCurrentTrackIndex((i) => (i + 1) % q.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prev = useCallback(() => {
    lastManualSkipRef.current = Date.now()
    const q = queueRef.current
    if (!q.length) return
    if (currentTimeRef.current > 3) {
      player.seekTo(0)
      setCurrentTime(0)
      return
    }
    if (q.length === 1) {
      player.seekTo(0)
      setCurrentTime(0)
      return
    }
    setCurrentTrackIndex((i) => (i - 1 + q.length) % q.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load + autoplay whenever the current track changes.
  useEffect(() => {
    const track = queue[currentTrackIndex]
    if (!track) return
    setCurrentTime(0)
    setDuration(track.duration || 0)
    loadedVideoRef.current = track.videoId
    if (playerReady) {
      player.loadAndPlay(track.videoId)
    } else {
      pendingVideoRef.current = track.videoId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, queue])

  // Play the pending track once the IFrame API reports ready.
  useEffect(() => {
    if (playerReady && pendingVideoRef.current) {
      const videoId = pendingVideoRef.current
      pendingVideoRef.current = null
      player.loadAndPlay(videoId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady])

  const resume = useCallback(() => {
    const track = currentTrackRef.current
    if (!track) return
    if (loadedVideoRef.current === track.videoId) {
      player.play()
    } else {
      loadedVideoRef.current = track.videoId
      player.loadAndPlay(track.videoId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1-second time sync from the real iframe playback position.
  useEffect(() => {
    if (!playerReady) return
    const id = setInterval(() => {
      if (!isPlayingRef.current) return
      const t = player.getCurrentTime()
      const d = player.getDuration()
      if (isFinite(t)) setCurrentTime(t)
      if (isFinite(d) && d > 0) setDuration(d)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady])

  const connectDevice = useCallback(
    async (device) => {
      if (!device) return
      setPairing(true)
      setError(null)
      try {
        const { items, nextPageToken } = await loadDeviceQueue(device)
        if (!items.length) throw new Error('EMPTY_QUEUE')
        const playable = items.filter((t) => !blockedVideoIdsRef.current.has(t.videoId))
        if (!playable.length) throw new Error('EMPTY_QUEUE')
        setRadioInfo(null)
        setQueue(playable)
        setQueuePageToken(nextPageToken)
        setQueueLoading(false)
        setCurrentTrackIndex(0)
        setConnectedDeviceId(device.id)
        setActiveDeviceId(device.id)
      } catch (e) {
        setError(describeError(e))
      } finally {
        setPairing(false)
      }
    },
    [],
  )

  const togglePlay = useCallback(() => {
    if (!currentTrackRef.current) {
      // No playlist selected yet — start from the first song of the library
      // (the first available device's queue).
      if (radioInfoRef.current) return
      const first = devicesRef.current[0]
      if (first) connectDevice(first)
      return
    }
    if (isPlayingRef.current) {
      player.pause()
    } else {
      resume()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectDevice])

  const selectDevice = useCallback(
    (deviceId) => {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) return
      setActiveDeviceId(deviceId)
      if (deviceId === connectedDeviceId) return
      connectDevice(device)
    },
    [devices, connectedDeviceId, connectDevice],
  )

  const scanDevices = useCallback(async () => {
    if (scanning || pairing || !devices.length) return
    setScanning(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 1800))
    setScanning(false)
    const idx = devices.findIndex((d) => d.id === connectedDeviceId)
    connectDevice(devices[(idx + 1) % devices.length])
  }, [scanning, pairing, connectedDeviceId, devices, connectDevice])

  const jumpTo = useCallback((index) => {
    lastManualSkipRef.current = Date.now()
    if (!queueRef.current[index]) return
    setCurrentTrackIndex(index)
  }, [])

  const retry = useCallback(() => {
    const target = devices.find((d) => d.id === activeDeviceId)
    connectDevice(target || devices[0])
  }, [devices, activeDeviceId, connectDevice])

  // Library → Now Playing: load the source device's queue, start from the
  // clicked track, and switch the device context so the sidebar/header sync.
  const playTrackFromLibrary = useCallback(
    async (track) => {
      const device = devices.find((d) => d.id === track.sourceDeviceId)
      if (!device) return
      setPairing(true)
      setError(null)
      setRadioInfo(null)
      setActiveDeviceId(device.id)
      try {
        const { items, nextPageToken } = await loadDeviceQueue(device)
        if (!items.length) throw new Error('EMPTY_QUEUE')
        const blocked = blockedVideoIdsRef.current
        const playable = items.filter((t) => !blocked.has(t.videoId))
        if (!playable.length) throw new Error('EMPTY_QUEUE')
        const idx = blocked.has(track.videoId)
          ? -1
          : playable.findIndex((t) => t.videoId === track.videoId)
        if (idx >= 0) {
          setQueue(playable)
          setCurrentTrackIndex(idx)
        } else if (blocked.has(track.videoId)) {
          setQueue(playable)
          setCurrentTrackIndex(0)
        } else {
          setQueue([{ ...track, id: track.videoId, year: track.year || '' }, ...playable.filter((t) => t.videoId !== track.videoId)])
          setCurrentTrackIndex(0)
        }
        setQueuePageToken(nextPageToken)
        setQueueLoading(false)
        setConnectedDeviceId(device.id)
      } catch (e) {
        setError(describeError(e))
      } finally {
        setPairing(false)
      }
    },
    [devices],
  )

  // Infinite scroll: append the next playlist/search page to the queue until
  // the playlist ends. Silently stops paging if a page fails — the loaded
  // queue keeps playing either way.
  const loadMoreQueue = useCallback(async () => {
    if (queueLoadingRef.current || !queuePageTokenRef.current) return
    const device = devicesRef.current.find((d) => d.id === connectedDeviceIdRef.current)
    if (!device) return
    setQueueLoading(true)
    try {
      const { items, nextPageToken } = await loadDeviceQueue(device, queuePageTokenRef.current)
      setQueue((prev) => {
        const known = new Set(prev.map((t) => t.videoId))
        return [...prev, ...items.filter((t) => !known.has(t.videoId) && !blockedVideoIdsRef.current.has(t.videoId))]
      })
      setQueuePageToken(nextPageToken)
    } catch {
      setQueuePageToken(null)
    } finally {
      setQueueLoading(false)
    }
  }, [])

  // Radio: tune the player to the configured live stream (VITE_LIVE_STREAM_ID).
  // Clears the device queue — live never auto-advances; re-pair a device to
  // leave radio mode.
  const playRadio = useCallback(async () => {
    const videoId = liveVideoIdRef.current
    if (!videoId) {
      setError(describeError({ message: 'NO_LIVE_SOURCE' }))
      return
    }
    setPairing(true)
    setError(null)
    try {
      let info = { videoId, title: 'LIVE STATION', channel: 'IPODIFY RADIO', thumbnail: null }
      const fetched = await fetchVideoInfo(videoId)
      if (fetched) info = { ...info, ...fetched }
      setRadioInfo(info)
      setQueue([])
      setQueuePageToken(null)
      setQueueLoading(false)
      setCurrentTrackIndex(0)
      setConnectedDeviceId(null)
      setActiveDeviceId(null)
      player.loadAndPlay(videoId)
    } catch (e) {
      setError(describeError(e))
    } finally {
      setPairing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopRadio = useCallback(() => {
    setRadioInfo(null)
    setQueuePageToken(null)
    player.pause()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMediaSession({
    track: currentTrack,
    isPlaying,
    currentTime,
    duration,
    onPlay: resume,
    onPause: () => player.pause(),
    onPrev: prev,
    onNext: next,
  })

  const value = useMemo(
    () => ({
      devices,
      addDevice,
      removeDevice,
      activeDevice: devices.find((d) => d.id === activeDeviceId) || null,
      connectedDevice: devices.find((d) => d.id === connectedDeviceId) || null,
      queue,
      queuePageToken,
      queueLoading,
      currentTrack,
      currentTrackIndex,
      isPlaying,
      currentTime,
      duration,
      scanning,
      pairing,
      error,
      selectDevice,
      scanDevices,
      togglePlay,
      next,
      prev,
      jumpTo,
      retry,
      playTrackFromLibrary,
      loadMoreQueue,
      radioInfo,
      playRadio,
      stopRadio,
    }),
    [
      devices,
      addDevice,
      removeDevice,
      activeDeviceId,
      connectedDeviceId,
      queue,
      queuePageToken,
      queueLoading,
      currentTrack,
      currentTrackIndex,
      isPlaying,
      currentTime,
      duration,
      scanning,
      pairing,
      error,
      selectDevice,
      scanDevices,
      togglePlay,
      next,
      prev,
      jumpTo,
      retry,
      playTrackFromLibrary,
      loadMoreQueue,
      radioInfo,
      playRadio,
      stopRadio,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div ref={player.hostRef} className="youtube-player-host" aria-hidden="true" />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}