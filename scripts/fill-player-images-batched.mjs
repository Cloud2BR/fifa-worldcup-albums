import { spawnSync } from 'node:child_process'

const TOTAL = 1248
const BATCH = 120

for (let max = BATCH; max <= TOTAL; max += BATCH) {
  console.log(`\n=== Batch run: --max ${max} ===`)
  const result = spawnSync('node', ['scripts/download-player-images.mjs', '--year', '2026', '--max', String(max)], {
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    console.error(`Batch failed at --max ${max}`)
  }

  const coverage = spawnSync('node', ['scripts/report-player-coverage.mjs'], {
    encoding: 'utf8',
    shell: true,
  })
  if (coverage.stdout) console.log(coverage.stdout)
}
