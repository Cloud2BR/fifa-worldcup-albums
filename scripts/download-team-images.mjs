import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const teamsFile = path.join(repoRoot, 'src', 'data', 'teams.json')
const outputFile = path.join(repoRoot, 'src', 'data', 'teamImages.json')
const outputDir = path.join(repoRoot, 'public', 'images', 'teams')

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'fifa-worldcup-albums/1.0 (team image downloader)',
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

async function resolveTeamImage(teamName) {
  const queries = [
    `${teamName} national football team`,
    `${teamName} football team`,
    teamName,
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
        caption: `${teamName} team image`,
      }
    } catch {
      await wait(220)
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
      await wait(350 * (i + 1))
    }
  }
  throw lastError || new Error('Unknown download error')
}

async function main() {
  await ensureDir(outputDir)

  const teams = await readJson(teamsFile, {})
  const catalog = await readJson(outputFile, { images: {} })
  const images = catalog.images || {}

  let downloaded = 0
  let skipped = 0
  let failed = 0
  let resolved = 0

  for (const [code, team] of Object.entries(teams)) {
    if (!images[code]) {
      images[code] = {
        team: team.name,
        author: 'Wikipedia contributors',
        license: 'See source page',
        caption: `${team.name} team image`,
      }
    }

    const entry = images[code]
    let thumbUrl = entry.thumbUrl || null

    if (!thumbUrl) {
      const resolvedImage = await resolveTeamImage(team.name)
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
      continue
    }

    const ext = detectExtension(thumbUrl)
    const fileName = entry.file || `${code}${ext}`
    const outPath = path.join(outputDir, fileName)

    if (!entry.file) entry.file = fileName

    if (await fileExists(outPath)) {
      skipped += 1
      continue
    }

    try {
      await downloadWithRetry(thumbUrl, outPath)
      downloaded += 1
      console.log(`Downloaded: ${code} -> ${fileName}`)
    } catch (error) {
      failed += 1
      console.error(`Failed: ${code} (${team.name}) -> ${thumbUrl}`)
      console.error(String(error.message || error))
    }

    catalog.images = images
    await writeJson(outputFile, catalog)
  }

  catalog.images = images
  await writeJson(outputFile, catalog)

  console.log('')
  console.log(`Done. downloaded=${downloaded}, skipped=${skipped}, failed=${failed}, resolved=${resolved}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
