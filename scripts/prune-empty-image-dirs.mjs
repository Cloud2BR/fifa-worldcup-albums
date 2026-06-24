import fs from 'node:fs/promises'
import path from 'node:path'

async function pruneEmptyDirs(dirPath) {
  let removed = 0
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const childPath = path.join(dirPath, entry.name)
    removed += await pruneEmptyDirs(childPath)
  }

  const remaining = await fs.readdir(dirPath)
  if (remaining.length === 0) {
    await fs.rmdir(dirPath)
    return removed + 1
  }

  return removed
}

const targets = [
  path.join('docs', 'images', 'players', '2026'),
]

let totalRemoved = 0
for (const target of targets) {
  try {
    totalRemoved += await pruneEmptyDirs(target)
  } catch {
    // ignore missing targets
  }
}

console.log(`Removed empty directories: ${totalRemoved}`)
