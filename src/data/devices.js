// "Devices" are the artists you can pair with. Selecting one simulates a
// Bluetooth pairing and loads that artist's queue from YouTube.
//
// Built-in defaults are derived from the environment (VITE_PLAYLIST_<ID>)
// — never hardcode playlist IDs in source. If the env var is unset the
// device falls back to a `{name} official audio` search. User-paired
// devices (sourceType/sourceValue from the Settings panel) live in
// localStorage via useDeviceStore and are merged in at runtime.
//
// sourceType: "playlist" (curated playlist, saves quota) | "search"
// sourceValue: playlist ID or search query
// yearOverride: optional fixed year for the "ARTIST // YEAR" subtitle.

import { extractPlaylistId } from '../lib/youtube.js'

function envSource(name, envVar) {
  const playlistId = extractPlaylistId(import.meta.env[envVar])
  return {
    sourceType: playlistId ? 'playlist' : 'search',
    sourceValue: playlistId || `${name} official audio`,
  }
}

export const defaultDevices = [
  {
    id: "nokia-5233",
    name: "Nokia 5233",
    avatarUrl: null,
    ...envSource("Nokia 5233", "VITE_PLAYLIST_NOKIA_5233"),
    yearOverride: 2009,
    isUserAdded: false,
    createdAt: 0,
  },
  {
    id: "sony-ericsson-w595",
    name: "Sony Ericsson W595",
    avatarUrl: null,
    ...envSource("Sony Ericsson W595", "VITE_PLAYLIST_SONY_W595"),
    yearOverride: 2008,
    isUserAdded: false,
    createdAt: 0,
  },
  {
    id: "samsung-star",
    name: "Samsung Star GT-S5233",
    avatarUrl: null,
    ...envSource("Samsung Star GT-S5233", "VITE_PLAYLIST_SAMSUNG_STAR"),
    yearOverride: 2009,
    isUserAdded: false,
    createdAt: 0,
  },
];