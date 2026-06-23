/**
 * Fix entityImages.json:
 * - Correct emblem thumbUrls for every year (were all showing 2022 emblem)
 * - Clear .svg file refs (all placeholder dark gradients)
 * - Clear wrong emblem .png files (1930/1934/1938 show 2022 emblem)
 * - Keep real .jpg ball files (1930/1934/1938/1950 ball.jpg)
 * - Keep global:trophy .jpg file
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataFile = join(__dirname, '../src/data/entityImages.json')

// Correct Wikipedia page thumbnails for each year's emblem/poster
const CORRECT_EMBLEM_URLS = {
  1930: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Uruguay_1930_World_Cup.jpg/330px-Uruguay_1930_World_Cup.jpg',
  1934: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/1934_fifa_worldcup_poster.jpg/330px-1934_fifa_worldcup_poster.jpg',
  1938: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/1938_fifa_worldcup_poster.jpg/330px-1938_fifa_worldcup_poster.jpg',
  1950: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Poster_-_World_Cup_1950.jpg/330px-Poster_-_World_Cup_1950.jpg',
  1954: 'https://upload.wikimedia.org/wikipedia/en/1/1e/1954_FIFA_World_Cup.jpg',
  1958: 'https://upload.wikimedia.org/wikipedia/en/e/e5/1958_FIFA_World_Cup.jpg',
  1962: 'https://upload.wikimedia.org/wikipedia/en/3/38/1962_FIFA_World_Cup.jpg',
  1966: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/1966_FIFA_World_Cup.png/330px-1966_FIFA_World_Cup.png',
  1970: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/1970_FIFA_World_Cup.svg/330px-1970_FIFA_World_Cup.svg.png',
  1974: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/FIFA_World_Cup_1974_-_emblem.svg/330px-FIFA_World_Cup_1974_-_emblem.svg.png',
  1978: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Logo_Mundial_78.svg/330px-Logo_Mundial_78.svg.png',
  1982: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/32/1982_FIFA_World_Cup.svg/330px-1982_FIFA_World_Cup.svg.png',
  1986: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/1986_FIFA_World_Cup.svg/330px-1986_FIFA_World_Cup.svg.png',
  1990: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/1990_FIFA_World_Cup.svg/330px-1990_FIFA_World_Cup.svg.png',
  1994: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/1994_FIFA_World_Cup.svg/330px-1994_FIFA_World_Cup.svg.png',
  1998: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/1998_FIFA_World_Cup.svg/330px-1998_FIFA_World_Cup.svg.png',
  2002: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/2002_FIFA_World_Cup_logo.svg/330px-2002_FIFA_World_Cup_logo.svg.png',
  2006: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/2006_FIFA_World_Cup.svg/330px-2006_FIFA_World_Cup.svg.png',
  2010: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/2010_FIFA_World_Cup.svg/330px-2010_FIFA_World_Cup.svg.png',
  2014: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/2014_FIFA_World_Cup.svg/330px-2014_FIFA_World_Cup.svg.png',
  2018: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/2018_FIFA_World_Cup.svg/330px-2018_FIFA_World_Cup.svg.png',
  2022: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  2026: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/330px-2026_FIFA_World_Cup_emblem.svg.png',
}

const data = JSON.parse(readFileSync(dataFile, 'utf8'))
const images = data.images
let fixed = 0

for (const [key, entry] of Object.entries(images)) {
  const [yearStr, type] = key.split(':')
  const year = parseInt(yearStr)

  // Fix emblem thumbUrls with correct per-year images
  if (type === 'emblem' && CORRECT_EMBLEM_URLS[year]) {
    if (entry.thumbUrl !== CORRECT_EMBLEM_URLS[year]) {
      entry.thumbUrl = CORRECT_EMBLEM_URLS[year]
      entry.sourceUrl = `https://en.wikipedia.org/wiki/${year}_FIFA_World_Cup`
      fixed++
      console.log(`Updated emblem ${year}: new thumbUrl`)
    }
    // Clear wrong .png file refs (1930/1934/1938 all had 2022 Qatar emblem)
    if (entry.file && entry.file.endsWith('.png')) {
      delete entry.file
      console.log(`Cleared wrong .png file for ${key}`)
    }
  }

  // Clear all .svg file refs (all placeholder dark gradient SVGs)
  if (entry.file && entry.file.endsWith('.svg')) {
    delete entry.file
    console.log(`Cleared placeholder .svg file for ${key}`)
    fixed++
  }
}

writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
console.log(`\nDone. ${fixed} entries updated.`)
console.log('Emblem file refs cleared, correct Wikipedia thumbnails set for all years.')
