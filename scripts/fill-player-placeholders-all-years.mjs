import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const playerImagesFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')
const playersRoot = path.join(repoRoot, 'docs', 'images', 'players')

function slugify(input) {
  return String(input || '')
    .replace(/\s+©$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function escapeXml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function placeholderSvg({ name, teamName, year, teamCode }) {
  const tag = initials(name)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${escapeXml(name)} placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="450" cy="420" r="180" fill="#334155" stroke="#94a3b8" stroke-width="8"/>
  <text x="450" y="450" text-anchor="middle" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="130" font-weight="800">${escapeXml(tag)}</text>
  <rect x="90" y="720" width="720" height="300" rx="18" fill="#111827" stroke="#475569" stroke-width="4"/>
  <text x="450" y="810" text-anchor="middle" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700">${escapeXml(name)}</text>
  <text x="450" y="875" text-anchor="middle" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="30">${escapeXml(teamName)} (${escapeXml(teamCode)})</text>
  <text x="450" y="940" text-anchor="middle" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="26">FIFA World Cup ${escapeXml(year)}</text>
  <text x="450" y="995" text-anchor="middle" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="22">Placeholder image</text>
</svg>
`
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeJsonAtomicWithRetry(filePath, data, attempts = 8) {
  const dir = path.dirname(filePath)
  const tempFile = path.join(dir, `${path.basename(filePath)}.tmp`)
  const json = `${JSON.stringify(data, null, 2)}\n`

  let lastError = null
  for (let i = 0; i < attempts; i += 1) {
    try {
      await fs.writeFile(tempFile, json, 'utf8')
      await fs.rename(tempFile, filePath)
      return
    } catch (error) {
      lastError = error
      try {
        await fs.unlink(tempFile)
      } catch {
        // no-op
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)))
    }
  }

  throw lastError || new Error(`Failed writing ${filePath}`)
}

async function main() {
  const squads = JSON.parse(await fs.readFile(squadsFile, 'utf8'))
  const teams = JSON.parse(await fs.readFile(teamsFile, 'utf8'))
  const catalog = JSON.parse(await fs.readFile(playerImagesFile, 'utf8'))
  const images = catalog.images || {}

  let createdEntries = 0
  let placeholderFiles = 0

  for (const [year, teamMap] of Object.entries(squads)) {
    for (const [teamCode, players] of Object.entries(teamMap || {})) {
      const teamName = teams?.[teamCode]?.name || teamCode
      const teamDir = path.join(playersRoot, year, teamCode)
      await ensureDir(teamDir)

      for (const player of players || []) {
        const name = String(player?.name || '').replace(/\s+©$/, '').trim()
        if (!name) continue

        const key = `${year}:${teamCode}:${slugify(name)}`
        if (!images[key]) {
          images[key] = {
            year: Number.parseInt(year, 10),
            teamCode,
            team: teamName,
            name,
            author: 'Generated placeholder',
            license: 'Internal placeholder',
            caption: `${name} (${teamName})`,
          }
          createdEntries += 1
        }

        const entry = images[key]
        const hasFile = Boolean(entry?.file)
        if (hasFile) {
          const abs = path.join(playersRoot, entry.file)
          if (await exists(abs)) continue
        }

        const fileName = `${slugify(name)}.svg`
        const relFile = `${year}/${teamCode}/${fileName}`
        const absPath = path.join(playersRoot, relFile)

        if (!(await exists(absPath))) {
          const svg = placeholderSvg({ name, teamName, year, teamCode })
          await fs.writeFile(absPath, svg, 'utf8')
          placeholderFiles += 1
        }

        entry.file = relFile
        entry.author = entry.author || 'Generated placeholder'
        entry.license = entry.license || 'Internal placeholder'
      }
    }
  }

  catalog.images = images
  await writeJsonAtomicWithRetry(playerImagesFile, catalog)

  console.log(JSON.stringify({ createdEntries, placeholderFiles, totalMapped: Object.keys(images).length }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
