import fs from 'node:fs/promises'

const year = process.argv[2] || '2026'
const images = (JSON.parse(await fs.readFile('src/data/playerImages.json', 'utf8')).images) || {}

let total = 0
let placeholders = 0
let real = 0
let noFile = 0

for (const [key, entry] of Object.entries(images)) {
  if (!key.startsWith(`${year}:`)) continue
  total += 1

  const file = String(entry?.file || '')
  const placeholderMeta = String(entry?.author || '').toLowerCase().includes('placeholder')
  if (!file) {
    noFile += 1
    continue
  }

  if (file.toLowerCase().endsWith('.svg') || placeholderMeta) placeholders += 1
  else real += 1
}

console.log(JSON.stringify({ year, total, placeholders, real, noFile }, null, 2))
