import { useEffect, useMemo, useState } from 'react'
import { buildAlbumPages, getTeam } from '../utils/stickers'
import stadiumImagesData from '../data/stadiumImages.json'
import teamImagesData from '../data/teamImages.json'
import playerImagesData from '../data/playerImages.json'
import entityImagesData from '../data/entityImages.json'

const STADIUM_MAP = stadiumImagesData.images || {}
const TEAM_IMAGE_MAP = teamImagesData.images || {}
const PLAYER_IMAGE_MAP = playerImagesData.images || {}
const ENTITY_IMAGE_MAP = entityImagesData.images || {}

function slugifyAssetName(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SONG_BY_YEAR = {
  2022: { title: 'Hayya Hayya (Better Together)' },
  2018: { title: 'Live It Up' },
  2014: { title: 'We Are One (Ole Ola)' },
  2010: { title: 'Waka Waka (This Time for Africa)' },
  2006: { title: 'The Time of Our Lives' },
  2002: { title: 'Boom' },
  1998: { title: 'La Copa de la Vida' },
  1994: { title: 'Gloryland' },
  1990: { title: "Un'estate italiana" },
}

const LOCAL_SONG_PREVIEWS = {
  2022: '/audio/songs/2022-preview.wav',
  2018: '/audio/songs/2018-preview.wav',
  2014: '/audio/songs/2014-preview.wav',
  2010: '/audio/songs/2010-preview.wav',
  2006: '/audio/songs/2006-preview.wav',
  2002: '/audio/songs/2002-preview.wav',
  1998: '/audio/songs/1998-preview.wav',
  1994: '/audio/songs/1994-preview.wav',
  1990: '/audio/songs/1990-preview.wav',
}

function LocalPreviewCard({ title, src, fallbackLabel, imageClassName = 'object-cover' }) {
  return (
    <div className="overflow-hidden rounded-lg border border-amber-900/35 bg-[#efe6d0]">
      <div className="border-b border-amber-900/25 bg-[#e8dcc0] px-2 py-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{title}</p>
      </div>
      <div className="relative h-32 w-full bg-[#d9ccb1]">
        {src ? (
          <img src={src} alt={title} loading="lazy" className={`h-full w-full object-center ${imageClassName}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
            <span className="text-xs font-semibold text-slate-600">{fallbackLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SongPlayer({ album }) {
  const meta = SONG_BY_YEAR[album.year] || { title: `Official song/anthem ${album.year}` }
  const audioSrc = LOCAL_SONG_PREVIEWS[album.year] || null
  const [audioMissing, setAudioMissing] = useState(false)

  return (
    <div className="rounded-lg border border-amber-900/35 bg-[#efe6d0] p-2">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-700">Official Song</p>
      <div className="rounded-md border border-amber-900/30 bg-[#d9ccb1] p-3">
        <p className="text-sm font-semibold text-slate-700">{meta.title}</p>
        <p className="mt-1 text-xs text-slate-600">Playable local preview hosted in this repository (GitHub Pages friendly).</p>
        {audioSrc && !audioMissing ? (
          <audio
            className="mt-3 w-full"
            controls
            preload="none"
            onError={() => setAudioMissing(true)}
          >
            <source src={audioSrc} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
        ) : (
          <p className="mt-3 text-xs text-slate-600">No local preview audio available for this year.</p>
        )}
      </div>
    </div>
  )
}

function cleanPlayerName(name) {
  return String(name ?? '').replace(/\s+©$/, '').trim()
}

function slugifyPlayerName(name) {
  return cleanPlayerName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildPlayerKey(sticker) {
  const year = String(sticker?.albumYear || '')
  const team = String(sticker?.team || '')
  const slug = slugifyPlayerName(sticker?.label)
  if (!year || !team || !slug) return null
  return `${year}:${team}:${slug}`
}

function getEntityEntry(sticker) {
  const year = String(sticker?.albumYear || '')
  const label = String(sticker?.label || '')

  if (!year && !label) return null
  if (sticker?.kind === 'mascot') return ENTITY_IMAGE_MAP[`${year}:mascot`] || null
  if (label.includes('Official Ball:')) return ENTITY_IMAGE_MAP[`${year}:ball`] || null
  if (label.includes('Tournament Emblem')) return ENTITY_IMAGE_MAP[`${year}:emblem`] || null
  if (label.includes('Trophy')) return ENTITY_IMAGE_MAP['global:trophy'] || null
  return null
}

function getEntityImageSources(entry) {
  const out = []
  if (entry?.file) out.push(`/images/entities/${entry.file}`)
  if (entry?.thumbUrl) out.push(entry.thumbUrl)
  return out.filter((value, index, arr) => value && arr.indexOf(value) === index)
}

function getInitials(name) {
  const clean = cleanPlayerName(name)
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function StadiumSticker({ label }) {
  const entry = STADIUM_MAP[label]
  const slug = slugifyAssetName(label)
  const fileName = entry?.file || `${slug}.jpg`
  const sources = [
    `/images/stadiums/${fileName}`,
    `/images/stadiums/${slug}.jpg`,
    `/images/stadiums/${slug}.png`,
    `/images/stadiums/${slug}.webp`,
    `/images/stadiums/${slug}.svg`,
  ].filter((value, index, arr) => value && arr.indexOf(value) === index)
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [label])

  if (sources[sourceIndex]) {
    return (
      <img
        src={sources[sourceIndex]}
        alt={entry.caption || label}
        title={`${label} - © ${entry?.author || 'Unknown'} (${entry?.license || 'Unknown'})`}
        loading="lazy"
        onError={() => setSourceIndex((idx) => idx + 1)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 50%' }}
      />
    )
  }
  return <div className="text-[10px] font-semibold text-white/85">Image unavailable</div>
}

function PlayerStickerAvatar({ name, teamCode }) {
  const team = teamCode ? getTeam(teamCode) : null
  const initials = getInitials(name)

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: team
          ? `radial-gradient(circle at 50% 30%, ${team.accent}44 0%, ${team.primary}cc 60%, ${team.secondary}dd 100%)`
          : 'radial-gradient(circle at 50% 30%, #94a3b844 0%, #334155cc 60%, #0f172add 100%)',
      }}
      aria-hidden="true"
    >
      <div className="rounded-full border border-white/50 bg-black/25 px-3 py-2 text-center backdrop-blur-[1px]">
        <span className="text-lg font-black tracking-wide text-white">{initials}</span>
      </div>
    </div>
  )
}

function PlayerStickerImage({ sticker }) {
  const key = buildPlayerKey(sticker)
  const entry = key ? PLAYER_IMAGE_MAP[key] : null
  const sources = [
    entry?.file ? `/images/players/${entry.file}` : null,
    entry?.thumbUrl || null,
  ].filter((value, index, arr) => value && arr.indexOf(value) === index)
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [key])

  if (!sources[sourceIndex]) {
    return <PlayerStickerAvatar name={sticker.label} teamCode={sticker.team} />
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={cleanPlayerName(sticker.label)}
      loading="lazy"
      onError={() => setSourceIndex((idx) => idx + 1)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: '50% 26%' }}
    />
  )
}

function EntityStickerImage({ sticker }) {
  const entry = getEntityEntry(sticker)
  const sources = getEntityImageSources(entry)
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [sticker?.albumYear, sticker?.label, sticker?.kind])

  if (!sources[sourceIndex]) return null

  return (
    <img
      src={sources[sourceIndex]}
      alt={sticker.label}
      title={entry ? `${sticker.label} - © ${entry.author || 'Unknown'} (${entry.license || 'Unknown'})` : sticker.label}
      loading="lazy"
      onError={() => setSourceIndex((idx) => idx + 1)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: '50% 50%' }}
    />
  )
}

function TeamImage({ teamCode, alt }) {
  const entry = TEAM_IMAGE_MAP[teamCode]
  const file = entry?.file
  if (!file) return null

  return (
    <img
      src={`/images/teams/${file}`}
      alt={alt}
      loading="lazy"
      className="h-8 w-8 shrink-0 rounded border border-amber-900/40 bg-white/90 object-cover"
      onError={(event) => {
        event.currentTarget.style.display = 'none'
      }}
    />
  )
}

function StickerSlot({ sticker }) {
  const team = sticker.team ? getTeam(sticker.team) : null
  const isShiny = Boolean(sticker.isShiny)
  const isStadium = sticker.kind === 'stadium'
  const isBadge = sticker.kind === 'badge'
  const isPlayer = sticker.kind === 'player'
  const hasRealPlayerName = isPlayer && !/#\d+$/i.test(sticker.label)
  const isEntityHistory = sticker.kind === 'mascot' || sticker.kind === 'history'
  const topBadge = isStadium
    ? 'STADIUM'
    : isPlayer
    ? 'PLAYER'
    : isBadge
    ? 'TEAM'
    : 'SPECIAL'

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

      {/* Local player avatar: no runtime external lookups */}
      {isPlayer && hasRealPlayerName ? (
        <div className="absolute inset-[3px] overflow-hidden rounded-[6px]" aria-hidden="true">
          <PlayerStickerImage sticker={sticker} />
        </div>
      ) : null}

      {isEntityHistory ? (
        <div className="absolute inset-[3px] overflow-hidden rounded-[6px]" aria-hidden="true">
          <EntityStickerImage sticker={sticker} />
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
        {topBadge}
      </span>

      {isPlayer && sticker.position ? (
        <span className="absolute right-1 top-1 rounded bg-white/80 px-1 py-0.5 font-mono text-[8px] font-bold text-slate-900">
          {sticker.position}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 rounded-b-[6px] bg-black/60 px-1.5 py-1">
        <p className="text-[10px] font-semibold leading-tight text-white" title={sticker.label}>
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
          <div className="flex min-w-0 items-center gap-2">
            {page.team ? <TeamImage teamCode={page.team} alt={`${team?.name || page.team} image`} /> : null}
            <h4 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-800">
              {page.title}
            </h4>
          </div>
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
  const coverSrc = album.coverImage ? album.coverImage.replace(/^\.\//, '/') : null
  const logoSrc = '/images/logos/fifa-logo.svg'
  const firstStadium = (album.stadiums || [])[0]
  const firstStadiumEntry = firstStadium ? STADIUM_MAP[firstStadium] : null
  const firstStadiumFile = firstStadium
    ? (firstStadiumEntry?.file || `${slugifyAssetName(firstStadium)}.jpg`)
    : null
  const firstStadiumSrc = firstStadiumFile ? `/images/stadiums/${firstStadiumFile}` : null
  const firstStadiumFallbackSrc = firstStadiumEntry?.thumbUrl || null
  const [coverStadiumSrc, setCoverStadiumSrc] = useState(firstStadiumSrc || firstStadiumFallbackSrc || null)
  const ballEntry = ENTITY_IMAGE_MAP[`${album.year}:ball`] || null
  const mascotEntry = ENTITY_IMAGE_MAP[`${album.year}:mascot`] || null
  const emblemEntry = ENTITY_IMAGE_MAP[`${album.year}:emblem`] || null
  const trophyEntry = ENTITY_IMAGE_MAP['global:trophy'] || null
  const ballSrc = ballEntry?.file ? `/images/entities/${ballEntry.file}` : ballEntry?.thumbUrl || null
  const mascotSrc = mascotEntry?.file ? `/images/entities/${mascotEntry.file}` : mascotEntry?.thumbUrl || null
  const emblemSrc = emblemEntry?.file ? `/images/entities/${emblemEntry.file}` : emblemEntry?.thumbUrl || logoSrc
  const trophySrc = trophyEntry?.file ? `/images/entities/${trophyEntry.file}` : trophyEntry?.thumbUrl || null

  useEffect(() => {
    setCoverStadiumSrc(firstStadiumSrc || firstStadiumFallbackSrc || null)
  }, [firstStadiumSrc, firstStadiumFallbackSrc])

  return (
    <article className="relative overflow-hidden rounded-2xl border border-amber-900/35 bg-[#dfcfab] p-4 shadow-xl sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-0">
        <div className="rounded-xl border border-amber-900/35 bg-gradient-to-b from-[#0b1328] to-[#0f274a] p-6 text-white md:rounded-r-none md:border-r-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-200">FIFA World Cup</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight">Album {album.year}</h3>
          <p className="mt-2 text-sm text-slate-300">Host nation: {album.host}</p>
          {coverSrc ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-white/20 bg-white/10">
              <img
                src={coverSrc}
                alt={`${album.year} album cover`}
                loading="lazy"
                className="h-36 w-full object-contain object-center"
              />
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-white/15 bg-white/10 p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Cover</p>
              <p className="mt-1 text-sm font-semibold text-white">1</p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Logo</p>
              <p className="mt-1 text-sm font-semibold text-white">1</p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-300">Stadiums</p>
              <p className="mt-1 text-sm font-semibold text-white">{(album.stadiums || []).length}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="overflow-hidden rounded-md border border-white/20 bg-white/10 p-1">
              {coverSrc ? (
                <img src={coverSrc} alt="Cover asset" className="h-14 w-full object-contain object-center" />
              ) : (
                <div className="flex h-14 items-center justify-center text-[10px] text-slate-300">No cover</div>
              )}
            </div>
            <div className="overflow-hidden rounded-md border border-white/20 bg-white/10 p-1">
              <img src={logoSrc} alt="Logo asset" className="h-14 w-full object-contain object-center" />
            </div>
            <div className="overflow-hidden rounded-md border border-white/20 bg-white/10 p-1">
              {coverStadiumSrc ? (
                <img
                  src={coverStadiumSrc}
                  alt={firstStadium || 'Stadium asset'}
                  loading="lazy"
                  className="h-14 w-full object-cover object-center"
                  onError={(event) => {
                    if (coverStadiumSrc !== firstStadiumFallbackSrc && firstStadiumFallbackSrc) {
                      setCoverStadiumSrc(firstStadiumFallbackSrc)
                    } else {
                      event.currentTarget.style.display = 'none'
                    }
                  }}
                />
              ) : (
                <div className="flex h-14 items-center justify-center text-[10px] text-slate-300">No stadium</div>
              )}
            </div>
          </div>

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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LocalPreviewCard
              title="Tournament Logo"
              src={emblemSrc}
              fallbackLabel="Local logo preview"
              imageClassName="object-contain"
            />
            <LocalPreviewCard
              title="Official Ball"
              src={ballSrc}
              fallbackLabel={album.ball || 'Ball name unavailable'}
            />
            <LocalPreviewCard
              title="Mascot"
              src={mascotSrc}
              fallbackLabel={album.mascot || 'Mascot unavailable'}
            />
            <LocalPreviewCard
              title="Trophy"
              src={trophySrc}
              fallbackLabel="FIFA World Cup Trophy"
            />
          </div>

          <div className="mt-4">
            <SongPlayer album={album} />
          </div>

          {album.notes ? <p className="mt-4 text-sm leading-relaxed text-slate-700">{album.notes}</p> : null}
        </div>
      </div>
    </article>
  )
}

function VirtualAlbum({ album }) {
  const pages = useMemo(() => buildAlbumPages(album, 12), [album])
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [flipDirection, setFlipDirection] = useState('next')

  const spreads = useMemo(() => {
    const out = []
    for (let i = 0; i < pages.length; i += 2) {
      out.push({ left: pages[i], right: pages[i + 1] ?? null, startIndex: i + 1 })
    }
    return out
  }, [pages])

  useEffect(() => {
    setSpreadIndex(0)
  }, [album.year])

  const maxIndex = Math.max(0, spreads.length - 1)
  const activeSpread = spreads[spreadIndex] ?? null

  const getSpreadJumpLabel = (spread) => {
    if (!spread) return 'Jump'
    if (spread.left?.team) return spread.left.team
    if (spread.right?.team) return spread.right.team
    if (spread.left?.kind === 'stadium' || spread.right?.kind === 'stadium') return 'STD'
    if (spread.left?.kind === 'intro' || spread.right?.kind === 'intro') return 'INT'
    if (spread.left?.kind === 'closing' || spread.right?.kind === 'closing') return 'CLS'
    return 'SEC'
  }

  const spreadOptions = useMemo(
    () => spreads.map((spread, idx) => ({
      idx,
      label: `${getSpreadJumpLabel(spread)} · ${spread.startIndex}-${spread.startIndex + 1}`,
    })),
    [spreads],
  )

  const markerIndexes = useMemo(
    () => spreads.map((_, idx) => idx),
    [spreads],
  )

  const stadiumReferences = useMemo(
    () =>
      (album.stadiums ?? [])
        .map((label) => {
          const entry = STADIUM_MAP[label]
          if (!entry) return null
          return {
            label,
            author: entry.author || 'Unknown',
            license: entry.license || 'Unknown',
            url: entry.thumbUrl || null,
          }
        })
        .filter(Boolean),
    [album],
  )

  const entityReferences = useMemo(() => {
    const keys = [`${album.year}:ball`, `${album.year}:mascot`, `${album.year}:emblem`, 'global:trophy']
    return keys
      .map((key) => {
        const entry = ENTITY_IMAGE_MAP[key]
        if (!entry) return null
        return {
          key,
          label: entry.caption || key,
          author: entry.author || 'Unknown',
          license: entry.license || 'Unknown',
          url: entry.sourceUrl || entry.thumbUrl || null,
        }
      })
      .filter(Boolean)
  }, [album.year])

  const playerImageStats = useMemo(() => {
    const prefix = `${album.year}:`
    let total = 0
    let withImage = 0
    for (const [key, entry] of Object.entries(PLAYER_IMAGE_MAP)) {
      if (!key.startsWith(prefix)) continue
      total += 1
      if (entry?.file || entry?.thumbUrl) withImage += 1
    }
    return { total, withImage }
  }, [album.year])

  const goPrev = () => {
    setFlipDirection('prev')
    setSpreadIndex((idx) => Math.max(0, idx - 1))
  }

  const goNext = () => {
    setFlipDirection('next')
    setSpreadIndex((idx) => Math.min(maxIndex, idx + 1))
  }

  return (
    <section className="space-y-5">
      <CoverSpread album={album} />

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-100">Virtual Album Viewer</h4>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={spreadIndex}
              onChange={(event) => setSpreadIndex(Number(event.target.value))}
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
              aria-label="Jump to album section"
            >
              {spreadOptions.map((opt) => (
                <option key={opt.idx} value={opt.idx}>{opt.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={goPrev}
              disabled={spreadIndex === 0}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous pages
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={spreadIndex === maxIndex}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next pages →
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Flip like a real album: each move advances 2 pages ({activeSpread?.startIndex ?? 1}–{(activeSpread?.startIndex ?? 1) + 1}).
        </p>

        <input
          type="range"
          min={0}
          max={maxIndex}
          value={spreadIndex}
          onChange={(event) => {
            const next = Number(event.target.value)
            setFlipDirection(next >= spreadIndex ? 'next' : 'prev')
            setSpreadIndex(next)
          }}
          className="mt-3 w-full accent-amber-500"
          aria-label="Album spread navigator"
        />

        <div className="mt-2 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
          {markerIndexes.map((idx) => {
            const spread = spreads[idx]
            const label = getSpreadJumpLabel(spread)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFlipDirection(idx >= spreadIndex ? 'next' : 'prev')
                  setSpreadIndex(idx)
                }}
                className={[
                  'rounded px-2 py-1 text-[10px] font-semibold whitespace-nowrap transition',
                  spreadIndex === idx ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                ].join(' ')}
                title={`${label} · pages ${spread?.startIndex ?? 1}-${(spread?.startIndex ?? 1) + 1}`}
              >
                {label}
              </button>
            )
          })}
          </div>
        </div>

      </section>

      {activeSpread ? (
        <article
          key={`${album.year}-spread-${spreadIndex + 1}`}
          className={[
            'relative rounded-2xl border border-amber-900/35 bg-[#d7c398] p-2 shadow-xl transition-all duration-300 sm:p-3',
            flipDirection === 'next' ? 'animate-[pulse_220ms_ease-out]' : 'animate-[pulse_220ms_ease-out]',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={spreadIndex === 0}
            aria-label="Previous spread"
            className="absolute -left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-900/40 bg-[#f3ecd9]/95 px-2 py-1 text-lg font-bold text-slate-700 shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={spreadIndex === maxIndex}
            aria-label="Next spread"
            className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-900/40 bg-[#f3ecd9]/95 px-2 py-1 text-lg font-bold text-slate-700 shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>

          <div className="pointer-events-none absolute bottom-2 left-1/2 top-2 hidden w-px -translate-x-1/2 bg-amber-900/30 md:block" />

          <div className="grid gap-2 md:grid-cols-2 md:gap-0">
            <AlbumPage album={album} page={activeSpread.left} pageNumber={activeSpread.startIndex} side="left" />
            <AlbumPage album={album} page={activeSpread.right} pageNumber={activeSpread.startIndex + 1} side="right" />
          </div>

          <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-950/70">
            Spread {spreadIndex + 1} of {spreads.length}
          </p>
        </article>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
        <h4 className="text-sm font-semibold text-slate-100">Image & Media References</h4>

        <p className="mt-2 text-slate-400">
          Visual previews in this album use real images from local repository assets and curated stadium photo URLs.
        </p>
        <p className="mt-1 text-slate-400">
          Squad names by tournament/team are sourced from the World Cup dataset by jfjelstul/worldcup.
        </p>
        <p className="mt-1 text-slate-400">
          Official song information is shown from local metadata (no external media search during page load).
        </p>

        {stadiumReferences.length > 0 ? (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Stadium image credits
            </p>
            <ul className="space-y-1">
              {stadiumReferences.map((ref) => (
                <li key={ref.label}>
                  <span className="font-semibold text-slate-200">{ref.label}</span>
                  <span className="text-slate-400"> — © {ref.author} ({ref.license})</span>
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-sky-300 hover:text-sky-200"
                    >
                      source
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {entityReferences.length > 0 ? (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Ball, mascot, emblem and trophy credits
            </p>
            <ul className="space-y-1">
              {entityReferences.map((ref) => (
                <li key={ref.key}>
                  <span className="font-semibold text-slate-200">{ref.label}</span>
                  <span className="text-slate-400"> — © {ref.author} ({ref.license})</span>
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-sky-300 hover:text-sky-200"
                    >
                      source
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-3 text-slate-400">
          Player photo coverage for {album.year}: {playerImageStats.withImage}/{playerImageStats.total} mapped entries.
        </p>
      </section>
    </section>
  )
}

export default VirtualAlbum
