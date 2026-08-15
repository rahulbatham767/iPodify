import React from 'react';

// Reusable noise texture for the matte finish
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E";

export function formatIpodTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

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
  playDisabled = false,
  hasTrack = false,
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
        : '0 of 0';

  const isNoSignal = !title || title === 'No Signal';

  return (
    <div className="relative w-[760px] h-[660px] bg-transparent">
      {/* ---- The iPod Body ---- */}
      <div className="absolute left-1/2 top-10 z-10 w-[300px] h-[520px] -translate-x-1/2">
        <div className="relative w-full h-full flex flex-col items-center px-[22px] pt-[22px] rounded-[38px] border border-[#d5d5d2] bg-[linear-gradient(180deg,#fafaf8_0%,#f1f1ee_42%,#e7e7e3_78%,#e2e2de_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-3px_10px_rgba(0,0,0,0.06),inset_3px_0_8px_rgba(0,0,0,0.045),inset_-3px_0_8px_rgba(0,0,0,0.045)]">
          {/* Brushed matte texture */}
          <div
            className="absolute inset-0 rounded-[38px] pointer-events-none mix-blend-multiply"
            style={{ backgroundImage: `url("${NOISE}")`, opacity: 0.035 }}
          />
          {/* Top sheen */}
          <div className="absolute inset-0 rounded-[38px] pointer-events-none bg-[radial-gradient(70%_45%_at_50%_-4%,rgba(255,255,255,0.5),rgba(255,255,255,0)_60%)]" />

          {/* Glossy Black Display */}
          <div className="relative w-full h-[236px] rounded-[9px] p-[3px] bg-[#141415] shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)]">
            <div className="relative w-full h-full rounded-[6px] bg-[#0a0a0b] shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] overflow-hidden">
              {/* LCD grain + glass reflection */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{ backgroundImage: `url("${NOISE}")`, opacity: 0.06 }}
              />
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_24%,rgba(255,255,255,0)_42%)]" />

              {/* Header: Play / Now Playing / Battery */}
              <div className="h-7 flex items-center gap-2 px-2.5 bg-black/40 border-b border-white/10">
                <svg viewBox="0 0 10 10" className="w-[8px] h-[8px] shrink-0" aria-hidden="true">
                  <path d="M2 1v8l6-4z" fill="#fff" opacity="0.85" />
                </svg>
                <span className="flex-1 text-center font-headline-lg text-[10px] font-semibold tracking-[0.05em] text-white/85 truncate">
                  {live ? 'Live Station' : 'Now Playing'}
                </span>
                <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] shrink-0" aria-hidden="true">
                  <path
                    d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"
                    fill={hasTrack ? 'rgba(255,255,255,0.4)' : '#ffffff'}
                    style={{
                      animation: hasTrack && !isPlaying ? 'blinkGray 1.2s infinite' : 'none',
                      filter: hasTrack && isPlaying ? 'drop-shadow(0 0 3px rgba(106,183,255,0.95))' : undefined,
                    }}
                  />
                </svg>
                <svg viewBox="0 0 22 11" className="w-[17px] h-[9px] shrink-0" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="16.5" height="10" rx="2.5" fill="none" stroke="#fff" strokeWidth="1" opacity="0.85" />
                  <rect x="18" y="3.5" width="2.8" height="4" rx="1" fill="#fff" opacity="0.85" />
                  <rect x="2.5" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                  <rect x="7.2" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                  <rect x="11.9" y="2" width="3.6" height="7" rx="0.8" fill="#fff" opacity="0.85" />
                </svg>
              </div>

              {/* Song Info */}
              <div className="px-3 pt-2.5 flex flex-col items-center text-white/90">
                <p className="font-headline-lg text-[9px] font-medium leading-none text-white/55">
                  {count}
                </p>
                <p className="w-full font-headline-lg font-bold text-[22px] leading-[1.15] text-center truncate mt-1.5">
                  {isNoSignal ? 'No Signal' : title}
                </p>
                {isNoSignal ? (
                  <p className="w-full font-headline-lg font-medium text-[14px] leading-[1.2] text-center truncate mt-2 text-white/60">
                    Scan devices to begin
                  </p>
                ) : (
                  <>
                    <p className="w-full font-headline-lg font-medium text-[16px] leading-[1.2] text-center truncate mt-1">
                      {artist}
                    </p>
                    <p className="w-full font-body-md text-[14px] leading-[1.2] text-center truncate mt-0.5 opacity-70">
                      {album}
                    </p>
                  </>
                )}
                {isNoSignal && (
                  <div className="w-full flex justify-center mt-3">
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-white/40" aria-hidden="true">
                      <path
                        d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"
                        fill="rgba(255,255,255,0.4)"
                      />
                    </svg>
                  </div>
                )}
                {!isNoSignal && hasTrack && isPlaying && (
                  <div className="w-full flex justify-center mt-3">
                    <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true">
                      <path
                        d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"
                        fill="#6ab7ff"
                        style={{ filter: 'drop-shadow(0 0 3px rgba(106,183,255,0.95))' }}
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
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

          {/* Circular Click Wheel */}
          <div
            className="relative mt-[30px] w-[220px] h-[220px] rounded-[8.75rem] border border-black/50"
            style={{
              background:
                "radial-gradient(circle at 34% 26%, #4c4c4e 0%, #1a1a1c 30%, #0c0c0e 62%, #050506 100%)",
              boxShadow:
                "inset 0 5px 12px rgba(0,0,0,0.85), inset 0 -1px 2px rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={onMenu}
              aria-label="Menu"
              className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2 w-[90px] h-[40px] flex items-center justify-center font-display-tech text-[11px] font-bold tracking-[0.25em] text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              MENU
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onPrev}
              aria-label="Previous track"
              className="absolute left-[15%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[90px] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" aria-hidden="true">
                <path d="M14 5v14L4 12l10-7zm6 0v14l-8-5.4V10L20 5z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onNext}
              aria-label="Next track"
              className="absolute right-[15%] top-1/2 translate-x-1/2 -translate-y-1/2 w-[40px] h-[90px] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" aria-hidden="true">
                <path d="M4 5v14l10-7L4 5zm10 0v14l6-7-6-7z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              disabled={playDisabled}
              onClick={onTogglePlay}
              aria-label={live ? "Stop radio" : isPlaying ? "Pause" : "Play"}
              className="absolute left-1/2 bottom-[15%] -translate-x-1/2 translate-y-1/2 w-[90px] h-[40px] flex items-center justify-center text-[#e6e6e6] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
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
            <button
              type="button"
              disabled={playDisabled}
              aria-label="Select"
              onClick={onTogglePlay}
              className="absolute inset-0 m-auto w-[66px] h-[66px] rounded-full bg-[linear-gradient(180deg,#ffffff,#e8e8e9)] border border-black/20 shadow-[inset_0_3px_6px_rgba(0,0,0,0.25),inset_0_-1px_2px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.35)] active:translate-y-[1px] transition-all disabled:opacity-60 disabled:cursor-default"
            >
              <span className="block w-full h-full rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0)_55%)] flex items-center justify-center">
                {live ? (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" fill="#2a2a2c" />
                  </svg>
                ) : isPlaying ? (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
                    <rect x="6" y="5" width="4.5" height="14" fill="#2a2a2c" />
                    <rect x="13.5" y="5" width="4.5" height="14" fill="#2a2a2c" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
                    <path d="M7 4v16l13-8z" fill="#2a2a2c" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* 3.5mm Jack */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-[15px] h-[6px] rounded-b-[4px] bg-[#3a3a3c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
          <div className="w-[13px] h-[12px] rounded-b-[3px] bg-[linear-gradient(180deg,#f4f4f2,#e2e2df)] border border-[#c9c9c6] shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    </div>
  );
}