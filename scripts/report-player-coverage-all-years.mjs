import fs from 'node:fs/promises'
import path from 'node:path'

const squads = JSON.parse(await fs.readFile('src/data/tournamentSquads.json', 'utf8'))
const images = (JSON.parse(await fs.readFile('src/data/playerImages.json', 'utf8')).images) || {}
const playersRoot = path.join(process.cwd(), 'public', 'images', 'players')

function slugifyName(name) {
  return String(name || '')
    .replace(/\s+©$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const byYear = {}
let totalAll = 0
let withRealLocalFileAll = 0
let withRemoteReferenceAll = 0
let placeholderOnlyAll = 0
let missingAll = 0

for (const [year, teamMap] of Object.entries(squads)) {
  let total = 0
  let withRealLocalFile = 0
  let withRemoteReference = 0
  let placeholderOnly = 0
  let missing = 0

  for (const [teamCode, players] of Object.entries(teamMap || {})) {
    for (const player of players || []) {
      total += 1
      const key = `${year}:${teamCode}:${slugifyName(player?.name)}`
      const entry = images[key]
      const hasRealLocalFile = entry?.file
        ? (String(entry.file).toLowerCase().endsWith('.svg') ? false : await exists(path.join(playersRoot, entry.file)))
        : false
      const hasRemoteReference = Boolean(entry?.thumbUrl)

      if (hasRealLocalFile) withRealLocalFile += 1
      if (hasRemoteReference) withRemoteReference += 1
      if (!hasRealLocalFile && !hasRemoteReference) placeholderOnly += 1

      if (!entry) missing += 1
    }
  }

  byYear[year] = { total, withRealLocalFile, withRemoteReference, placeholderOnly, missing }
  totalAll += total
  withRealLocalFileAll += withRealLocalFile
  withRemoteReferenceAll += withRemoteReference
  placeholderOnlyAll += placeholderOnly
  missingAll += missing
}

console.log(JSON.stringify({ totalAll, withRealLocalFileAll, withRemoteReferenceAll, placeholderOnlyAll, missingAll, byYear }, null, 2))
