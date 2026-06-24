import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const squadsFile = path.join(repoRoot, 'src', 'data', 'tournamentSquads.json')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'playerImages.json')
const outputDir = path.join(repoRoot, 'docs', 'images', 'players')

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

async function fetchJson(url, attempts = 5) {
  let lastError = null

  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'fifa-worldcup-albums/1.0 (player image downloader)',
          accept: 'application/json',
        },
      })

      if (response.ok) return response.json()

      // Wikimedia/Wikipedia APIs can throttle bursts.
      if (response.status === 429 || response.status === 503) {
        await wait(900 * (i + 1))
        continue
      }

      throw new Error(`HTTP ${response.status} for ${url}`)
    } catch (error) {
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
  const data = await fetchJson(apiUrl)
  return data?.query?.search?.[0]?.title || null
}

async function getWikipediaSummary(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  return fetchJson(summaryUrl)
}

async function findCommonsImage(query) {
  const apiUrl =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*' +
    `&gsrsearch=${encodeURIComponent(query)}`

  const data = await fetchJson(apiUrl)
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
  const searchData = await fetchJson(searchUrl)
  const candidates = searchData?.search || []

  for (const candidate of candidates) {
    const id = candidate?.id
    if (!id) continue

    const entityUrl =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&origin=*' +
      `&ids=${encodeURIComponent(id)}`
    const entityData = await fetchJson(entityUrl)
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

  // Fallback for players without a dedicated Wikipedia summary thumbnail.
  for (const query of queries) {
    try {
      const commons = await findCommonsImage(query)
      if (!commons?.thumbUrl) continue
      return {
        thumbUrl: commons.thumbUrl,
        sourceUrl: commons.sourceUrl,
        author: commons.author,
        license: commons.license,
        caption: `${playerName} (${teamName})`,
      }
    } catch {
      await wait(200)
    }
  }

  for (const query of queries) {
    try {
      const wikidata = await findWikidataImage(query)
      if (!wikidata?.thumbUrl) continue
      return {
        thumbUrl: wikidata.thumbUrl,
        sourceUrl: wikidata.sourceUrl,
        author: wikidata.author,
        license: wikidata.license,
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
    replacePlaceholdersOnly: false,
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
      continue
    }
    if (arg === '--replace-placeholders-only') {
      out.replacePlaceholdersOnly = true
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
      const entryFile = String(entry.file || '')
      const isPlaceholderFile = entryFile.toLowerCase().endsWith('.svg')
      const isPlaceholderMeta = String(entry.author || '').toLowerCase().includes('placeholder')
      const isPlaceholder = isPlaceholderFile || isPlaceholderMeta

      if (options.replacePlaceholdersOnly && !isPlaceholder) {
        skipped += 1
        processed += 1
        continue
      }

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
      const oldRelativeFile = entry.file ? String(entry.file) : null
      const existingBase = entry.file ? path.basename(entry.file) : null
      const preferredBase = `${slugify(playerName)}${ext}`
      const fileName = isPlaceholderFile
        ? preferredBase
        : (existingBase || preferredBase)
      const outPath = path.join(teamDir, fileName)
      const relativeFile = `${options.year}/${teamCode}/${fileName}`

      if (entry.file !== relativeFile) entry.file = relativeFile

      if (await fileExists(outPath)) {
        skipped += 1
        processed += 1
        continue
      }

      try {
        await downloadWithRetry(thumbUrl, outPath)

        // Remove old placeholder file once a real image is written.
        if (oldRelativeFile && oldRelativeFile !== relativeFile) {
          try {
            await fs.unlink(path.join(outputDir, oldRelativeFile))
          } catch {
            // no-op
          }
        }

        if (isPlaceholderMeta) {
          entry.author = 'Wikipedia contributors'
          entry.license = entry.license || 'See source page'
        }

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
      await wait(420)
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
