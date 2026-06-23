import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const SQUADS_URL = 'https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/squads.csv'

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

const ALIASES = {
  westgermany: ['germanyfr', 'frg', 'germany'],
  germany: ['germanyfr', 'westgermany', 'frg', 'ger'],
  unitedstates: ['usa', 'unitedstatesofamerica'],
  southkorea: ['korearepublic', 'koreasouth'],
  northkorea: ['koreadpr', 'koreanorth'],
  iran: ['iriran', 'iranislamicrepublic'],
  chinapr: ['china'],
  cotedivoire: ['ivorycoast'],
  dutcheastindies: ['indonesia'],
  sovietunion: ['ussr'],
  republicofireland: ['ireland'],
  serbiaandmontenegro: ['serbiamontenegro'],
  trinidadandtobago: ['trinidadtobago'],
  uae: ['unitedarabemirates'],
  czechrepublic: ['czechia'],
}

function parseCsvLine(line) {
  const cols = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (ch === ',' && !inQuotes) {
      cols.push(value)
      value = ''
      continue
    }

    value += ch
  }

  cols.push(value)
  return cols
}

function findHeaderIndex(header, names) {
  for (const name of names) {
    const idx = header.indexOf(name)
    if (idx !== -1) return idx
  }
  return -1
}

function extractYear(row, yearIdx, tournamentNameIdx) {
  if (yearIdx >= 0) {
    const y = Number(row[yearIdx])
    if (Number.isFinite(y)) return y
  }
  if (tournamentNameIdx >= 0) {
    const value = row[tournamentNameIdx] || ''
    const match = String(value).match(/(19\d{2}|20\d{2})/)
    if (match) return Number(match[1])
  }
  return null
}

function resolveTeam(targetName, yearTeams) {
  const targetNorm = normalize(targetName)
  const aliasNorms = ALIASES[targetNorm] ?? []

  for (const team of yearTeams) {
    const teamNorm = normalize(team)
    if (teamNorm === targetNorm) return team
    if (aliasNorms.includes(teamNorm)) return team
  }

  for (const team of yearTeams) {
    const teamNorm = normalize(team)
    if (teamNorm.includes(targetNorm) || targetNorm.includes(teamNorm)) return team
  }

  return null
}

async function main() {
  const [teamsRaw, albumsRaw] = await Promise.all([
    readFile(path.join(root, 'src', 'data', 'teams.json'), 'utf8'),
    readFile(path.join(root, 'src', 'data', 'albums.json'), 'utf8'),
  ])

  const teams = JSON.parse(teamsRaw)
  const albums = JSON.parse(albumsRaw)

  const response = await fetch(SQUADS_URL)
  if (!response.ok) {
    throw new Error(`Failed to download squads CSV: ${response.status}`)
  }

  const csv = await response.text()
  const lines = csv.trim().split(/\r?\n/)
  const header = parseCsvLine(lines[0])
  const yearIdx = findHeaderIndex(header, ['year', 'tournament_year'])
  const tournamentNameIdx = findHeaderIndex(header, ['tournament_name'])
  const teamIdx = findHeaderIndex(header, ['team_name', 'team'])
  const playerIdx = findHeaderIndex(header, ['player_name', 'name'])
  const givenIdx = findHeaderIndex(header, ['given_name'])
  const familyIdx = findHeaderIndex(header, ['family_name'])
  const posIdx = findHeaderIndex(header, ['position', 'player_position', 'position_name', 'position_code'])
  const shirtIdx = findHeaderIndex(header, ['shirt_number', 'squad_number', 'number'])

  if (teamIdx === -1 || posIdx === -1 || (yearIdx === -1 && tournamentNameIdx === -1)) {
    throw new Error(`Expected columns not found in squads.csv. Header columns: ${header.join(', ')}`)
  }

  const yearTeamPlayers = {}

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i])
    const year = extractYear(row, yearIdx, tournamentNameIdx)
    const teamName = row[teamIdx]
    const playerName = playerIdx >= 0
      ? row[playerIdx]
      : [row[givenIdx] || '', row[familyIdx] || ''].join(' ').trim()
    const position = row[posIdx] || null
    const shirt = shirtIdx >= 0 ? Number(row[shirtIdx]) : null

    if (!Number.isFinite(year) || !teamName || !playerName) continue
    if (!yearTeamPlayers[year]) yearTeamPlayers[year] = {}
    if (!yearTeamPlayers[year][teamName]) yearTeamPlayers[year][teamName] = new Map()

    const key = normalize(playerName)
    if (!yearTeamPlayers[year][teamName].has(key)) {
      yearTeamPlayers[year][teamName].set(key, {
        name: playerName,
        position,
        shirtNumber: Number.isFinite(shirt) && shirt > 0 ? shirt : null,
      })
    }
  }

  const output = {}
  const missing = []

  for (const album of albums) {
    const year = album.year
    const yearBucket = yearTeamPlayers[year] ?? {}
    const yearTeams = Object.keys(yearBucket)

    output[String(year)] = {}

    for (const code of album.teams ?? []) {
      const localTeamName = teams[code]?.name ?? code
      const resolvedTeamName = resolveTeam(localTeamName, yearTeams)

      if (!resolvedTeamName) {
        output[String(year)][code] = []
        missing.push(`${year}:${code}:${localTeamName}`)
        continue
      }

      const players = [...yearBucket[resolvedTeamName].values()].sort((a, b) => {
        const aShirt = a.shirtNumber ?? 999
        const bShirt = b.shirtNumber ?? 999
        if (aShirt !== bShirt) return aShirt - bShirt
        return a.name.localeCompare(b.name)
      })

      output[String(year)][code] = players
    }
  }

  await writeFile(
    path.join(root, 'src', 'data', 'tournamentSquads.json'),
    JSON.stringify(output, null, 2) + '\n',
    'utf8',
  )

  console.log(`Generated src/data/tournamentSquads.json`)
  console.log(`Missing year-team mappings: ${missing.length}`)
  if (missing.length) {
    console.log('First 20 missing:')
    for (const item of missing.slice(0, 20)) console.log(`  - ${item}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
