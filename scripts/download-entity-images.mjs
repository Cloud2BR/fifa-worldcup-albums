import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const albumsFile = path.join(repoRoot, 'src', 'data', 'albums.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'entityImages.json')
const outputDir = path.join(repoRoot, 'public', 'images', 'entities')

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
      'user-agent': 'fifa-worldcup-albums/1.0 (entity image downloader)',
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

function isResolutionRelevant(entityType, title, sourceUrl) {
  const text = `${title || ''} ${sourceUrl || ''}`.toLowerCase()

  if (/yeezy|sneaker|shoe|footwear/.test(text)) return false

  if (entityType === 'ball') {
    return /world cup|match ball|official match balls|association_football|adidas/.test(text)
  }

  if (entityType === 'mascot') {
    return /world cup|mascot/.test(text)
  }

  if (entityType === 'emblem') {
    return /world cup|fifa/.test(text)
  }

  return true
}

async function resolveImage(queries, entityType = 'generic') {
  for (const query of queries) {
    try {
      const title = await findWikipediaTitle(query)
      if (!title) continue
      const summary = await getWikipediaSummary(title)
      const thumbUrl = summary?.thumbnail?.source || null
      if (!thumbUrl) continue

      const sourceUrl = summary?.content_urls?.desktop?.page || null
      if (!isResolutionRelevant(entityType, title, sourceUrl)) continue

      return {
        thumbUrl,
        sourceUrl,
        author: 'Wikipedia contributors',
        license: 'See source page',
      }
    } catch {
      await wait(180)
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
      await wait(280 * (i + 1))
    }
  }
  throw lastError || new Error('Unknown download error')
}

function makeEntryKey(year, type) {
  return `${year}:${type}`
}

async function upsertEntity(images, { key, label, queries, outSubdir, outStem, entityType = 'generic' }) {
  if (!images[key]) {
    images[key] = {
      key,
      label,
      author: 'Wikipedia contributors',
      license: 'See source page',
      caption: label,
    }
  }

  const entry = images[key]
  let thumbUrl = entry.thumbUrl || null

  if (!thumbUrl) {
    const resolved = await resolveImage(queries, entityType)
    if (!resolved?.thumbUrl) {
      return { status: 'failed' }
    }
    thumbUrl = resolved.thumbUrl
    entry.thumbUrl = resolved.thumbUrl
    entry.sourceUrl = resolved.sourceUrl
    entry.author = entry.author || resolved.author
    entry.license = entry.license || resolved.license
  }

  const ext = detectExtension(thumbUrl)
  const fileName = `${outStem}${ext}`
  const relFile = `${outSubdir}/${fileName}`
  const absDir = path.join(outputDir, outSubdir)
  const absPath = path.join(absDir, fileName)

  await ensureDir(absDir)
  entry.file = relFile

  if (await fileExists(absPath)) return { status: 'skipped' }

  try {
    await downloadWithRetry(thumbUrl, absPath)
    return { status: 'downloaded' }
  } catch {
    return { status: 'failed' }
  }
}

async function main() {
  await ensureDir(outputDir)

  const albums = await readJson(albumsFile, [])
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  let downloaded = 0
  let skipped = 0
  let failed = 0

  // Global trophy image.
  {
    const result = await upsertEntity(images, {
      key: 'global:trophy',
      label: 'FIFA World Cup Trophy',
      queries: ['FIFA World Cup Trophy'],
      outSubdir: 'global',
      outStem: 'fifa-world-cup-trophy',
      entityType: 'trophy',
    })
    if (result.status === 'downloaded') downloaded += 1
    if (result.status === 'skipped') skipped += 1
    if (result.status === 'failed') failed += 1
  }

  for (const album of albums) {
    const year = String(album.year)

    // Official ball
    if (album.ball) {
      const result = await upsertEntity(images, {
        key: makeEntryKey(year, 'ball'),
        label: `Official Ball ${album.year}: ${album.ball}`,
        queries: [
          `${album.ball} Adidas football`,
          `${album.ball} match ball`,
          `${album.year} FIFA World Cup ball`,
        ],
        outSubdir: year,
        outStem: 'ball',
        entityType: 'ball',
      })
      if (result.status === 'downloaded') downloaded += 1
      if (result.status === 'skipped') skipped += 1
      if (result.status === 'failed') failed += 1
      await wait(120)
    }

    // Mascot
    if (album.mascot) {
      const result = await upsertEntity(images, {
        key: makeEntryKey(year, 'mascot'),
        label: `Mascot ${album.year}: ${album.mascot}`,
        queries: [
          `${album.mascot} FIFA World Cup mascot`,
          `${album.year} FIFA World Cup mascot`,
          `${album.mascot} mascot`,
        ],
        outSubdir: year,
        outStem: 'mascot',
        entityType: 'mascot',
      })
      if (result.status === 'downloaded') downloaded += 1
      if (result.status === 'skipped') skipped += 1
      if (result.status === 'failed') failed += 1
      await wait(120)
    }

    // Emblem
    {
      const result = await upsertEntity(images, {
        key: makeEntryKey(year, 'emblem'),
        label: `${album.year} FIFA World Cup Emblem`,
        queries: [
          `${album.year} FIFA World Cup logo`,
          `${album.year} FIFA World Cup emblem`,
          `${album.year} FIFA World Cup`,
        ],
        outSubdir: year,
        outStem: 'emblem',
        entityType: 'emblem',
      })
      if (result.status === 'downloaded') downloaded += 1
      if (result.status === 'skipped') skipped += 1
      if (result.status === 'failed') failed += 1
      await wait(120)
    }

    catalog.images = images
    await writeJson(outputFile, catalog)
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log(`Done. downloaded=${downloaded}, skipped=${skipped}, failed=${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
