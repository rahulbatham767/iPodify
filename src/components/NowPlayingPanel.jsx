// Photorealistic product-photo scene — intentional exception to the dark
// theme, with a transparent background so the app's dark theme shows
// through. Matte white aluminum iPod (taller/slimmer, straight), glossy
// black display showing song details, original circular black click wheel,
// and classic white wired EarPods: long cable plugged into the bottom-center
// 3.5mm jack, dropping and coiling loosely on the right.

const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"

export function formatIpodTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

const CABLE =
  'M380,576 C381,590 377,606 394,622 C412,640 458,648 510,644 ' +
  'C540,638 570,630 598,617 ' +
  'C626,599 638,570 623,548 C607,525 572,528 561,551 C552,572 569,593 595,599 ' +
  'C621,605 647,593 653,570 C659,547 640,529 613,533 C587,537 575,558 582,580 C589,600 610,608 631,604 ' +
  'C656,598 669,569 660,514 C654,468 641,430 628,394 ' +
  'M628,394 C608,373 593,344 580,317 ' +
  'M628,394 C648,375 666,349 684,323'

export function NowPlayingPanel({
  title = 'No Signal',
  artist = '',
  album = '',
  currentTime = '0:00',
  duration = '-0:00',
  trackNumber = 0,
  totalTracks = 0,
  progress = 0,
  live = false,
  pairing = false,
  isPlaying = false,
  disabled = false,
  onMenu,
  onPrev,
  onNext,
  onTogglePlay,
}) {
  const count = live
    ? 'LIVE FEED'
    : pairing
      ? 'CONNECTING'
      : totalTracks > 0
        ? `${trackNumber} of ${totalTracks}`
        : '0 of 0'

  return (
    <div className="relative w-[760px] h-[660px]">
      {/* Cable + EarPods layer — behind the pod (z-0), so the cable appears
          to emerge from the bottom-center jack */}
      <svg viewBox="0 0 760 660" className="absolute inset-0 w-full h-full z-0" aria-hidden="true">
        <defs>
          <linearGradient id="sceneBudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8f8f6" />
            <stop offset="1" stopColor="#ececea" />
          </linearGradient>
        </defs>

        {/* cable — soft shadow pass */}
        <path d={CABLE} fill="none" stroke="#dcd9d6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* cable — highlight pass */}
        <path d={CABLE} fill="none" stroke="#f7f7f5" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Y-split joint */}
        <rect x="619" y="389" width="18" height="10" rx="5" fill="#f0f0ee" stroke="#d4d4d1" strokeWidth="0.8" transform="rotate(-24 628 394)" />

        {/* Left earbud — resting beside the coil pile */}
        <g transform="translate(580,317) rotate(22)">
          <rect x="-3" y="-16" width="6" height="16" rx="3" fill="url(#sceneBudGrad)" stroke="#d5d5d2" strokeWidth="0.8" />
          <rect x="-14" y="-42" width="28" height="28" rx="12" fill="url(#sceneBudGrad)" stroke="#d5d5d2" strokeWidth="0.8" />
          <ellipse cx="0" cy="-37" rx="8" ry="6" fill="#d7d7d4" />
          <rect x="-4.5" y="-39" width="9" height="1.5" rx="0.75" fill="#c6c6c3" />
          <rect x="-4.5" y="-35.5" width="9" height="1.5" rx="0.75" fill="#c6c6c3" />
        </g>
        {/* Right earbud — resting beside the coil pile */}
        <g transform="translate(684,323) rotate(-18)">
          <rect x="-3" y="-16" width="6" height="16" rx="3" fill="url(#sceneBudGrad)" stroke="#d5d5d2" strokeWidth="0.8" />
          <rect x="-14" y="-42" width="28" height="28" rx="12" fill="url(#sceneBudGrad)" stroke="#d5d5d2" strokeWidth="0.8" />
          <ellipse cx="0" cy="-37" rx="8" ry="6" fill="#d7d7d4" />
          <rect x="-4.5" y="-39" width="9" height="1.5" rx="0.75" fill="#c6c6c3" />
          <rect x="-4.5" y="-35.5" width="9" height="1.5" rx="0.75" fill="#c6c6c3" />
        </g>
      </svg>

      {/* The iPod — matte white aluminum body, straight */}
      <div className="absolute left-1/2 top-10 z-10 w-[300px] h-[520px] -translate-x-1/2">
        <div className="relative w-full h-full flex flex-col items-center px-[22px] pt-[22px] rounded-[38px] border border-[#d5d5d2] bg-[linear-gradient(180deg,#fafaf8_0%,#f1f1ee_42%,#e7e7e3_78%,#e2e2de_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-3px_10px_rgba(0,0,0,0.06),inset_3px_0_8px_rgba(0,0,0,0.045),inset_-3px_0_8px_rgba(0,0,0,0.045)]">
          {/* brushed matte texture */}
          <div
            className="absolute inset-0 rounded-[38px] pointer-events-none mix-blend-multiply"
            style={{ backgroundImage: `url("${NOISE}")`, opacity: 0.035 }}
          />
          {/* top sheen */}
          <div className="absolute inset-0 rounded-[38px] pointer-events-none bg-[radial-gradient(70%_45%_at_50%_-4%,rgba(255,255,255,0.5),rgba(255,255,255,0)_60%)]" />

          {/* Glossy black display — song details, thin black bezel */}
          <div className="relative w-full h-[236px] rounded-[9px] p-[3px] bg-[#141415] shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)]">
            <div className="relative w-full h-full rounded-[6px] bg-[#0a0a0b] shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] overflow-hidden">
              {/* LCD grain + glass reflection */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{ backgroundImage: `url("${NOISE}")`, opacity: 0.06 }}
              />
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_24%,rgba(255,255,255,0)_42%)]" />

              {/* Header: play / Now Playing / battery */}
              <div className="h-7 flex items-center gap-2 px-2.5 bg-black/40 border-b border-white/10">
                <svg viewBox="0 0 10 10" className="w-[8px] h-[8px] shrink-0" aria-hidden="true">
                  <path d="M2 1v8l6-4z" fill="#fff" opacity="0.85" />
                </svg>
                <span className="flex-1 text-center font-headline-lg text-[10px] font-semibold tracking-[0.05em] text-white/85 truncate">
                  {live ? 'Live Station' : 'Now Playing'}
                </span>
                <svg viewBox="0 0 22 11" className="w-[17px] h-[9px] shrink-0" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="16.5" height="10" rx="2.5" fill="none" stroke="#fff" strokeWidth="1" opacity="0.85" />
                  <rect x="18" y="3.5" width="2.8" height="4" rx="1" fill="#fff" opacity="0.85" />
                  <rect x="2.5" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                  <rect x="7.2" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                  <rect x="11.9" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                </svg>
              </div>

              {/* Song info — centered hierarchy */}
              <div className="px-3 pt-2.5 flex flex-col items-center text-white/90">
                <p className="font-headline-lg text-[9px] font-medium leading-none text-white/55">{count}</p>
                <p className="w-full font-headline-lg font-bold text-[22px] leading-[1.15] text-center truncate mt-1.5">{title}</p>
                <p className="w-full font-headline-lg font-medium text-[16px] leading-[1.2] text-center truncate mt-1">{artist}</p>
                <p className="w-full font-body-md text-[14px] leading-[1.2] text-center truncate mt-0.5 opacity-70">{album}</p>
              </div>

              {/* Progress */}
              {live ? (
                <div className="absolute inset-x-3 bottom-2 flex items-center gap-2">
                  <div className="flex-1 h-[4px] rounded-[2px] bg-white/15 border border-white/10 overflow-hidden">
                    <div className="h-full bg-white animate-pulse" style={{ width: '100%' }} />
                  </div>
                  <span className="font-body-md text-[8px] text-white/70 shrink-0">ON AIR</span>
                </div>
              ) : (
                <div className="absolute inset-x-3 bottom-2">
                  <div className="h-[4px] rounded-[2px] bg-white/15 border border-white/10 overflow-hidden">
                    <div className="h-full bg-white transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 font-body-md text-[8px] text-white/70">
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Original circular black click wheel */}
          <div
            className="relative mt-[30px] w-[220px] h-[220px] rounded-full border border-black/50"
            style={{
              background: 'radial-gradient(circle at 34% 26%, #4c4c4e 0%, #1a1a1c 30%, #0c0c0e 62%, #050506 100%)',
              boxShadow:
                'inset 0 5px 12px rgba(0,0,0,0.85), inset 0 -1px 2px rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.35)',
            }}
          >
            {/* MENU — radio mode stops the stream; music mode pauses playback */}
            <button
              type="button"
              disabled={disabled}
              onClick={onMenu}
              aria-label="Menu"
              className="absolute top-0 left-0 w-full h-[27%] flex items-center justify-center font-display-tech text-[11px] font-bold tracking-[0.25em] text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              MENU
            </button>
            {/* PREV */}
            <button
              type="button"
              disabled={disabled}
              onClick={onPrev}
              aria-label="Previous track"
              className="absolute left-0 top-0 h-full w-[25%] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" aria-hidden="true">
                <path d="M14 5v14L4 12l10-7zm6 0v14l-8-5.4V10L20 5z" fill="currentColor" />
              </svg>
            </button>
            {/* NEXT */}
            <button
              type="button"
              disabled={disabled}
              onClick={onNext}
              aria-label="Next track"
              className="absolute right-0 top-0 h-full w-[25%] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" aria-hidden="true">
                <path d="M4 5v14l10-7L4 5zm10 0v14l6-7-6-7z" fill="currentColor" />
              </svg>
            </button>
            {/* PLAY / PAUSE / STOP */}
            <button
              type="button"
              disabled={disabled}
              onClick={onTogglePlay}
              aria-label={live ? 'Stop radio' : isPlaying ? 'Pause' : 'Play'}
              className="absolute bottom-0 left-0 w-full h-[27%] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {live ? (
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" aria-hidden="true">
                  <rect x="5" y="5" width="14" height="14" fill="currentColor" />
                </svg>
              ) : isPlaying ? (
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" aria-hidden="true">
                  <rect x="6" y="5" width="4.5" height="14" fill="currentColor" />
                  <rect x="13.5" y="5" width="4.5" height="14" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" aria-hidden="true">
                  <path d="M7 4v16l13-8z" fill="currentColor" />
                </svg>
              )}
            </button>
            {/* White center button — acts as PLAY/STOP */}
            <button
              type="button"
              disabled={disabled}
              aria-label="Select"
              onClick={onTogglePlay}
              className="absolute inset-0 m-auto w-[66px] h-[66px] rounded-full bg-[linear-gradient(180deg,#ffffff,#e8e8e9)] border border-black/20 shadow-[inset_0_3px_6px_rgba(0,0,0,0.25),inset_0_-1px_2px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.35)] active:translate-y-[1px] transition-all disabled:opacity-60 disabled:cursor-default"
            >
              <span className="block w-full h-full rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0)_55%)]" />
            </button>
          </div>
        </div>

        {/* 3.5mm jack at the bottom center — plug visibly inserted */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-[15px] h-[6px] rounded-b-[4px] bg-[#3a3a3c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
          <div className="w-[13px] h-[12px] rounded-b-[3px] bg-[linear-gradient(180deg,#f4f4f2,#e2e2df)] border border-[#c9c9c6] shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    </div>
  )
}