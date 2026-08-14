import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchDurations, fetchPlaylistPage, getSource, searchPage } from '../lib/youtube'

const PAGE_SIZE = 20

// Merged, paginated library across all devices. One page per source fetched
// on initial load; subsequent pages are fetched round-robin via loadMore()
// (driven by an IntersectionObserver sentinel in LibraryView). At most one
// request is in flight at a time; loaded pages stay cached in state.
export function useInfiniteLibrary(devices) {
  const [tracks, setTracks] = useState([])
  const [tokens, setTokens] = useState({})
  const [loadedKeys, setLoadedKeys] = useState({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const tracksRef = useRef([])
  const tokensRef = useRef({})
  const loadedRef = useRef({})
  const inFlightRef = useRef(false)
  const rotationRef = useRef(0)

  const devicesKey = devices.map((d) => d.id).join('|')

  // Reset when the device set changes (mount, add, forget).
  useEffect(() => {
    tracksRef.current = []
    tokensRef.current = {}
    loadedRef.current = {}
    inFlightRef.current = false
    rotationRef.current = 0
    setTracks([])
    setTokens({})
    setLoadedKeys({})
    setError(null)
    setIsLoadingMore(false)
  }, [devicesKey])

  const applyPage = useCallback((device, pageItems, nextToken) => {
    tracksRef.current = [...tracksRef.current, ...pageItems]
    tokensRef.current = { ...tokensRef.current, [device.id]: nextToken }
    loadedRef.current = { ...loadedRef.current, [device.id]: true }
    setTracks(tracksRef.current)
    setTokens(tokensRef.current)
    setLoadedKeys(loadedRef.current)
  }, [])

  // Fetch one device's next page and append it (no-op when that source is
  // exhausted: loaded && no nextPageToken).
  const loadNextPageFor = useCallback(
    async (device) => {
      const loaded = loadedRef.current[device.id]
      const token = tokensRef.current[device.id]
      if (loaded && !token) return
      const source = getSource(device)
      const page =
        source.type === 'playlist'
          ? await fetchPlaylistPage(source.playlistId, token || null, PAGE_SIZE)
          : await searchPage(source.query, token || null, PAGE_SIZE)
      const durations = await fetchDurations(page.items.map((i) => i.videoId))
      const enriched = page.items.map((i) => ({
        ...i,
        duration: durations[i.videoId] || i.duration || 0,
        sourceDeviceId: device.id,
        sourceDeviceName: device.name,
      }))
      applyPage(device, enriched, page.nextPageToken)
    },
    [applyPage],
  )

  // Initial load: first page from every source, sequentially.
  useEffect(() => {
    if (!devices.length) return
    let cancelled = false
    ;(async () => {
      inFlightRef.current = true
      setIsLoadingMore(true)
      setError(null)
      try {
        for (const device of devices) {
          if (cancelled) return
          await loadNextPageFor(device)
        }
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) {
          inFlightRef.current = false
          setIsLoadingMore(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devicesKey])

  const hasMore = useMemo(
    () => devices.some((d) => !loadedKeys[d.id] || Boolean(tokens[d.id])),
    [devices, loadedKeys, tokens],
  )

  // Fetch the next page from the next source that still has results
  // (round-robin). Single in-flight request; throttled by the caller.
  const loadMore = useCallback(async () => {
    if (inFlightRef.current) return
    const candidates = devices.filter(
      (d) => !loadedRef.current[d.id] || Boolean(tokensRef.current[d.id]),
    )
    if (!candidates.length) return
    const device = candidates[rotationRef.current % candidates.length]
    rotationRef.current = (rotationRef.current + 1) % Math.max(1, candidates.length)
    inFlightRef.current = true
    setIsLoadingMore(true)
    setError(null)
    try {
      await loadNextPageFor(device)
    } catch (e) {
      setError(e)
    } finally {
      inFlightRef.current = false
      setIsLoadingMore(false)
    }
  }, [devices, loadNextPageFor])

  const retry = useCallback(() => {
    setError(null)
    loadMore()
  }, [loadMore])

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tracks
    return tracks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q) ||
        t.sourceDeviceName?.toLowerCase().includes(q),
    )
  }, [tracks, search])

  return {
    tracks,
    filteredTracks,
    total: tracks.length,
    hasMore,
    isLoadingMore,
    initialLoading: isLoadingMore && tracks.length === 0,
    error,
    loadMore,
    retry,
    search,
    setSearch,
  }
}