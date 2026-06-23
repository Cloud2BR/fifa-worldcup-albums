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
let withFileAll = 0
let missingAll = 0

for (const [year, teamMap] of Object.entries(squads)) {
  let total = 0
  let withFile = 0
  let missing = 0

  for (const [teamCode, players] of Object.entries(teamMap || {})) {
    for (const player of players || []) {
      total += 1
      const key = `${year}:${teamCode}:${slugifyName(player?.name)}`
      const entry = images[key]
      const hasFile = entry?.file ? await exists(path.join(playersRoot, entry.file)) : false
      if (hasFile) withFile += 1
      else missing += 1
    }
  }

  byYear[year] = { total, withFile, missing }
  totalAll += total
  withFileAll += withFile
  missingAll += missing
}

console.log(JSON.stringify({ totalAll, withFileAll, missingAll, byYear }, null, 2))
