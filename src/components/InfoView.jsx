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
      'SIGNAL LOST panels appear whenever the player loses connection.',
      {
        text: 'If music fails to load:',
        sub: [
          'Verify your VITE_YOUTUBE_API_KEY is valid.',
          'Check that your YouTube Data API daily quota has not been exhausted.',
          'Ensure the playlist is public and embeddable on third-party websites.',
        ],
      },
    ],
  },
  {
    icon: 'settings',
    title: 'SETUP',
    steps: [
      'Copy .env.example → .env',
      'Add your YouTube API key: VITE_YOUTUBE_API_KEY',
      '(Optional) Configure: VITE_PLAYLIST_LOFI, VITE_PLAYLIST_RETRO, VITE_PLAYLIST_SYNTH, VITE_LIVE_STREAM_ID',
      'Update the built-in playlists and live stream at runtime — open the ADMIN CONSOLE at /#admin (needs ADMIN_TOKEN set on the server).',
    ],
  },
  {
    icon: 'warning',
    title: 'DISCLAIMER',
    body: [
      'iPODIFY is an independent project created and developed by Rahul Batham as a portfolio and UI engineering showcase.',
      'This project is not affiliated with, endorsed by, or sponsored by Apple, Sony, YouTube, or Google.',
      'All music, artwork, and video content remains the property of its respective copyright owners and is streamed through the official YouTube IFrame Player API. No media is hosted, copied, or downloaded by this application.',
      'The YouTube Data API key is used only for client-side API requests during development and should never be committed to the repository.',
      'This project is intended for educational, experimental, and portfolio purposes.',
    ],
  },
  {
    icon: 'copyright',
    title: 'COPYRIGHT',
    body: [
      '© 2026 Rahul Batham. All rights reserved.',
      'iPODIFY — Designed & developed by Rahul Batham.',
      'Design language: Cyanide Tech · Typography: Space Mono, Space Grotesk & Hanken Grotesk · Icons: Google Material Symbols',
      'A handcrafted React + TypeScript recreation of a nostalgic iPod experience with a fully functional YouTube-powered music player.',
    ],
  },
]

export function InfoView() {
  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-2 px-2 pt-2">
      <h2 className="font-display-tech text-tertiary text-[16px] tracking-widest lcd-text-glow mb-5">
        SUPPORT & INFO
      </h2>
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <section key={section.title} className="glass-panel chrome-bezel rounded-lg p-5">
            <h3 className="font-label-caps text-label-caps text-tertiary-fixed tracking-widest flex items-center gap-2 mb-3">
              <Icon name={section.icon} className="text-[16px] text-tertiary" />
              {section.title}
            </h3>
            {section.body && section.body.map((line) => (
              typeof line === 'string' ? (
                <p key={line} className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed mb-2 last:mb-0">
                  {line}
                </p>
              ) : (
                <div key={line.text} className="mb-2">
                  <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed mb-1.5">
                    {line.text}
                  </p>
                  <ul className="space-y-1 pl-4 border-l border-outline-variant/40">
                    {line.sub.map((item) => (
                      <li key={item} className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed flex gap-2">
                        <span className="text-tertiary shrink-0">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
            {section.steps && (
              <ol className="space-y-2">
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
