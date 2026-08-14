import { Icon } from './Icon'

const SECTIONS = [
  {
    icon: 'sensors',
    title: 'ABOUT',
    body: [
      'iPodify is a mid-2000s Bluetooth radio-styled music player for the web. Pair a device (an artist with a curated YouTube playlist), tune the radio, or browse the combined library.',
      'Built with React + Vite and wired to real YouTube playback through the IFrame Player API — audio-only, delivered through a hidden 1x1 player instance.',
    ],
  },
  {
    icon: 'bluetooth',
    title: 'HOW TO USE',
    steps: [
      'Press SCAN DEVICES in the sidebar to connect the first paired device, or tap any device in the list.',
      'Browse LIBRARY to see every track across all devices — scroll to load more, tap a row to play.',
      'Switch to RADIO for the 24/7 live station; re-pair a device to leave radio mode.',
      'Open SETTINGS to pair your own device/playlist or forget a user-added one.',
      'Install the PWA on Android Chrome for reliable background playback (iOS Safari limits background audio).',
    ],
  },
  {
    icon: 'help',
    title: 'SUPPORT',
    body: [
      'SIGNAL LOST panels appear when the connection drops — if music fails to load, check that the YouTube Data API key is valid and the daily quota is not exhausted.',
      'Pairing probes the playlist source before saving. Playlists must be public and embeddable on third-party sites.',
      'Set up: copy .env.example to .env and fill in VITE_YOUTUBE_API_KEY plus optional VITE_PLAYLIST_* and VITE_LIVE_STREAM_ID values.',
    ],
  },
  {
    icon: 'warning',
    title: 'DISCLAIMER',
    body: [
      'iPodify is a personal demo project. It is not affiliated with, endorsed by, or sponsored by Sony, Apple, YouTube, or Google.',
      'All music, artwork, and video content streamed through this player belongs to its respective owners and is played via the official YouTube IFrame Player. No content is hosted or downloaded by this site.',
      'The player requires a YouTube Data API key, which has usage quotas. Keys are stored only in your browser environment configuration and are never committed to the repository.',
      'For entertainment and educational purposes only.',
    ],
  },
  {
    icon: 'copyright',
    title: 'COPYRIGHT',
    body: [
      '© 2026 iPODIFY. All rights reserved.',
      'Design language: "Cyanide Tech" — Space Mono / Space Grotesk / Hanken Grotesk via Google Fonts. Material Symbols by Google.',
      'Built as a portfolio demonstration of a static design mockup ported to a fully wired React application.',
    ],
  },
]

export function InfoView() {
  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-0 px-1">
      <h2 className="font-display-tech text-tertiary text-[16px] tracking-widest lcd-text-glow mb-4">
        SUPPORT & INFO
      </h2>
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="glass-panel chrome-bezel rounded-lg p-4">
            <h3 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2 mb-2">
              <Icon name={section.icon} className="text-[16px] text-tertiary" />
              {section.title}
            </h3>
            {section.body && section.body.map((line) => (
              <p key={line} className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed mb-1.5 last:mb-0">
                {line}
              </p>
            ))}
            {section.steps && (
              <ol className="space-y-1.5">
                {section.steps.map((step, i) => (
                  <li key={step} className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed flex gap-2">
                    <span className="text-tertiary shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
