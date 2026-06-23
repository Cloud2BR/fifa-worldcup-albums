import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const albumsFile = path.join(repoRoot, 'src', 'data', 'albums.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const stadiumImagesFile = path.join(repoRoot, 'src', 'data', 'stadiumImages.json')
const teamImagesFile = path.join(repoRoot, 'src', 'data', 'teamImages.json')
const playerImagesFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')
const entityImagesFile = path.join(repoRoot, 'src', 'data', 'entityImages.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'mediaIndex.json')

function slugifyAssetName(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mapEntityImage(year, type, entityImages) {
  const key = `${year}:${type}`
  const entry = entityImages[key] || {}
  if (!entry.file && !entry.thumbUrl) return null
  return {
    type,
    file: entry.file ? `/images/entities/${entry.file}` : null,
    caption: entry.caption || null,
    author: entry.author || 'Unknown',
    license: entry.license || 'Unknown',
    sourceUrl: entry.sourceUrl || entry.thumbUrl || null,
  }
}

function countPlayerImagesForYear(year, playerImages) {
  const prefix = `${year}:`
  let count = 0
  for (const key of Object.keys(playerImages)) {
    if (key.startsWith(prefix) && playerImages[key]?.file) count += 1
  }
  return count
}

function mapStadium(label, stadiumImages) {
  const entry = stadiumImages[label] || {}
  const file = entry.file || `${slugifyAssetName(label)}.jpg`
  return {
    name: label,
    file: `/images/stadiums/${file}`,
    caption: entry.caption || `${label} - FIFA World Cup venue.`,
    author: entry.author || 'Unknown',
    license: entry.license || 'Unknown',
    sourceUrl: entry.sourceUrl || null,
  }
}

function mapTeam(code, teams, teamImages) {
  const team = teams[code] || { name: code }
  const imageEntry = teamImages[code] || {}
  return {
    code,
    name: team.name,
    colors: {
      primary: team.primary || null,
      secondary: team.secondary || null,
      accent: team.accent || null,
    },
    image: imageEntry.file ? `/images/teams/${imageEntry.file}` : null,
    imageMeta: imageEntry.file
      ? {
          author: imageEntry.author || 'Unknown',
          license: imageEntry.license || 'Unknown',
          sourceUrl: imageEntry.sourceUrl || null,
        }
      : null,
  }
}

async function main() {
  const albums = await readJson(albumsFile, [])
  const teams = await readJson(teamsFile, {})
  const stadiumImagesJson = await readJson(stadiumImagesFile, { images: {} })
  const teamImagesJson = await readJson(teamImagesFile, { images: {} })
  const playerImagesJson = await readJson(playerImagesFile, { images: {} })
  const entityImagesJson = await readJson(entityImagesFile, { images: {} })

  const stadiumImages = stadiumImagesJson.images || {}
  const teamImages = teamImagesJson.images || {}
  const playerImages = playerImagesJson.images || {}
  const entityImages = entityImagesJson.images || {}

  const byYear = {}
  const byTeam = {}

  for (const album of albums) {
    const year = String(album.year)
    const teamsForYear = (album.teams || []).map((code) => mapTeam(code, teams, teamImages))
    const stadiumsForYear = [...new Set(album.stadiums || [])].map((label) => mapStadium(label, stadiumImages))

    byYear[year] = {
      year: album.year,
      host: album.host,
      winner: album.winner,
      runnerUp: album.runnerUp,
      coverImage: album.coverImage ? album.coverImage.replace(/^\.\//, '/') : null,
      stickerCount: album.stickerCount,
      teams: teamsForYear,
      stadiums: stadiumsForYear,
      entities: {
        emblem: mapEntityImage(year, 'emblem', entityImages),
        ball: mapEntityImage(year, 'ball', entityImages),
        mascot: mapEntityImage(year, 'mascot', entityImages),
        trophy: (() => {
          const trophy = entityImages['global:trophy'] || {}
          if (!trophy.file && !trophy.thumbUrl) return null
          return {
            type: 'trophy',
            file: trophy.file ? `/images/entities/${trophy.file}` : null,
            caption: trophy.caption || 'FIFA World Cup Trophy',
            author: trophy.author || 'Unknown',
            license: trophy.license || 'Unknown',
            sourceUrl: trophy.sourceUrl || trophy.thumbUrl || null,
          }
        })(),
      },
      playerImageCount: countPlayerImagesForYear(year, playerImages),
    }

    for (const teamEntry of teamsForYear) {
      if (!byTeam[teamEntry.code]) {
        byTeam[teamEntry.code] = {
          code: teamEntry.code,
          name: teamEntry.name,
          colors: teamEntry.colors,
          image: teamEntry.image,
          imageMeta: teamEntry.imageMeta,
          years: [],
          hosts: [],
          stadiums: [],
        }
      }

      byTeam[teamEntry.code].years.push(album.year)
      byTeam[teamEntry.code].hosts.push(album.host)
      for (const stadium of stadiumsForYear) {
        byTeam[teamEntry.code].stadiums.push({
          year: album.year,
          host: album.host,
          name: stadium.name,
          file: stadium.file,
        })
      }
    }
  }

  for (const team of Object.values(byTeam)) {
    team.years = [...new Set(team.years)].sort((a, b) => a - b)
    team.hosts = [...new Set(team.hosts)]
  }

  const index = {
    generatedAt: new Date().toISOString(),
    summary: {
      years: Object.keys(byYear).length,
      teams: Object.keys(byTeam).length,
      playerImages: Object.values(playerImages).filter((entry) => Boolean(entry?.file)).length,
      entityImages: Object.values(entityImages).filter((entry) => Boolean(entry?.file)).length,
    },
    byYear,
    byTeam,
  }

  await writeJson(outputFile, index)
  console.log(`Generated media index: ${outputFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
