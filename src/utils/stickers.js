import teamsData from '../data/teams.json'
import winnerSquadsData from '../data/winnerSquads.json'
import tournamentSquadsData from '../data/tournamentSquads.json'

const PLAYER_POSITIONS = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'DF', 'MF', 'FW', 'GK', 'DF', 'MF', 'MF', 'FW']

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function toStickerPosition(position) {
  const value = normalize(position)
  if (value.includes('goal')) return 'GK'
  if (value.includes('def')) return 'DF'
  if (value.includes('mid')) return 'MF'
  if (value.includes('forw') || value.includes('strik') || value.includes('wing')) return 'FW'
  return position || null
}

// Stable pseudo-random generator (mulberry32) so a sticker layout is always the same for a given album
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getTeam(code) {
  return teamsData[code] ?? { name: code, primary: '#1e293b', secondary: '#475569', accent: '#cbd5e1' }
}

/**
 * Build a deterministic sticker list for an album whose total matches album.stickerCount.
 *
 * Layout:
 *   1. Intro / history block (covers, trophy, host nation)        ~ 14 stickers
 *   2. Stadiums                                                  one per stadium
 *   3. Mascot + ball + emblem                                    2–3 stickers
 *   4. Team blocks: each team gets a foil badge + N player slots
 *   5. Closing legends                                            remainder
 */
export function buildAlbumStickers(album) {
  const stickers = []
  let n = 1
  const rng = seeded(album.year * 31 + (album.stickerCount || 0))

  const push = (sticker) => {
    stickers.push({ number: n, albumYear: album.year, ...sticker })
    n += 1
  }

  // 1. Intro / cover / trophy / host
  push({ kind: 'history', label: `${album.year} Official Album Cover`, isShiny: true, team: null, section: 'intro' })
  push({ kind: 'history', label: 'FIFA World Cup Trophy', isShiny: true, team: null, section: 'intro' })
  push({ kind: 'history', label: 'Host: ' + album.host, team: null, section: 'intro' })
  push({ kind: 'history', label: `Champion: ${album.winner}`, isShiny: true, team: album.winner, section: 'intro' })
  if (album.runnerUp) push({ kind: 'history', label: `Runner-up: ${album.runnerUp}`, team: album.runnerUp, section: 'intro' })
  if (album.ball) push({ kind: 'history', label: `Official Ball: ${album.ball}`, isShiny: true, team: null, section: 'intro' })

  // 2. Stadiums
  for (const stadium of album.stadiums ?? []) {
    push({ kind: 'stadium', label: stadium, team: null, section: 'stadium' })
  }

  // 3. Mascot / emblem
  if (album.mascot) {
    push({ kind: 'mascot', label: `Mascot: ${album.mascot}`, isShiny: true, team: null, section: 'intro' })
  }
  push({ kind: 'history', label: 'Tournament Emblem', isShiny: true, team: null, section: 'intro' })
  push({ kind: 'history', label: 'Opening Match Pennant', team: null, section: 'intro' })

  // 4. Teams — distribute remaining stickers across team blocks
  const teams = album.teams ?? []
  const yearSquads = tournamentSquadsData[String(album.year)] ?? {}
  const winnerSquad = winnerSquadsData[String(album.year)]?.players ?? []
  const winnerNameKey = normalize(winnerSquadsData[String(album.year)]?.winner || album.winner)
  const winnerCode = teams.find((code) => normalize(getTeam(code).name) === winnerNameKey) ?? null

  // Reserve a few stickers for the closing legends section
  const reservedLegends = Math.min(8, Math.max(2, Math.round((album.stickerCount ?? 200) * 0.02)))
  const remainingForTeams = Math.max(0, (album.stickerCount ?? 200) - stickers.length - reservedLegends)
  // Each team always gets a foil badge (1 sticker)
  const perTeamTotal = teams.length > 0 ? Math.floor(remainingForTeams / teams.length) : 0
  const playerSlotsPerTeam = Math.max(1, perTeamTotal - 1)

  for (const code of teams) {
    const team = getTeam(code)
    const isWinnerTeam = code === winnerCode
    const teamSquad = Array.isArray(yearSquads[code]) ? yearSquads[code] : []
    push({ kind: 'badge', label: `${team.name} — Team Badge`, isShiny: true, team: code, section: 'team' })
    const desiredPlayers = Math.max(
      playerSlotsPerTeam,
      teamSquad.length,
      isWinnerTeam ? winnerSquad.length : 0,
    )

    for (let i = 0; i < desiredPlayers; i += 1) {
      const realTeamPlayer = teamSquad[i] || null
      const realWinnerPlayer = isWinnerTeam ? winnerSquad[i] : null
      const preferredPlayer = realTeamPlayer || realWinnerPlayer
      const pos = toStickerPosition(preferredPlayer?.position) || PLAYER_POSITIONS[i % PLAYER_POSITIONS.length]
      const shirtNumber = i + 1
      push({
        kind: 'player',
        label: preferredPlayer
          ? `${preferredPlayer.name}${preferredPlayer.captain ? ' ©' : ''}`
          : `${team.name} #${shirtNumber}`,
        position: pos,
        shirtNumber: preferredPlayer?.shirtNumber ?? shirtNumber,
        team: code,
        isShiny: false,
        section: 'team',
      })
    }
  }

  // 5. Closing legends — fill remaining slots
  const legends = [
    'Top Scorer · Golden Boot',
    'Best Player · Golden Ball',
    'Best Goalkeeper · Golden Glove',
    'Best Young Player',
    'Final Match Action',
    'Trophy Lift',
    'Tournament Highlights',
    'All-Star XI',
    'Most Goals in a Match',
    'Fair Play Award',
  ]
  let legendIdx = 0
  while (stickers.length < (album.stickerCount ?? stickers.length)) {
    const label = legends[legendIdx % legends.length]
    push({ kind: 'history', label, isShiny: legendIdx < 4, team: null, section: 'closing' })
    legendIdx += 1
    if (legendIdx > 200) break // safety
  }

  // Randomly promote a few player stickers to shiny variants for visual variety
  for (const s of stickers) {
    if (s.kind === 'player' && rng() < 0.04) {
      s.isShiny = true
    }
  }

  return stickers
}

/**
 * Group an album's stickers into "pages" suitable for spread navigation.
 * Returns an array of pages; each page is { title, kind, stickers: [...] }.
 */
export function buildAlbumPages(album, stickersPerPage = 8) {
  const stickers = buildAlbumStickers(album)
  const pages = []

  // Special opening pages
  const intro = stickers.filter((s) => s.section === 'intro')
  const stadiums = stickers.filter((s) => s.section === 'stadium')
  const teamStickers = stickers.filter((s) => s.section === 'team')
  const closing = stickers.filter((s) => s.section === 'closing')

  // Ensure first page is visually complete: fill remaining intro slots with early stadium stickers.
  let stadiumStart = 0
  let introPageStickers = [...intro]
  if (introPageStickers.length < stickersPerPage && stadiums.length > 0) {
    const needed = stickersPerPage - introPageStickers.length
    introPageStickers = introPageStickers.concat(stadiums.slice(0, needed))
    stadiumStart = Math.min(needed, stadiums.length)
  }

  // Intro page
  if (introPageStickers.length) {
    pages.push({ title: `${album.year} ${album.host} — Tournament`, kind: 'intro', stickers: introPageStickers })
  }
  // Stadiums page(s)
  for (let i = stadiumStart; i < stadiums.length; i += stickersPerPage) {
    pages.push({
      title: 'Stadiums',
      kind: 'stadium',
      stickers: stadiums.slice(i, i + stickersPerPage),
    })
  }
  // Team pages — one team per page (badge + players)
  const byTeam = new Map()
  for (const s of teamStickers) {
    if (!byTeam.has(s.team)) byTeam.set(s.team, [])
    byTeam.get(s.team).push(s)
  }
  for (const [code, list] of byTeam) {
    const team = getTeam(code)
    // Each team may span multiple pages if it has many stickers
    for (let i = 0; i < list.length; i += stickersPerPage) {
      const chunk = list.slice(i, i + stickersPerPage)
      const pageNo = Math.floor(i / stickersPerPage) + 1
      const totalPages = Math.ceil(list.length / stickersPerPage)
      pages.push({
        title: totalPages > 1 ? `${team.name} (${pageNo}/${totalPages})` : team.name,
        kind: 'team',
        team: code,
        stickers: chunk,
      })
    }
  }
  // Closing
  if (closing.length) {
    for (let i = 0; i < closing.length; i += stickersPerPage) {
      pages.push({
        title: 'Tournament Honours',
        kind: 'closing',
        stickers: closing.slice(i, i + stickersPerPage),
      })
    }
  }

  return pages
}

/**
 * Build a flat searchable index across all albums.
 */
export function buildStickerIndex(albums) {
  const out = []
  for (const album of albums) {
    const pages = buildAlbumPages(album)
    pages.forEach((page, pageIndex) => {
      for (const sticker of page.stickers) {
        out.push({
          ...sticker,
          albumYear: album.year,
          host: album.host,
          publisher: album.publisher,
          pageIndex,
          pageTitle: page.title,
        })
      }
    })
  }
  return out
}
