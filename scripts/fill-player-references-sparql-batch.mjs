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

function normalizeMatchKey(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    year: '1930',
    scanLimit: 240,
    batchSize: 60,
    saveEvery: 20,
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
    if (arg === '--batch-size' && args[i + 1]) {
      const n = Number.parseInt(args[i + 1], 10)
      out.batchSize = Number.isNaN(n) ? out.batchSize : Math.max(5, n)
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

function makeVariants(name) {
  const original = normalizeName(name)
  const deaccented = original
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const variants = new Set([original, deaccented])
  return [...variants].filter(Boolean)
}

function toThumbnail(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=700`
}

async function runSparql(names) {
  const values = names.map((n) => `"${n.replace(/"/g, '\\"')}"@en`).join(' ')
  const query = `
SELECT ?item ?itemLabel ?image WHERE {
  VALUES ?candidate { ${values} }
  ?item rdfs:label ?itemLabel .
  FILTER(LANG(?itemLabel) = "en")
  FILTER(?itemLabel = ?candidate)
  ?item wdt:P31/wdt:P279* wd:Q5 .
  ?item wdt:P106 wd:Q937857 .
  ?item wdt:P18 ?image .
}
`

  const body = new URLSearchParams({ query })
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: {
          accept: 'application/sparql-results+json',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'fifa-worldcup-albums-bot/1.0 (contact: brown9804)',
        },
        body,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`SPARQL HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError || new Error('SPARQL request failed')
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
      unresolved.push({ key, teamCode, teamName, playerName, matchKey: normalizeMatchKey(playerName) })
    }
  }

  const scan = unresolved.slice(0, options.scanLimit)
  const byMatchKey = new Map()
  for (const row of scan) {
    const arr = byMatchKey.get(row.matchKey) || []
    arr.push(row)
    byMatchKey.set(row.matchKey, arr)
  }

  const allVariantNames = []
  const seenVariant = new Set()
  for (const row of scan) {
    for (const v of makeVariants(row.playerName)) {
      if (seenVariant.has(v)) continue
      seenVariant.add(v)
      allVariantNames.push(v)
    }
  }

  let resolved = 0
  let batches = 0

  for (let i = 0; i < allVariantNames.length; i += options.batchSize) {
    const batch = allVariantNames.slice(i, i + options.batchSize)
    batches += 1

    let data
    try {
      data = await runSparql(batch)
    } catch (error) {
      console.log(`Batch ${batches} failed: ${error.message}`)
      continue
    }

    const rows = data?.results?.bindings || []
    for (const r of rows) {
      const label = r?.itemLabel?.value
      const imageUrl = r?.image?.value
      const itemUrl = r?.item?.value
      if (!label || !imageUrl || !itemUrl) continue

      const fileName = decodeURIComponent(imageUrl.split('/').pop() || '')
      if (!fileName) continue

      const matchKey = normalizeMatchKey(label)
      const targets = byMatchKey.get(matchKey) || []
      for (const t of targets) {
        const entry = images[t.key]
        if (!entry || entry.thumbUrl) continue

        entry.thumbUrl = toThumbnail(fileName)
        entry.sourceUrl = itemUrl
        entry.author = 'Wikidata/Wikimedia Commons contributors'
        entry.license = 'See source page'
        resolved += 1
      }
    }

    if (resolved > 0 && resolved % options.saveEvery === 0) {
      catalog.images = images
      await writeJson(outputFile, catalog)
    }

    console.log(`Batch ${batches}: variants=${batch.length}, resolvedSoFar=${resolved}`)
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log(JSON.stringify({
    year: options.year,
    scanned: scan.length,
    variants: allVariantNames.length,
    batches,
    resolved,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
