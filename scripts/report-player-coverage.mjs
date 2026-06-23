import fs from 'node:fs/promises'

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

const squads = JSON.parse(await fs.readFile('src/data/tournamentSquads.json', 'utf8'))
const images = (JSON.parse(await fs.readFile('src/data/playerImages.json', 'utf8')).images) || {}
const year = '2026'

let total = 0
let withFile = 0
let withThumb = 0
let missing = 0

for (const [teamCode, players] of Object.entries(squads[year] || {})) {
  for (const player of players || []) {
    total += 1
    const key = `${year}:${teamCode}:${slugifyName(player?.name)}`
    const entry = images[key]
    if (entry?.file) withFile += 1
    else if (entry?.thumbUrl) withThumb += 1
    else missing += 1
  }
}

console.log(JSON.stringify({ year, total, withFile, withThumb, missing }, null, 2))
