import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')

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
    limit: 300,
    concurrency: 10,
    timeoutMs: 1500,
    saveEvery: 25,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--year' && args[i + 1]) {
      out.year = String(args[i + 1])
      i += 1
      continue
    }
    if (arg === '--limit' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.limit = Number.isNaN(n) ? out.limit : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--concurrency' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.concurrency = Number.isNaN(n) ? out.concurrency : Math.max(1, n)
      i += 1
      continue
    }
    if (arg === '--timeout-ms' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.timeoutMs = Number.isNaN(n) ? out.timeoutMs : Math.max(300, n)
      i += 1
      continue
    }
    if (arg === '--save-every' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.saveEvery = Number.isNaN(n) ? out.saveEvery : Math.max(1, n)
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

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'fifa-worldcup-albums/1.0 (batch player resolver)',
        accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolveViaWikipedia(playerName, teamName, timeoutMs) {
  const queries = [
    `${playerName} footballer`,
    `${playerName} ${teamName} footballer`,
  ]

  for (const query of queries) {
    const searchUrl =
      'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*' +
      `&srsearch=${encodeURIComponent(query)}`
    const search = await fetchJson(searchUrl, timeoutMs)
    const title = search?.query?.search?.[0]?.title
    if (!title) continue

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summary = await fetchJson(summaryUrl, timeoutMs)
    const thumbUrl = summary?.thumbnail?.source || null
    if (!thumbUrl) continue

    return {
      thumbUrl,
      sourceUrl: summary?.content_urls?.desktop?.page || null,
      author: 'Wikipedia contributors',
      license: 'See source page',
    }
  }

  return null
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length)
  let next = 0

  async function run() {
    while (next < items.length) {
      const idx = next
      next += 1
      results[idx] = await worker(items[idx], idx)
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

async function main() {
  const options = parseArgs()
  const squads = await readJson(squadsFile, {})
  const teams = await readJson(teamsFile, {})
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  const year = options.year
  const teamMap = squads?.[year] || {}
  const candidates = []

  for (const [teamCode, players] of Object.entries(teamMap)) {
    const teamName = teams?.[teamCode]?.name || teamCode
    for (const p of players || []) {
      const playerName = normalizeName(p?.name)
      if (!playerName) continue

      const key = `${year}:${teamCode}:${slugify(playerName)}`
      if (!images[key]) {
        images[key] = {
          year: Number.parseInt(year, 10),
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

  const batch = candidates.slice(0, options.limit)
  let resolved = 0
  let failed = 0

  console.log(`Resolving ${batch.length} players for ${year} with concurrency=${options.concurrency}`)

  await mapWithConcurrency(batch, options.concurrency, async (item, idx) => {
    const result = await resolveViaWikipedia(item.playerName, item.teamName, options.timeoutMs)
    if (result?.thumbUrl) {
      const entry = images[item.key]
      entry.thumbUrl = result.thumbUrl
      entry.sourceUrl = result.sourceUrl || entry.sourceUrl || null
      entry.author = result.author || entry.author || 'Wikipedia contributors'
      entry.license = result.license || entry.license || 'See source page'
      resolved += 1

      if (resolved % options.saveEvery === 0) {
        catalog.images = images
        await writeJson(outputFile, catalog)
      }
    } else {
      failed += 1
    }

    if ((idx + 1) % 50 === 0) {
      console.log(`Progress ${idx + 1}/${batch.length} resolved=${resolved} failed=${failed}`)
    }

    return null
  })

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log(JSON.stringify({ year, attempted: batch.length, resolved, failed }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
