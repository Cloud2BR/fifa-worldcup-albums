import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const albumsFile = path.join(repoRoot, 'src', 'data', 'albums.json')
const stadiumMapFile = path.join(repoRoot, 'src', 'data', 'stadiumImages.json')
const imagesRoot = path.join(repoRoot, 'public', 'images')
const yearsRoot = path.join(imagesRoot, 'years')
const albumsRoot = path.join(imagesRoot, 'albums')
const stadiumsRoot = path.join(imagesRoot, 'stadiums')
const reportFile = path.join(repoRoot, 'src', 'data', 'yearImageCoverage.json')

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

async function pickStadiumSource(stadiumLabel, stadiumMap) {
  const mapped = stadiumMap?.images?.[stadiumLabel]?.file || null
  const candidates = [
    mapped,
    `${slugify(stadiumLabel)}.jpg`,
    `${slugify(stadiumLabel)}.png`,
    `${slugify(stadiumLabel)}.webp`,
    `${slugify(stadiumLabel)}.svg`,
  ].filter((value, index, arr) => value && arr.indexOf(value) === index)

  for (const fileName of candidates) {
    const abs = path.join(stadiumsRoot, fileName)
    if (await exists(abs)) {
      return { abs, fileName }
    }
  }

  return null
}

async function main() {
  const albums = JSON.parse(await fs.readFile(albumsFile, 'utf8'))
  const stadiumMap = JSON.parse(await fs.readFile(stadiumMapFile, 'utf8'))

  const coverage = {
    generatedAt: new Date().toISOString(),
    summary: {
      years: 0,
      coversPresent: 0,
      stadiumsExpected: 0,
      stadiumsPresent: 0,
      missingStadiums: 0,
    },
    years: {},
  }

  for (const album of albums) {
    const year = String(album.year)
    const yearDir = path.join(yearsRoot, year)
    const yearStadiumDir = path.join(yearDir, 'stadiums')

    await ensureDir(yearDir)
    await ensureDir(yearStadiumDir)

    const coverSrc = path.join(albumsRoot, `${year}.svg`)
    const coverDst = path.join(yearDir, 'cover.svg')
    const hasCover = await exists(coverSrc)
    if (hasCover) {
      await fs.copyFile(coverSrc, coverDst)
    }

    let present = 0
    const missing = []

    for (const stadium of album.stadiums || []) {
      const source = await pickStadiumSource(stadium, stadiumMap)
      const slug = slugify(stadium)
      const preferredExt = source ? path.extname(source.fileName) || '.jpg' : '.jpg'
      const outName = `${slug}${preferredExt}`
      const outPath = path.join(yearStadiumDir, outName)

      coverage.summary.stadiumsExpected += 1

      if (!source) {
        missing.push(stadium)
        coverage.summary.missingStadiums += 1
        continue
      }

      await fs.copyFile(source.abs, outPath)
      present += 1
      coverage.summary.stadiumsPresent += 1
    }

    coverage.summary.years += 1
    if (hasCover) coverage.summary.coversPresent += 1

    coverage.years[year] = {
      cover: hasCover ? '/images/years/' + year + '/cover.svg' : null,
      stadiumsExpected: (album.stadiums || []).length,
      stadiumsPresent: present,
      missingStadiums: missing,
    }
  }

  await fs.writeFile(reportFile, `${JSON.stringify(coverage, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify(coverage.summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
