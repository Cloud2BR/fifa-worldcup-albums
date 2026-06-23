import teamsData from '../data/teams.json'

const PLAYER_POSITIONS = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'DF', 'MF', 'FW', 'GK', 'DF', 'MF', 'MF', 'FW']

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
  push({ kind: 'history', label: `${album.year} Official Album Cover`, isShiny: true, team: null })
  push({ kind: 'history', label: 'FIFA World Cup Trophy', isShiny: true, team: null })
  push({ kind: 'history', label: 'Host: ' + album.host, team: null })
  push({ kind: 'history', label: `Champion: ${album.winner}`, isShiny: true, team: album.winner })
  if (album.runnerUp) push({ kind: 'history', label: `Runner-up: ${album.runnerUp}`, team: album.runnerUp })
  if (album.ball) push({ kind: 'history', label: `Official Ball: ${album.ball}`, isShiny: true, team: null })

  // 2. Stadiums
  for (const stadium of album.stadiums ?? []) {
    push({ kind: 'stadium', label: stadium, team: null })
  }

  // 3. Mascot / emblem
  if (album.mascot) {
    push({ kind: 'mascot', label: `Mascot: ${album.mascot}`, isShiny: true, team: null })
  }
  push({ kind: 'history', label: 'Tournament Emblem', isShiny: true, team: null })
  push({ kind: 'history', label: 'Opening Match Pennant', team: null })

  // 4. Teams — distribute remaining stickers across team blocks
  const teams = album.teams ?? []
  // Reserve a few stickers for the closing legends section
  const reservedLegends = Math.min(8, Math.max(2, Math.round((album.stickerCount ?? 200) * 0.02)))
  const remainingForTeams = Math.max(0, (album.stickerCount ?? 200) - stickers.length - reservedLegends)
  // Each team always gets a foil badge (1 sticker)
  const perTeamTotal = teams.length > 0 ? Math.floor(remainingForTeams / teams.length) : 0
  const playerSlotsPerTeam = Math.max(1, perTeamTotal - 1)

  for (const code of teams) {
    const team = getTeam(code)
    push({ kind: 'badge', label: `${team.name} — Team Badge`, isShiny: true, team: code })
    for (let i = 0; i < playerSlotsPerTeam; i += 1) {
      const pos = PLAYER_POSITIONS[i % PLAYER_POSITIONS.length]
      const shirtNumber = i + 1
      push({
        kind: 'player',
        label: `${team.name} #${shirtNumber}`,
        position: pos,
        shirtNumber,
        team: code,
        isShiny: false,
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
    push({ kind: 'history', label, isShiny: legendIdx < 4, team: null })
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
  const intro = stickers.filter((s) => ['history', 'mascot'].includes(s.kind) && (s.label || '').match(/(Cover|Trophy|Host|Champion|Runner|Ball|Mascot|Emblem|Pennant)/i))
  const stadiums = stickers.filter((s) => s.kind === 'stadium')
  const teamStickers = stickers.filter((s) => s.kind === 'badge' || s.kind === 'player')
  const closing = stickers.filter((s) => s.kind === 'history' && !intro.includes(s))

  // Intro page
  if (intro.length) {
    pages.push({ title: `${album.year} ${album.host} — Tournament`, kind: 'intro', stickers: intro })
  }
  // Stadiums page(s)
  for (let i = 0; i < stadiums.length; i += stickersPerPage) {
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
