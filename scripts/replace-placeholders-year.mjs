import fs from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

function countYear(images, year) {
  let total = 0
  let placeholders = 0
  let real = 0

  for (const [key, entry] of Object.entries(images)) {
    if (!key.startsWith(`${year}:`)) continue
    total += 1
    const file = String(entry?.file || '').toLowerCase()
    const placeholderMeta = String(entry?.author || '').toLowerCase().includes('placeholder')
    if (file.endsWith('.svg') || placeholderMeta) placeholders += 1
    else if (file) real += 1
  }

  return { total, placeholders, real }
}

async function loadImages() {
  const json = JSON.parse(await fs.readFile('src/data/playerImages.json', 'utf8'))
  return json.images || {}
}

function runDownloader(year) {
  const result = spawnSync('node', [
    'scripts/download-player-images.mjs',
    '--year',
    String(year),
    '--replace-placeholders-only',
    '--max',
    '1248',
  ], {
    stdio: 'inherit',
    shell: true,
  })
  return result.status ?? 1
}

const year = process.argv[2] || '2026'
const maxPasses = Number.parseInt(process.argv[3] || '5', 10)

let previous = countYear(await loadImages(), year)
console.log(`Start ${year}: real=${previous.real}, placeholders=${previous.placeholders}, total=${previous.total}`)

for (let pass = 1; pass <= maxPasses; pass += 1) {
  console.log(`\n=== Pass ${pass}/${maxPasses} for year ${year} ===`)
  const code = runDownloader(year)
  if (code !== 0) {
    console.log(`Downloader exited with code ${code}`)
  }

  const current = countYear(await loadImages(), year)
  const gained = current.real - previous.real
  console.log(`After pass ${pass}: real=${current.real}, placeholders=${current.placeholders}, gained=${gained}`)

  if (gained <= 0) {
    console.log('No additional real-image gains in this pass. Stopping early.')
    break
  }

  previous = current
}
