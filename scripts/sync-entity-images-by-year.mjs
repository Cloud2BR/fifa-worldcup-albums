import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const albumsFile = path.join(repoRoot, 'src', 'data', 'albums.json')
const entityMapFile = path.join(repoRoot, 'src', 'data', 'entityImages.json')
const entitiesRoot = path.join(repoRoot, 'public', 'images', 'entities')
const reportFile = path.join(repoRoot, 'src', 'data', 'yearEntityCoverage.json')

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

function escapeXml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function placeholderSvg(label, year, kind) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect x="100" y="110" width="1000" height="580" rx="24" fill="#0f172a" stroke="#475569" stroke-width="4"/>
  <text x="50%" y="40%" text-anchor="middle" fill="#93c5fd" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="800">FIFA World Cup ${escapeXml(year)}</text>
  <text x="50%" y="50%" text-anchor="middle" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">${escapeXml(kind.toUpperCase())}</text>
  <text x="50%" y="60%" text-anchor="middle" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">${escapeXml(label)}</text>
  <text x="50%" y="72%" text-anchor="middle" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">Placeholder generated - source image pending</text>
</svg>
`
}

async function main() {
  const albums = JSON.parse(await fs.readFile(albumsFile, 'utf8'))
  const entityMap = JSON.parse(await fs.readFile(entityMapFile, 'utf8')).images || {}

  const coverage = {
    generatedAt: new Date().toISOString(),
    summary: {
      years: 0,
      expectedSlots: 0,
      presentSlots: 0,
      placeholderSlots: 0,
    },
    years: {},
  }

  for (const album of albums) {
    const year = String(album.year)
    const yearDir = path.join(entitiesRoot, year)
    await ensureDir(yearDir)

    const slots = [
      { kind: 'ball', label: album.ball || `Official Ball ${year}` },
      { kind: 'emblem', label: `${year} FIFA World Cup Emblem` },
      { kind: 'mascot', label: album.mascot || `Mascot ${year}` },
    ]

    let present = 0
    let placeholders = 0
    coverage.summary.years += 1

    for (const slot of slots) {
      coverage.summary.expectedSlots += 1
      const key = `${year}:${slot.kind}`
      const entry = entityMap[key]

      if (entry?.file) {
        const source = path.join(entitiesRoot, entry.file)
        if (await exists(source)) {
          present += 1
          coverage.summary.presentSlots += 1
          continue
        }
      }

      const outFile = path.join(yearDir, `${slot.kind}.svg`)
      const svg = placeholderSvg(slot.label, year, slot.kind)
      await fs.writeFile(outFile, svg, 'utf8')
      placeholders += 1
      present += 1
      coverage.summary.presentSlots += 1
      coverage.summary.placeholderSlots += 1
    }

    coverage.years[year] = {
      expectedSlots: slots.length,
      presentSlots: present,
      placeholderSlots: placeholders,
    }
  }

  await fs.writeFile(reportFile, `${JSON.stringify(coverage, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(coverage.summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
