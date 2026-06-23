import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const albumsPath = path.join(repoRoot, 'src', 'data', 'albums.json')
const mappingPath = path.join(repoRoot, 'src', 'data', 'stadiumImages.json')
const outDir = path.join(repoRoot, 'public', 'images', 'stadiums')

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function detectExt(url) {
  const clean = String(url || '').split('?')[0].toLowerCase()
  if (clean.endsWith('.png')) return 'png'
  if (clean.endsWith('.webp')) return 'webp'
  return 'jpg'
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'fifa-worldcup-albums/1.0 (asset builder)',
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
  const title = data?.query?.search?.[0]?.title || null
  return title
}

async function getSummary(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  return fetchJson(summaryUrl)
}

async function downloadBinary(url, outFile) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'fifa-worldcup-albums/1.0 (asset builder)',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(outFile, buffer)
}

async function build() {
  const albums = await readJson(albumsPath)
  const mapping = await readJson(mappingPath)
  const images = mapping.images || {}

  const stadiumSet = new Set()
  for (const album of albums) {
    for (const stadium of album.stadiums || []) stadiumSet.add(stadium)
  }

  await fs.mkdir(outDir, { recursive: true })

  let resolved = 0
  let downloaded = 0
  let failed = 0
  const misses = []

  for (const stadium of stadiumSet) {
    const existing = images[stadium] || {}
    const searchQueries = [
      `${stadium} stadium`,
      `${stadium} football stadium`,
      stadium,
    ]

    let title = null
    for (const query of searchQueries) {
      try {
        title = await findWikipediaTitle(query)
      } catch {
        // Try the next query variation.
      }
      if (title) break
      await wait(150)
    }

    if (!title) {
      failed += 1
      misses.push(stadium)
      continue
    }

    let summary
    try {
      summary = await getSummary(title)
    } catch {
      failed += 1
      misses.push(stadium)
      continue
    }

    const thumbUrl = summary?.thumbnail?.source || null
    const sourceUrl = summary?.content_urls?.desktop?.page || null

    const entry = {
      ...existing,
      author: existing.author || 'Wikipedia contributors',
      license: existing.license || 'See source page',
      caption: existing.caption || `${stadium} - FIFA World Cup venue.`,
    }

    if (sourceUrl) entry.sourceUrl = sourceUrl
    if (thumbUrl) {
      entry.thumbUrl = thumbUrl
      const ext = detectExt(thumbUrl)
      const fileName = `${slugify(stadium)}.${ext}`
      entry.file = fileName

      const outFile = path.join(outDir, fileName)
      try {
        await downloadBinary(thumbUrl, outFile)
        downloaded += 1
      } catch {
        // Keep the discovered URL in the base even when download fails.
      }
    }

    images[stadium] = entry
    resolved += 1
    await wait(180)
  }

  mapping.images = images
  await writeJson(mappingPath, mapping)

  console.log(`Stadiums total: ${stadiumSet.size}`)
  console.log(`Resolved: ${resolved}`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Failed: ${failed}`)
  if (misses.length) {
    console.log('Missed stadiums:')
    for (const name of misses) console.log(`- ${name}`)
  }
}

build().catch((error) => {
  console.error(error)
  process.exit(1)
})
