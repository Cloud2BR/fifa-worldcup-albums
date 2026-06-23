#!/usr/bin/env node
/**
 * fetch-player-thumburls.mjs
 *
 * For every 2026 player entry in playerImages.json that has no thumbUrl (or a bad one),
 * query the Wikipedia REST API to find a real face photo URL and write it back.
 *
 * Strategy per player:
 *  1. Wikipedia /page/summary/{name} → thumbnail.source (fast, often a face crop)
 *  2. Wikipedia search API if direct title fails
 *
 * Run: node scripts/fetch-player-thumburls.mjs [--year 2026] [--team ARG] [--limit 50]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const IMAGES_JSON = path.join(ROOT, 'src/data/playerImages.json')

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const yearArg = args.includes('--year') ? args[args.indexOf('--year') + 1] : null
const teamArg = args.includes('--team') ? args[args.indexOf('--team') + 1] : null
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity

// Patterns that indicate a bad/non-face thumbUrl
const BAD_PATTERNS = [
  'logo', 'Logo', 'Logo_of', 'national_football_team', 'Flag_of', '.pdf',
  'national_team', 'coat_of_arms', 'Coat_of_arms', 'escudo', 'shield',
  'blazon', 'Wappen', 'crest', 'Crest', 'emblem', 'Emblem',
  // Old documents/books that occasionally appear
  '_citanka_', 'IA_drug',
]

function isBadThumb(url) {
  if (!url) return true
  return BAD_PATTERNS.some((p) => url.includes(p))
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'fifa-worldcup-albums/1.0 (educational project; github.com/Cloud2BR/fifa-worldcup-albums)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Wikipedia lookup ──────────────────────────────────────────────────────────

/** Try summary endpoint; return thumbUrl or null. */
async function trySummary(title) {
  const summary = await fetchJSON(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, '_'))}`
  )
  if (summary?.thumbnail?.source && !isBadThumb(summary.thumbnail.source)) {
    return summary.thumbnail.source
  }
  return null
}

/**
 * Try to get a face-photo thumbnail URL from Wikipedia.
 * Returns a URL string or null.
 */
async function lookupWikipediaThumb(playerName) {
  // 1. Direct summary lookup (Wikipedia handles redirects for accent variations)
  const direct = await trySummary(playerName)
  if (direct) return direct

  // 2. Wikipedia search — cast wider net with just the name
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName)}&srlimit=5&format=json&origin=*`
  const searchRes = await fetchJSON(searchUrl)
  const hits = searchRes?.query?.search || []
  for (const hit of hits) {
    // Only check articles whose title looks like a person (contains the first or last name word)
    const nameParts = playerName.toLowerCase().split(/\s+/)
    const titleLower = hit.title.toLowerCase()
    const nameMatch = nameParts.some((part) => part.length > 3 && titleLower.includes(part))
    if (!nameMatch) continue

    const hitThumb = await trySummary(hit.title)
    if (hitThumb) return hitThumb
    await delay(100)
  }

  // 3. Try footballer-specific search
  const searchUrl2 = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + ' football')}&srlimit=3&format=json&origin=*`
  const searchRes2 = await fetchJSON(searchUrl2)
  const hits2 = searchRes2?.query?.search || []
  for (const hit of hits2) {
    const hitThumb = await trySummary(hit.title)
    if (hitThumb) return hitThumb
    await delay(100)
  }

  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw = readFileSync(IMAGES_JSON, 'utf8')
const data = JSON.parse(raw)
const images = data.images || {}

// Filter entries to process
let keys = Object.keys(images).filter((k) => {
  if (yearArg && !k.startsWith(yearArg + ':')) return false
  if (teamArg && !k.startsWith((yearArg || '2026') + ':' + teamArg + ':')) return false
  // Only process entries that need a real thumb
  const entry = images[k]
  return isBadThumb(entry.thumbUrl)
})

if (keys.length === 0) {
  console.log('Nothing to update — all matching entries already have valid thumbUrls.')
  process.exit(0)
}

if (Number.isFinite(limitArg)) keys = keys.slice(0, limitArg)

console.log(`Processing ${keys.length} players${yearArg ? ` (year=${yearArg})` : ''}${teamArg ? ` (team=${teamArg})` : ''}…`)

let updated = 0
let failed = 0

for (let i = 0; i < keys.length; i++) {
  const key = keys[i]
  const entry = images[key]
  // Extract player name from key: "2026:ARG:lionel-messi" → "Lionel Messi"
  const slug = key.split(':')[2] || ''
  const playerName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  process.stdout.write(`[${i + 1}/${keys.length}] ${playerName} … `)

  const thumb = await lookupWikipediaThumb(playerName)
  if (thumb) {
    images[key] = { ...entry, thumbUrl: thumb }
    updated++
    console.log('✓', thumb.slice(0, 70))
  } else {
    failed++
    console.log('✗ not found')
  }

  // Polite rate-limit: ~3 req/s
  await delay(350)

  // Save incrementally every 25 players so progress is not lost
  if ((i + 1) % 25 === 0) {
    writeFileSync(IMAGES_JSON, JSON.stringify({ ...data, images }, null, 2), 'utf8')
    console.log(`  ↳ saved progress (${i + 1}/${keys.length})`)
  }
}

// Final save
writeFileSync(IMAGES_JSON, JSON.stringify({ ...data, images }, null, 2), 'utf8')
console.log(`\nDone. Updated: ${updated}  Not found: ${failed}`)
