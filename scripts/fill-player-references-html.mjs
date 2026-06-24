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
    year: '1930',
    scanLimit: 240,
    delayMs: 300,
    saveEvery: 10,
    timeoutMs: 7000,
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
    if (arg === '--delay-ms' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.delayMs = Number.isNaN(n) ? out.delayMs : Math.max(0, n)
      i += 1
      continue
    }
    if (arg === '--save-every' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.saveEvery = Number.isNaN(n) ? out.saveEvery : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--timeout-ms' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.timeoutMs = Number.isNaN(n) ? out.timeoutMs : Math.max(1000, n)
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

function deaccent(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function titleVariants(playerName) {
  const a = normalizeName(playerName)
  const b = deaccent(a)
  const set = new Set([a, b])
  return [...set]
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.replace(/\s+/g, '_'))
}

function parseMeta(html, property) {
  const re = new RegExp(`<meta[^>]+property=[\"']${property}[\"'][^>]+content=[\"']([^\"']+)[\"']`, 'i')
  const m = html.match(re)
  return m?.[1] || null
}

async function fetchPage(url, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'fifa-worldcup-albums-bot/1.0 (contact: brown9804)',
        accept: 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

function isUsefulOgImage(url) {
  if (!url) return false
  if (/\/static\/images\//i.test(url)) return false
  if (/upload\.wikimedia\.org/i.test(url)) return true
  return false
}

async function resolveViaPageHtml(playerName, timeoutMs) {
  for (const variant of titleVariants(playerName)) {
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(variant)}`
    const html = await fetchPage(pageUrl, timeoutMs)
    if (!html) continue

    const ogImage = parseMeta(html, 'og:image')
    if (!isUsefulOgImage(ogImage)) continue

    const canonical = parseMeta(html, 'og:url') || pageUrl
    return {
      thumbUrl: ogImage,
      sourceUrl: canonical,
      author: 'Wikipedia contributors',
      license: 'See source page',
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

  const yearMap = squads?.[options.year] || {}
  const unresolved = []

  for (const [teamCode, players] of Object.entries(yearMap)) {
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
      unresolved.push({ key, playerName })
    }
  }

  const scan = unresolved.slice(0, options.scanLimit)
  let resolved = 0
  let failed = 0

  console.log(`HTML resolver start: year=${options.year}, scan=${scan.length}`)

  for (let i = 0; i < scan.length; i += 1) {
    const row = scan[i]
    const result = await resolveViaPageHtml(row.playerName, options.timeoutMs)

    if (result?.thumbUrl) {
      const entry = images[row.key]
      entry.thumbUrl = result.thumbUrl
      entry.sourceUrl = result.sourceUrl || entry.sourceUrl || null
      entry.author = result.author || entry.author || 'Wikipedia contributors'
      entry.license = result.license || entry.license || 'See source page'
      resolved += 1
      console.log(`Resolved ${resolved}: ${row.playerName}`)

      if (resolved % options.saveEvery === 0) {
        catalog.images = images
        await writeJson(outputFile, catalog)
      }
    } else {
      failed += 1
    }

    if ((i + 1) % 25 === 0) {
      console.log(`Progress ${i + 1}/${scan.length}: resolved=${resolved}, failed=${failed}`)
    }

    if (options.delayMs > 0) await wait(options.delayMs)
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log(JSON.stringify({
    year: options.year,
    scanned: scan.length,
    resolved,
    failed,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
