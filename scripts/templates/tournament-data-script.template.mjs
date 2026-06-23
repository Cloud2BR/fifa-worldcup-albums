import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..', '..')

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

async function loadJson(relativePath) {
  const filePath = path.join(root, relativePath)
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function saveJson(relativePath, data) {
  const filePath = path.join(root, relativePath)
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function main() {
  const options = {
    year: Number(process.argv.find((arg) => arg.startsWith('--year='))?.split('=')[1] || NaN),
  }

  if (!Number.isFinite(options.year)) {
    throw new Error('Missing required argument --year=YYYY')
  }

  const albums = await loadJson('src/data/albums.json')
  const targetAlbum = albums.find((album) => album.year === options.year)
  if (!targetAlbum) {
    throw new Error(`Year ${options.year} not found in src/data/albums.json`)
  }

  // TODO: Replace with your remote/local data source and transformation logic.
  // Example output shape can target any repository dataset, such as:
  // - src/data/tournamentSquads.json
  // - src/data/matches.json
  // - src/data/worldcups.json
  const output = {
    generatedAt: new Date().toISOString(),
    year: options.year,
    tournament: normalize(targetAlbum.host),
    notes: 'Replace this template output with real transformed data.',
  }

  await saveJson(`src/data/generated-${options.year}.json`, output)
  console.log(`Generated src/data/generated-${options.year}.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
