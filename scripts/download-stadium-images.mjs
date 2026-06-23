import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const dataFile = path.join(repoRoot, 'src', 'data', 'stadiumImages.json')
const albumsFile = path.join(repoRoot, 'src', 'data', 'albums.json')
const outputDir = path.join(repoRoot, 'public', 'images', 'stadiums')

function slugifyAssetName(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function detectExtension(url) {
  const clean = String(url || '').split('?')[0]
  if (clean.toLowerCase().endsWith('.png')) return '.png'
  if (clean.toLowerCase().endsWith('.webp')) return '.webp'
  if (clean.toLowerCase().endsWith('.jpeg')) return '.jpg'
  return '.jpg'
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'fifa-worldcup-albums/1.0 (stadium downloader)',
      accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
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

async function downloadImage(url, outPath) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
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
      const backoff = 450 * (i + 1)
      await wait(backoff)
    }
  }
  throw lastError || new Error('Unknown download error')
}

async function resolveFallbackImageMeta(label, existingEntry) {
  const sourceUrl = existingEntry?.sourceUrl || ''
  const wikiPageMatch = sourceUrl.match(/wikipedia\.org\/wiki\/(.+)$/i)
  const decodeTitle = wikiPageMatch ? decodeURIComponent(wikiPageMatch[1].replace(/_/g, ' ')) : null

  if (decodeTitle) {
    try {
      const summary = await getWikipediaSummary(decodeTitle)
      const thumbUrl = summary?.thumbnail?.source || null
      if (thumbUrl) {
        return {
          thumbUrl,
          pageUrl: summary?.content_urls?.desktop?.page || existingEntry?.sourceUrl || null,
        }
      }
    } catch {
      // Continue with search-based fallback.
    }
  }

  const queries = [`${label} stadium`, `${label} football stadium`, label]

  for (const query of queries) {
    try {
      const title = await findWikipediaTitle(query)
      if (!title) continue
      const summary = await getWikipediaSummary(title)
      const thumbUrl = summary?.thumbnail?.source || null
      if (!thumbUrl) continue
      const pageUrl = summary?.content_urls?.desktop?.page || existingEntry?.sourceUrl || null
      return { thumbUrl, pageUrl }
    } catch {
      await wait(200)
    }
  }

  return null
}

async function main() {
  await ensureDir(outputDir)

  const json = await readJson(dataFile)
  const albums = await readJson(albumsFile)
  const images = json.images || {}

  for (const album of albums) {
    for (const label of album.stadiums || []) {
      if (!images[label]) {
        images[label] = {
          author: 'Wikipedia contributors',
          license: 'See source page',
          caption: `${label} - FIFA World Cup venue.`,
        }
      }
    }
  }

  let downloaded = 0
  let skipped = 0
  let failed = 0
  let resolved = 0

  for (const [label, entry] of Object.entries(images)) {
    let thumbUrl = entry?.thumbUrl
    if (!thumbUrl || /\/400px-/i.test(thumbUrl)) {
      const resolvedMeta = await resolveFallbackImageMeta(label, entry)
      if (resolvedMeta?.thumbUrl) {
        thumbUrl = resolvedMeta.thumbUrl
        entry.thumbUrl = resolvedMeta.thumbUrl
        if (resolvedMeta.pageUrl) entry.sourceUrl = resolvedMeta.pageUrl
        if (!entry.author) entry.author = 'Wikipedia contributors'
        if (!entry.license) entry.license = 'See source page'
        if (!entry.caption) entry.caption = `${label} - FIFA World Cup venue.`
        resolved += 1
      }
    }

    if (!thumbUrl) {
      skipped += 1
      continue
    }

    const ext = detectExtension(thumbUrl)
    const fileName = entry.file || `${slugifyAssetName(label)}${ext}`
    const outPath = path.join(outputDir, fileName)

    if (!entry.file) {
      entry.file = fileName
    }

    try {
      await fs.access(outPath)
      skipped += 1
      continue
    } catch {
      // File does not exist yet.
    }

    try {
      await downloadWithRetry(thumbUrl, outPath)
      downloaded += 1
      console.log(`Downloaded: ${fileName}`)
    } catch (error) {
      failed += 1
      console.error(`Failed: ${label} -> ${thumbUrl}`)
      console.error(String(error.message || error))
    }
  }

  await writeJson(dataFile, json)

  console.log('')
  console.log(`Done. downloaded=${downloaded}, skipped=${skipped}, failed=${failed}, resolved=${resolved}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
