import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const dataFile = path.join(repoRoot, 'src', 'data', 'stadiumImages.json')
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
  if (clean.endsWith('.png')) return '.png'
  if (clean.endsWith('.webp')) return '.webp'
  if (clean.endsWith('.jpeg')) return '.jpg'
  return '.jpg'
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

async function downloadImage(url, outPath) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(outPath, buffer)
}

async function main() {
  await ensureDir(outputDir)

  const json = await readJson(dataFile)
  const images = json.images || {}

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const [label, entry] of Object.entries(images)) {
    const thumbUrl = entry?.thumbUrl
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
      await downloadImage(thumbUrl, outPath)
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
  console.log(`Done. downloaded=${downloaded}, skipped=${skipped}, failed=${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
