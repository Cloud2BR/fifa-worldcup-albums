import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.PLAYER_REF_TIMEOUT_MS || '1800', 10)
const REQUEST_ATTEMPTS = Number.parseInt(process.env.PLAYER_REF_ATTEMPTS || '1', 10)

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

function normalizePlayerName(input) {
  return String(input || '')
    .replace(/\s+©$/, '')
    .trim()
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

async function fetchJson(url, attempts = 1) {
  let lastError = null

  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'fifa-worldcup-albums/1.0 (player reference resolver)',
          accept: 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) return response.json()

      if (response.status === 429 || response.status === 503) {
        await wait(900 * (i + 1))
        continue
      }

      throw new Error(`HTTP ${response.status} for ${url}`)
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      await wait(400 * (i + 1))
    }
  }

  throw lastError || new Error(`Failed JSON fetch for ${url}`)
}

async function commonsFileToThumb(fileName) {
  const apiUrl =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=File:' +
    `${encodeURIComponent(fileName)}` +
    '&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*'

  const data = await fetchJson(apiUrl)
  const pages = data?.query?.pages ? Object.values(data.query.pages) : []
  const page = pages[0]
  const info = page?.imageinfo?.[0] || null
  return info?.thumburl || info?.url || null
}

async function findWikipediaTitle(query) {
  const apiUrl =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*' +
    `&srsearch=${encodeURIComponent(query)}`
  const data = await fetchJson(apiUrl, REQUEST_ATTEMPTS)
  return data?.query?.search?.[0]?.title || null
}

async function getWikipediaSummary(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  return fetchJson(summaryUrl, REQUEST_ATTEMPTS)
}

async function findCommonsImage(query) {
  const apiUrl =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*' +
    `&gsrsearch=${encodeURIComponent(query)}`

  const data = await fetchJson(apiUrl, REQUEST_ATTEMPTS)
  const pages = data?.query?.pages ? Object.values(data.query.pages) : []
  const page = pages[0]
  if (!page) return null

  const info = page?.imageinfo?.[0] || null
  const title = String(page?.title || '').replace(/^File:/, '')
  const thumbUrl = info?.thumburl || info?.url || null
  if (!thumbUrl) return null

  return {
    thumbUrl,
    sourceUrl: title ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}` : null,
    author: 'Wikimedia Commons contributors',
    license: 'See source page',
  }
}

async function findWikidataImage(query) {
  const searchUrl =
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&limit=3&origin=*' +
    `&search=${encodeURIComponent(query)}`
  const searchData = await fetchJson(searchUrl, REQUEST_ATTEMPTS)
  const candidates = searchData?.search || []

  for (const candidate of candidates) {
    const id = candidate?.id
    if (!id) continue

    const entityUrl =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&origin=*' +
      `&ids=${encodeURIComponent(id)}`
    const entityData = await fetchJson(entityUrl, REQUEST_ATTEMPTS)
    const entity = entityData?.entities?.[id]
    const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (!p18) continue

    const fileName = String(p18)
    const thumbUrl = await commonsFileToThumb(fileName)
    if (!thumbUrl) continue

    return {
      thumbUrl,
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
      author: 'Wikidata/Wikimedia Commons contributors',
      license: 'See source page',
    }
  }

  return null
}

async function resolvePlayerImage(playerName, teamName) {
  const useWikidataOnly = process.env.PLAYER_REF_WIKIDATA_ONLY === '1'
  const fastMode = process.env.PLAYER_REF_FAST_MODE === '1'
  const useCommonsFallback = process.env.PLAYER_REF_USE_COMMONS !== '0'
  const queries = [
    `${playerName} footballer`,
    `${playerName} ${teamName} footballer`,
  ]

  if (!useWikidataOnly) {
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
        }
      } catch {
        await wait(150)
      }
    }
  }

  const fallbackQueriesAll = [
    `${playerName}`,
    `${playerName} footballer`,
    `${playerName} ${teamName}`,
  ]
  const fallbackQueries = fastMode ? fallbackQueriesAll.slice(0, 1) : fallbackQueriesAll

  for (const query of fallbackQueries) {
    try {
      const fromWikidata = await findWikidataImage(query)
      if (fromWikidata?.thumbUrl) return fromWikidata
    } catch {
      await wait(80)
    }
  }

  if (useCommonsFallback) {
    for (const query of fallbackQueries) {
      try {
        const fromCommons = await findCommonsImage(query)
        if (fromCommons?.thumbUrl) return fromCommons
      } catch {
        await wait(80)
      }
    }
  }

  return null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    years: null,
    max: null,
    delayMs: 120,
    onlyMissing: true,
    saveEvery: 20,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--years' && args[i + 1]) {
      out.years = String(args[i + 1])
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      i += 1
      continue
    }
    if (arg === '--max' && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10)
      out.max = Number.isNaN(parsed) ? null : parsed
      i += 1
      continue
    }
    if (arg === '--delay-ms' && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10)
      out.delayMs = Number.isNaN(parsed) ? 120 : parsed
      i += 1
      continue
    }
    if (arg === '--only-missing' && args[i + 1]) {
      out.onlyMissing = String(args[i + 1]).toLowerCase() !== 'false'
      i += 1
      continue
    }
    if (arg === '--save-every' && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10)
      out.saveEvery = Number.isNaN(parsed) ? 20 : Math.max(1, parsed)
      i += 1
      continue
    }
  }

  return out
}

async function main() {
  const options = parseArgs()
  const squads = await readJson(squadsFile, {})
  const teams = await readJson(teamsFile, {})
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  const years = options.years || Object.keys(squads).sort()

  console.log(`Starting player reference fill for years: ${years.join(', ')}`)
  console.log(`Options: max=${options.max || 'ALL'}, delayMs=${options.delayMs}, onlyMissing=${options.onlyMissing}, saveEvery=${options.saveEvery}`)

  let processed = 0
  let resolved = 0
  let skipped = 0
  let failed = 0
  const byYear = {}

  for (const year of years) {
    const teamMap = squads?.[year] || {}
    byYear[year] = { processed: 0, resolved: 0, skipped: 0, failed: 0 }

    for (const [teamCode, players] of Object.entries(teamMap)) {
      const teamName = teams?.[teamCode]?.name || teamCode

      for (const player of players || []) {
        if (options.max && processed >= options.max) break

        const playerName = normalizePlayerName(player?.name)
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

        const entry = images[key]
        if (options.onlyMissing && entry.thumbUrl) {
          skipped += 1
          processed += 1
          byYear[year].skipped += 1
          byYear[year].processed += 1
          if (processed % 100 === 0) {
            console.log(`Progress: processed=${processed}, resolved=${resolved}, failed=${failed}, skipped=${skipped}`)
          }
          continue
        }

        try {
          const resolvedImage = await resolvePlayerImage(playerName, teamName)
          if (resolvedImage?.thumbUrl) {
            entry.thumbUrl = resolvedImage.thumbUrl
            entry.sourceUrl = resolvedImage.sourceUrl || entry.sourceUrl || null
            entry.author = resolvedImage.author || entry.author || 'Wikipedia contributors'
            entry.license = resolvedImage.license || entry.license || 'See source page'
            entry.caption = entry.caption || `${playerName} (${teamName})`

            resolved += 1
            byYear[year].resolved += 1
            console.log(`Resolved: ${year} ${teamCode} / ${playerName}`)
          } else {
            failed += 1
            byYear[year].failed += 1
          }
        } catch {
          failed += 1
          byYear[year].failed += 1
        }

        processed += 1
        byYear[year].processed += 1

        if (processed % 100 === 0) {
          console.log(`Progress: processed=${processed}, resolved=${resolved}, failed=${failed}, skipped=${skipped}`)
        }

        if ((resolved + failed) % options.saveEvery === 0) {
          catalog.images = images
          await writeJson(outputFile, catalog)
        }

        await wait(options.delayMs)
      }

      if (options.max && processed >= options.max) break
    }

    if (options.max && processed >= options.max) break
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log('')
  console.log(JSON.stringify({
    years,
    processed,
    resolved,
    skipped,
    failed,
    byYear,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
