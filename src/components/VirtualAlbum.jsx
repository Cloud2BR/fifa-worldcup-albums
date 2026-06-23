import { useMemo, useState } from 'react'
import { buildAlbumPages, getTeam } from '../utils/stickers'
import stadiumImagesData from '../data/stadiumImages.json'

const STADIUM_MAP = stadiumImagesData.images || {}

function StadiumSticker({ label }) {
  const entry = STADIUM_MAP[label]
  const [failed, setFailed] = useState(false)
  const url = entry?.thumbUrl

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={entry.caption || label}
        title={`${label} — © ${entry.author} (${entry.license})`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  return (
    <svg viewBox="0 0 60 40" className="h-3/4 w-3/4 opacity-40" aria-hidden="true">
      <ellipse cx="30" cy="30" rx="26" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" />
      <ellipse cx="30" cy="26" rx="22" ry="6" fill="none" stroke="#fff" strokeWidth="1" />
      <path d="M4,30 Q30,10 56,30" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

function StickerSlot({ sticker }) {
  const team = sticker.team ? getTeam(sticker.team) : null
  const isShiny = Boolean(sticker.isShiny)
  const isStadium = sticker.kind === 'stadium'
  const isBadge = sticker.kind === 'badge'
  const isPlayer = sticker.kind === 'player'

  const bgStyle = isStadium
    ? { background: '#0f172a' }
    : team
    ? {
        background: isShiny
          ? `linear-gradient(145deg, ${team.primary} 0%, ${team.accent} 42%, ${team.secondary} 100%)`
          : `linear-gradient(160deg, ${team.primary} 0%, ${team.secondary} 100%)`,
      }
    : {
        background: isShiny
          ? 'linear-gradient(145deg, #ca8a04 0%, #fef3c7 45%, #92400e 100%)'
          : 'linear-gradient(160deg, #334155 0%, #0f172a 100%)',
      }

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[8px] border border-amber-900/40 bg-slate-800 shadow-sm">
      <div className="absolute inset-[3px] rounded-[6px]" style={bgStyle} />

      {isShiny && !isStadium ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[6px] opacity-50"
          style={{
            background:
              'linear-gradient(112deg, transparent 28%, rgba(255,255,255,0.65) 45%, transparent 62%)',
          }}
        />
      ) : null}

      {/* Stadium real image */}
      {isStadium ? (
        <div className="absolute inset-[3px] flex items-center justify-center overflow-hidden rounded-[6px]">
          <StadiumSticker label={sticker.label} />
        </div>
      ) : null}

      {/* Player silhouette */}
      {isPlayer ? (
        <div className="absolute inset-0 flex items-end justify-center" aria-hidden="true">
          <svg viewBox="0 0 40 56" className="h-3/4 w-1/2 opacity-25">
            <circle cx="20" cy="11" r="8" fill="currentColor" />
            <path d="M4,56 Q2,34 10,30 L20,28 L30,30 Q38,34 36,56 Z" fill="currentColor" />
            <path d="M10,30 L6,46 M30,30 L34,46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      ) : null}

      {/* Badge shield */}
      {isBadge && team ? (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 44 54" className="h-3/5 w-3/5">
            <path d="M22,2 L42,10 L42,30 Q42,46 22,52 Q2,46 2,30 L2,10 Z"
              fill={team.accent || team.secondary} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
            <text x="22" y="32" textAnchor="middle" fontSize="11" fontWeight="900"
              fill={team.primary} fontFamily="sans-serif">{sticker.team}</text>
          </svg>
        </div>
      ) : null}

      <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[9px] font-bold text-amber-100">
        {String(sticker.number).padStart(3, '0')}
      </span>

      {isPlayer && sticker.position ? (
        <span className="absolute right-1 top-1 rounded bg-white/80 px-1 py-0.5 font-mono text-[8px] font-bold text-slate-900">
          {sticker.position}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 rounded-b-[6px] bg-black/60 px-1.5 py-1">
        <p className="truncate text-[10px] font-semibold leading-tight text-white" title={sticker.label}>
          {sticker.label}
        </p>
      </div>
    </div>
  )
}

function AlbumPage({ album, page, pageNumber, side }) {
  if (!page) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-amber-900/35 bg-[#ece3cd] p-6 text-center text-sm text-slate-600">
        Intentionally left blank
      </div>
    )
  }

  const team = page.team ? getTeam(page.team) : null

  return (
    <section
      className={[
        'relative min-h-[500px] overflow-hidden rounded-xl border border-amber-900/35 bg-[#f3ecd9] p-3 sm:p-4',
        side === 'left' ? 'md:rounded-r-none md:pr-5' : 'md:rounded-l-none md:pl-5',
      ].join(' ')}
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            background:
              'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.75) 0%, transparent 35%), radial-gradient(circle at 80% 80%, rgba(210,180,140,0.35) 0%, transparent 38%)',
          }}
        />
      </div>

      <header className="relative z-10 mb-3 rounded-lg border border-amber-900/35 bg-[#e8dcc0] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-800">
            {page.title}
          </h4>
          {team ? (
            <span
              className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold"
              style={{ background: team.primary, color: team.secondary }}
            >
              {page.team}
            </span>
          ) : null}
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {page.stickers.map((sticker) => (
          <StickerSlot key={`${album.year}-${sticker.number}`} sticker={sticker} />
        ))}
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between border-t border-amber-900/30 pt-2 text-[11px] uppercase tracking-wider text-slate-600">
        <span>{album.year} edition</span>
        <span>Page {pageNumber}</span>
      </div>
    </section>
  )
}

function CoverSpread({ album }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-amber-900/35 bg-[#dfcfab] p-4 shadow-xl sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-0">
        <div className="rounded-xl border border-amber-900/35 bg-gradient-to-b from-[#0b1328] to-[#0f274a] p-6 text-white md:rounded-r-none md:border-r-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-200">FIFA World Cup</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight">Album {album.year}</h3>
          <p className="mt-2 text-sm text-slate-300">Host nation: {album.host}</p>
          <p className="mt-6 text-sm text-slate-300">Publisher: {album.publisher}</p>
          <p className="text-sm text-slate-300">Sticker count: {album.stickerCount}</p>
        </div>

        <div className="rounded-xl border border-amber-900/35 bg-[#f3ecd9] p-6 text-slate-800 md:rounded-l-none md:border-l-0">
          <h4 className="text-lg font-bold uppercase tracking-wide">Tournament Summary</h4>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-600">Champion</dt>
            <dd className="font-semibold">{album.winner}</dd>
            <dt className="text-slate-600">Runner-up</dt>
            <dd className="font-semibold">{album.runnerUp || 'n/a'}</dd>
            <dt className="text-slate-600">Ball</dt>
            <dd className="font-semibold">{album.ball || 'n/a'}</dd>
            <dt className="text-slate-600">Mascot</dt>
            <dd className="font-semibold">{album.mascot || 'n/a'}</dd>
            <dt className="text-slate-600">Teams</dt>
            <dd className="font-semibold">{(album.teams || []).length}</dd>
          </dl>
          {album.notes ? <p className="mt-4 text-sm leading-relaxed text-slate-700">{album.notes}</p> : null}
        </div>
      </div>
    </article>
  )
}

function VirtualAlbum({ album }) {
  const pages = useMemo(() => buildAlbumPages(album, 12), [album])

  const spreads = useMemo(() => {
    const out = []
    for (let i = 0; i < pages.length; i += 2) {
      out.push({ left: pages[i], right: pages[i + 1] ?? null, startIndex: i + 1 })
    }
    return out
  }, [pages])

  return (
    <section className="space-y-5">
      <CoverSpread album={album} />

      {spreads.map((spread, index) => (
        <article
          key={`${album.year}-spread-${index + 1}`}
          className="relative rounded-2xl border border-amber-900/35 bg-[#d7c398] p-2 shadow-xl sm:p-3"
        >
          <div className="pointer-events-none absolute bottom-2 left-1/2 top-2 hidden w-px -translate-x-1/2 bg-amber-900/30 md:block" />

          <div className="grid gap-2 md:grid-cols-2 md:gap-0">
            <AlbumPage album={album} page={spread.left} pageNumber={spread.startIndex} side="left" />
            <AlbumPage album={album} page={spread.right} pageNumber={spread.startIndex + 1} side="right" />
          </div>

          <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-950/70">
            Spread {index + 1} of {spreads.length}
          </p>
        </article>
      ))}
    </section>
  )
}

export default VirtualAlbum
