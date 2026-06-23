import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildAlbumPages, getTeam } from '../utils/stickers'

function Sticker({ sticker }) {
  const team = sticker.team ? getTeam(sticker.team) : null
  const isShiny = sticker.isShiny
  const baseClasses = 'relative aspect-[3/4] overflow-hidden rounded-md border text-[10px] sm:text-xs'
  const borderClass = isShiny ? 'border-amber-300/70' : 'border-slate-700'
  const style = team
    ? {
        background: isShiny
          ? `linear-gradient(135deg, ${team.primary} 0%, ${team.accent} 50%, ${team.secondary} 100%)`
          : `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
      }
    : {
        background: isShiny
          ? 'linear-gradient(135deg, #f59e0b 0%, #fde68a 50%, #f59e0b 100%)'
          : 'linear-gradient(160deg, #1e293b 0%, #334155 100%)',
      }
  return (
    <div className={`${baseClasses} ${borderClass} shadow-md`} style={style}>
      {isShiny ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 45%, transparent 60%)',
          }}
        />
      ) : null}
      <span className="absolute top-1 left-1 rounded bg-black/55 px-1 py-0.5 font-mono text-[9px] font-bold text-white">
        #{sticker.number}
      </span>
      {sticker.kind === 'player' && sticker.position ? (
        <span className="absolute top-1 right-1 rounded bg-white/85 px-1 py-0.5 font-mono text-[9px] font-bold text-slate-900">
          {sticker.position}
        </span>
      ) : null}
      {sticker.kind === 'badge' ? (
        <span className="absolute top-1 right-1 rounded bg-amber-400 px-1 py-0.5 font-mono text-[9px] font-bold text-amber-950">
          BADGE
        </span>
      ) : null}
      {/* Silhouette */}
      <div className="absolute inset-0 flex items-end justify-center">
        {sticker.kind === 'player' ? (
          <svg viewBox="0 0 40 50" className="h-3/4 w-3/4 opacity-30" aria-hidden="true">
            <circle cx="20" cy="12" r="7" fill="#000" />
            <path d="M5,50 Q5,28 20,26 Q35,28 35,50 Z" fill="#000" />
          </svg>
        ) : null}
        {sticker.kind === 'badge' ? (
          <svg viewBox="0 0 40 50" className="h-3/4 w-3/4 opacity-50" aria-hidden="true">
            <path d="M6,8 L34,8 L34,28 Q20,46 6,28 Z" fill="rgba(255,255,255,0.6)" stroke="#000" strokeWidth="1.5" />
            <text x="20" y="26" textAnchor="middle" fontSize="9" fontWeight="900" fill="#000">{sticker.team}</text>
          </svg>
        ) : null}
        {sticker.kind === 'stadium' ? (
          <svg viewBox="0 0 60 40" className="h-3/4 w-3/4 opacity-45" aria-hidden="true">
            <ellipse cx="30" cy="30" rx="26" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" />
            <ellipse cx="30" cy="26" rx="22" ry="6" fill="none" stroke="#fff" strokeWidth="1" />
            <path d="M4,30 Q30,10 56,30" fill="none" stroke="#fff" strokeWidth="1.5" />
          </svg>
        ) : null}
        {sticker.kind === 'mascot' ? (
          <span className="pb-2 text-3xl" aria-hidden="true">🦊</span>
        ) : null}
        {sticker.kind === 'history' ? (
          <svg viewBox="0 0 40 50" className="h-3/4 w-3/4 opacity-50" aria-hidden="true">
            <path d="M14,8 L26,8 L26,18 Q26,30 20,34 Q14,30 14,18 Z" fill="rgba(255,255,255,0.7)" stroke="#000" strokeWidth="1" />
            <rect x="17" y="34" width="6" height="4" fill="rgba(255,255,255,0.7)" />
            <rect x="13" y="38" width="14" height="3" fill="rgba(255,255,255,0.7)" />
          </svg>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-1">
        <p className="truncate font-semibold text-white" title={sticker.label}>
          {sticker.label}
        </p>
      </div>
    </div>
  )
}

function PageContent({ page, album }) {
  if (!page) return null
  const team = page.team ? getTeam(page.team) : null
  return (
    <div className="flex h-full flex-col">
      <header
        className="flex items-center justify-between gap-2 border-b border-slate-700/60 bg-slate-900/70 px-3 py-2"
        style={team ? { borderColor: team.primary } : undefined}
      >
        <h4 className="truncate text-sm font-bold text-white">{page.title}</h4>
        {team ? (
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold"
            style={{ background: team.primary, color: team.secondary }}
          >
            {page.team}
          </span>
        ) : null}
      </header>
      <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
        {page.stickers.map((sticker) => (
          <Sticker key={`${album.year}-${sticker.number}`} sticker={sticker} />
        ))}
      </div>
    </div>
  )
}

function VirtualAlbum({ album, initialPage = 0, onClose }) {
  const pages = useMemo(() => buildAlbumPages(album), [album])

  // Add a virtual cover page at index 0 (real pages start at index 1)
  const totalSpreads = 1 + Math.ceil(pages.length / 2)
  // spreadIndex 0 = cover only; 1+ = inside two-page spreads
  const initialSpread = Math.min(totalSpreads - 1, Math.max(1, Math.floor(initialPage / 2) + 1))
  const [spread, setSpread] = useState(initialSpread)
  const dialogRef = useRef(null)
  const touchStartRef = useRef(null)

  const prev = useCallback(() => setSpread((s) => Math.max(0, s - 1)), [])
  const next = useCallback(() => setSpread((s) => Math.min(totalSpreads - 1, s + 1)), [totalSpreads])

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  // Focus trap (basic): focus the dialog on mount
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Lock body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  function onTouchStart(e) {
    touchStartRef.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e) {
    const start = touchStartRef.current
    if (start == null) return
    const end = e.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) > 40) {
      if (delta < 0) next()
      else prev()
    }
    touchStartRef.current = null
  }

  const leftPage = spread === 0 ? null : pages[(spread - 1) * 2]
  const rightPage = spread === 0 ? null : pages[(spread - 1) * 2 + 1]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${album.year} ${album.host} virtual album`}
      ref={dialogRef}
      tabIndex={-1}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-400">
            {album.publisher} {album.official ? '· Official' : '· Pre-Panini era'}
          </p>
          <h3 className="truncate text-lg font-bold text-white">
            {album.year} FIFA World Cup — {album.host}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          ✕ Close
        </button>
      </header>

      {/* Spread area */}
      <div className="relative flex flex-1 items-stretch justify-center overflow-hidden px-2 py-3 sm:px-6">
        <button
          type="button"
          onClick={prev}
          disabled={spread === 0}
          aria-label="Previous page"
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 px-3 py-3 text-xl text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30 sm:left-3"
        >
          ‹
        </button>
        <div className="grid h-full w-full max-w-6xl grid-cols-1 gap-2 md:grid-cols-2">
          {/* Left page or cover */}
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            {spread === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <img
                  src={album.coverImage}
                  alt={`${album.year} album cover`}
                  className="max-h-[60vh] w-auto rounded-lg shadow-xl"
                />
                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    {album.publisher}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">{album.year} · {album.host}</p>
                  <p className="text-sm text-slate-300">🏆 {album.winner}</p>
                </div>
              </div>
            ) : (
              <PageContent page={leftPage} album={album} />
            )}
          </div>
          {/* Right page or tournament info */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl md:block">
            {spread === 0 ? (
              <div className="flex h-full flex-col gap-3 p-6 text-slate-200">
                <h4 className="text-2xl font-bold text-white">About this album</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-slate-400">Publisher</dt>
                  <dd className="font-medium">{album.publisher}</dd>
                  <dt className="text-slate-400">Host</dt>
                  <dd className="font-medium">{album.host}</dd>
                  <dt className="text-slate-400">Champion</dt>
                  <dd className="font-medium text-sky-300">🏆 {album.winner}</dd>
                  {album.runnerUp ? (
                    <>
                      <dt className="text-slate-400">Runner-up</dt>
                      <dd className="font-medium">{album.runnerUp}</dd>
                    </>
                  ) : null}
                  {album.ball ? (
                    <>
                      <dt className="text-slate-400">Official ball</dt>
                      <dd className="font-medium">{album.ball}</dd>
                    </>
                  ) : null}
                  {album.mascot ? (
                    <>
                      <dt className="text-slate-400">Mascot</dt>
                      <dd className="font-medium">{album.mascot}</dd>
                    </>
                  ) : null}
                  <dt className="text-slate-400">Stickers</dt>
                  <dd className="font-medium">{(album.stickerCount ?? 0).toLocaleString()}</dd>
                  <dt className="text-slate-400">Teams</dt>
                  <dd className="font-medium">{(album.teams ?? []).length}</dd>
                </dl>
                {album.notes ? (
                  <p className="mt-2 border-t border-slate-800 pt-3 text-sm leading-relaxed text-slate-300">
                    {album.notes}
                  </p>
                ) : null}
                <p className="mt-auto text-[10px] uppercase tracking-widest text-slate-500">
                  Use ← → keys or swipe to turn pages
                </p>
              </div>
            ) : (
              <PageContent page={rightPage} album={album} />
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={next}
          disabled={spread === totalSpreads - 1}
          aria-label="Next page"
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-800/80 px-3 py-3 text-xl text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30 sm:right-3"
        >
          ›
        </button>
      </div>

      {/* Bottom bar */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
        <span>
          Page {spread === 0 ? 'Cover' : `${(spread - 1) * 2 + 1}–${Math.min(pages.length, (spread - 1) * 2 + 2)}`} of {pages.length}
        </span>
        <span className="hidden sm:inline">
          Sticker artwork is rendered as styled placeholders to respect Panini / FIFA copyright.
        </span>
        <span>
          Spread {spread + 1} / {totalSpreads}
        </span>
      </footer>
    </div>
  )
}

export default VirtualAlbum
