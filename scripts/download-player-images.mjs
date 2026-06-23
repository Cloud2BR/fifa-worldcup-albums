import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')
const outputDir = path.join(repoRoot, 'public', 'images', 'players')

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePlayerName(input) {
  return String(input || '')
    .replace(/\s+©$/, '')
    .trim()
}

function detectExtension(url) {
  const clean = String(url || '').split('?')[0].toLowerCase()
  if (clean.endsWith('.png')) return '.png'
  if (clean.endsWith('.webp')) return '.webp'
  if (clean.endsWith('.jpeg')) return '.jpg'
  return '.jpg'
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
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

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'fifa-worldcup-albums/1.0 (player image downloader)',
      accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return response.json()
}

async function findWikipediaTitle(query) {
  const apiUrl =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*' +
    `&srsearch=${encodeURIComponent(query)}`
  const data = await fetchJson(apiUrl)
  return data?.query?.search?.[0]?.title || null
}

async function getWikipediaSummary(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  return fetchJson(summaryUrl)
}

async function resolvePlayerImage(playerName, teamName) {
  const queries = [
    `${playerName} footballer`,
    `${playerName} ${teamName} footballer`,
    `${playerName} soccer`,
    playerName,
  ]

  for (const query of queries) {
    try {
      const title = await findWikipediaTitle(query)
      if (!title) continue
      const summary = await getWikipediaSummary(title)
      const thumbUrl = summary?.thumbnail?.source || null
      if (!thumbUrl) continue
      return {
        thumbUrl,
        sourceUrl: summary?.content_urls?.desktop?.page || null,
        author: 'Wikipedia contributors',
        license: 'See source page',
        caption: `${playerName} (${teamName})`,
      }
    } catch {
      await wait(200)
    }
  }

  return null
}

async function downloadImage(url, outPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(outPath, buffer)
}

async function downloadWithRetry(url, outPath, attempts = 4) {
  let lastError = null
  for (let i = 0; i < attempts; i += 1) {
    try {
      await downloadImage(url, outPath)
      return
    } catch (error) {
      lastError = error
      await wait(300 * (i + 1))
    }
  }
  throw lastError || new Error('Unknown download error')
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    year: '2026',
    max: null,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--year' && args[i + 1]) {
      out.year = String(args[i + 1])
      i += 1
      continue
    }
    if (arg === '--max' && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10)
      out.max = Number.isNaN(parsed) ? null : parsed
      i += 1
    }
  }

  return out
}

function buildPlayerKey(year, teamCode, playerName) {
  return `${year}:${teamCode}:${slugify(playerName)}`
}

async function main() {
  const options = parseArgs()

  const squads = await readJson(squadsFile, {})
  const teams = await readJson(teamsFile, {})
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  const yearSquads = squads[options.year]
  if (!yearSquads || typeof yearSquads !== 'object') {
    throw new Error(`No squad data found for year ${options.year}`)
  }

  let downloaded = 0
  let skipped = 0
  let failed = 0
  let resolved = 0
  let processed = 0

  for (const [teamCode, players] of Object.entries(yearSquads)) {
    const teamName = teams?.[teamCode]?.name || teamCode
    const teamDir = path.join(outputDir, options.year, teamCode)
    await ensureDir(teamDir)

    for (const player of players || []) {
      if (options.max && processed >= options.max) break

      const playerName = normalizePlayerName(player?.name)
      if (!playerName) continue

      const key = buildPlayerKey(options.year, teamCode, playerName)
      if (!images[key]) {
        images[key] = {
          year: Number.parseInt(options.year, 10),
          teamCode,
          team: teamName,
          name: playerName,
          author: 'Wikipedia contributors',
          license: 'See source page',
          caption: `${playerName} (${teamName})`,
        }
      }

      const entry = images[key]
      let thumbUrl = entry.thumbUrl || null

      if (!thumbUrl) {
        const resolvedImage = await resolvePlayerImage(playerName, teamName)
        if (resolvedImage?.thumbUrl) {
          thumbUrl = resolvedImage.thumbUrl
          entry.thumbUrl = resolvedImage.thumbUrl
          entry.sourceUrl = resolvedImage.sourceUrl
          entry.author = entry.author || resolvedImage.author
          entry.license = entry.license || resolvedImage.license
          entry.caption = entry.caption || resolvedImage.caption
          resolved += 1
        }
      }

      if (!thumbUrl) {
        failed += 1
        processed += 1
        continue
      }

      const ext = detectExtension(thumbUrl)
      const fileName = entry.file || `${slugify(playerName)}${ext}`
      const outPath = path.join(teamDir, fileName)
      const relativeFile = `${options.year}/${teamCode}/${fileName}`

      if (!entry.file) entry.file = relativeFile

      if (await fileExists(outPath)) {
        skipped += 1
        processed += 1
        continue
      }

      try {
        await downloadWithRetry(thumbUrl, outPath)
        downloaded += 1
        console.log(`Downloaded: ${teamCode} / ${playerName}`)
      } catch (error) {
        failed += 1
        console.error(`Failed: ${teamCode} / ${playerName} -> ${thumbUrl}`)
        console.error(String(error.message || error))
      }

      processed += 1
      catalog.images = images
      await writeJson(outputFile, catalog)
      await wait(120)
    }

    if (options.max && processed >= options.max) break
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log('')
  console.log(`Done. year=${options.year}, processed=${processed}, downloaded=${downloaded}, skipped=${skipped}, failed=${failed}, resolved=${resolved}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
