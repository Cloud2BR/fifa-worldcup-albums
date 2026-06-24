import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

function normalizeName(input) {
  return String(input || '').replace(/\s+©$/, '').trim()
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    year: '2026',
    scanLimit: 500,
    targetResolved: 50,
    timeoutMs: 2500,
    saveEvery: 5,
    minDelayMs: 500,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--year' && args[i + 1]) {
      out.year = String(args[i + 1])
      i += 1
      continue
    }
    if (arg === '--scan-limit' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.scanLimit = Number.isNaN(n) ? out.scanLimit : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--target-resolved' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.targetResolved = Number.isNaN(n) ? out.targetResolved : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--timeout-ms' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.timeoutMs = Number.isNaN(n) ? out.timeoutMs : Math.max(500, n)
      i += 1
      continue
    }
    if (arg === '--save-every' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.saveEvery = Number.isNaN(n) ? out.saveEvery : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--min-delay-ms' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.minDelayMs = Number.isNaN(n) ? out.minDelayMs : Math.max(0, n)
      i += 1
      continue
    }
  }

  return out
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

async function fetchJsonRateSafe(url, timeoutMs, label) {
  let backoff = 3000

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'fifa-worldcup-albums-bot/1.0 (contact: brown9804)',
          accept: 'application/json',
        },
        signal: controller.signal,
      })

      const text = await response.text()

      if (!response.ok || text.startsWith('You are making too many requests')) {
        await wait(backoff)
        backoff = Math.min(30000, Math.floor(backoff * 1.5))
        continue
      }

      try {
        return JSON.parse(text)
      } catch {
        await wait(backoff)
        backoff = Math.min(30000, Math.floor(backoff * 1.5))
      }
    } catch {
      await wait(backoff)
      backoff = Math.min(30000, Math.floor(backoff * 1.5))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  console.log(`Rate-safe fetch failed after retries: ${label}`)
  return null
}

async function resolveFromWikidata(playerName, timeoutMs) {
  const searchUrl =
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&limit=3&origin=*' +
    `&search=${encodeURIComponent(playerName)}`

  const searchData = await fetchJsonRateSafe(searchUrl, timeoutMs, `search:${playerName}`)
  const candidates = searchData?.search || []

  for (const candidate of candidates) {
    const id = candidate?.id
    if (!id) continue

    const entityUrl =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&origin=*' +
      `&ids=${encodeURIComponent(id)}`
    const entityData = await fetchJsonRateSafe(entityUrl, timeoutMs, `entity:${id}`)
    const p18 = entityData?.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (!p18) continue

    const commonsUrl =
      'https://commons.wikimedia.org/w/api.php?action=query&titles=File:' +
      `${encodeURIComponent(String(p18))}` +
      '&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*'
    const commonsData = await fetchJsonRateSafe(commonsUrl, timeoutMs, `commons:${id}`)
    const pages = commonsData?.query?.pages ? Object.values(commonsData.query.pages) : []
    const info = pages?.[0]?.imageinfo?.[0]
    const thumbUrl = info?.thumburl || info?.url || null

    if (thumbUrl) {
      return {
        thumbUrl,
        sourceUrl: `https://www.wikidata.org/wiki/${id}`,
        author: 'Wikidata/Wikimedia Commons contributors',
        license: 'See source page',
      }
    }
  }

  return null
}

async function main() {
  const options = parseArgs()
  const squads = await readJson(squadsFile, {})
  const teams = await readJson(teamsFile, {})
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  const teamMap = squads?.[options.year] || {}
  const candidates = []

  for (const [teamCode, players] of Object.entries(teamMap)) {
    const teamName = teams?.[teamCode]?.name || teamCode

    for (const p of players || []) {
      const playerName = normalizeName(p?.name)
      if (!playerName) continue

      const key = `${options.year}:${teamCode}:${slugify(playerName)}`
      if (!images[key]) {
        images[key] = {
          year: Number.parseInt(options.year, 10),
          teamCode,
          team: teamName,
          name: playerName,
          caption: `${playerName} (${teamName})`,
        }
      }

      if (images[key]?.thumbUrl) continue
      candidates.push({ key, playerName, teamName })
    }
  }

  const scan = candidates.slice(0, options.scanLimit)
  let scanned = 0
  let resolved = 0
  let failed = 0

  console.log(`Rate-safe run started: year=${options.year}, scan=${scan.length}, targetResolved=${options.targetResolved}`)

  for (const item of scan) {
    if (resolved >= options.targetResolved) break

    const result = await resolveFromWikidata(item.playerName, options.timeoutMs)

    if (result?.thumbUrl) {
      const entry = images[item.key]
      entry.thumbUrl = result.thumbUrl
      entry.sourceUrl = result.sourceUrl || entry.sourceUrl || null
      entry.author = result.author || entry.author || 'Wikidata/Wikimedia Commons contributors'
      entry.license = result.license || entry.license || 'See source page'
      resolved += 1
      console.log(`Resolved ${resolved}: ${item.playerName}`)

      if (resolved % options.saveEvery === 0) {
        catalog.images = images
        await writeJson(outputFile, catalog)
      }
    } else {
      failed += 1
    }

    scanned += 1
    if (scanned % 25 === 0) {
      console.log(`Progress scanned=${scanned}, resolved=${resolved}, failed=${failed}`)
    }

    if (options.minDelayMs > 0) await wait(options.minDelayMs)
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log(JSON.stringify({
    year: options.year,
    scanned,
    resolved,
    failed,
    targetResolved: options.targetResolved,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
