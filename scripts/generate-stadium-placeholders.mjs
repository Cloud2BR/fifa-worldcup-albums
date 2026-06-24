import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const albumsPath = path.join(repoRoot, 'src', 'data', 'albums.json')
const outDir = path.join(repoRoot, 'docs', 'images', 'stadiums')

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function svgForStadium(stadium, year) {
  const safeName = String(stadium)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${safeName}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f274a"/>
      <stop offset="100%" stop-color="#1f4f7a"/>
    </linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4d8f46"/>
      <stop offset="100%" stop-color="#2f5f2b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <rect y="480" width="1200" height="320" fill="url(#grass)"/>
  <ellipse cx="600" cy="520" rx="520" ry="170" fill="#223b56" opacity="0.9"/>
  <ellipse cx="600" cy="540" rx="430" ry="120" fill="#2f4b6e" opacity="0.9"/>
  <ellipse cx="600" cy="560" rx="320" ry="80" fill="#f5f5f5" opacity="0.12"/>
  <rect x="500" y="600" width="200" height="90" rx="8" fill="#0e1725" opacity="0.75"/>
  <text x="600" y="642" text-anchor="middle" fill="#f8fafc" font-family="Verdana, sans-serif" font-size="26" font-weight="700">${safeName}</text>
  <text x="600" y="678" text-anchor="middle" fill="#cbd5e1" font-family="Verdana, sans-serif" font-size="18">FIFA World Cup ${year || ''}</text>
</svg>
`
}

async function main() {
  const raw = await fs.readFile(albumsPath, 'utf8')
  const albums = JSON.parse(raw)

  const stadiumYear = new Map()
  for (const album of albums) {
    for (const stadium of album.stadiums || []) {
      if (!stadiumYear.has(stadium)) stadiumYear.set(stadium, album.year)
    }
  }

  await fs.mkdir(outDir, { recursive: true })

  let written = 0
  for (const [stadium, year] of stadiumYear.entries()) {
    const file = `${slugify(stadium)}.svg`
    const outFile = path.join(outDir, file)
    const svg = svgForStadium(stadium, year)
    await fs.writeFile(outFile, svg, 'utf8')
    written += 1
  }

  console.log(`Generated ${written} stadium placeholder SVG files in docs/images/stadiums.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
