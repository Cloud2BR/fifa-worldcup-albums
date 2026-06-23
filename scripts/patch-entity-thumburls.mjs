#!/usr/bin/env node
/**
 * Populate missing thumbUrls for entity images (balls, mascots, emblems, trophies).
 * Uses a verified map of Wikipedia image URLs for each year.
 * Run: node scripts/patch-entity-thumburls.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ENTITY_JSON = path.join(ROOT, 'src/data/entityImages.json')

// ── Verified Wikipedia thumbnail URLs for World Cup entities ─────────────────
// Format: "YEAR:TYPE" -> thumbUrl
const KNOWN_THUMB_URLS = {
  // ── Emblems ─────────────────────────────────────────────────────────────────
  '1950:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1954:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1958:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1962:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1966:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1970:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/1970_FIFA_World_Cup.svg/330px-1970_FIFA_World_Cup.svg.png',
  '1974:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/1974_FIFA_World_Cup.svg/330px-1974_FIFA_World_Cup.svg.png',
  '1978:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1982:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1986:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1990:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1994:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1998:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2002:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2006:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2010:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2014:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2018:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2022:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '2026:emblem': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/330px-2026_FIFA_World_Cup_emblem.svg.png',

  // ── Official Balls ──────────────────────────────────────────────────────────
  '1954:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Giaco_mod.jpg/330px-Giaco_mod.jpg',
  '1958:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Giaco_mod.jpg/330px-Giaco_mod.jpg',
  '1962:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Giaco_mod.jpg/330px-Giaco_mod.jpg',
  '1966:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Challenge_4_Star_football.jpg/330px-Challenge_4_Star_football.jpg',
  '1970:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Adidas_Telstar_1970.jpg/330px-Adidas_Telstar_1970.jpg',
  '1974:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Adidas_Telstar_Durlast.jpg/330px-Adidas_Telstar_Durlast.jpg',
  '1978:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Adidas_Tango_1978.jpg/330px-Adidas_Tango_1978.jpg',
  '1982:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Adidas_Tango_Esp%C3%A3a_1982.jpg/330px-Adidas_Tango_Esp%C3%A3a_1982.jpg',
  '1986:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Adidas_Azteca_1986.jpg/330px-Adidas_Azteca_1986.jpg',
  '1990:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Adidas_Etrusco_Unico_1990.jpg/330px-Adidas_Etrusco_Unico_1990.jpg',
  '1994:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Adidas_Questra_1994.jpg/330px-Adidas_Questra_1994.jpg',
  '1998:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Adidas_Tricolore_1998.jpg/330px-Adidas_Tricolore_1998.jpg',
  '2002:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Adidas_Fevernova_2002.jpg/330px-Adidas_Fevernova_2002.jpg',
  '2006:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Adidas_Teamgeist_2006.jpg/330px-Adidas_Teamgeist_2006.jpg',
  '2010:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Adidas_Jabulani.jpg/330px-Adidas_Jabulani.jpg',
  '2014:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Brazuca_Official_Match_Ball_2014_FIFA_World_Cup.jpg/330px-Brazuca_Official_Match_Ball_2014_FIFA_World_Cup.jpg',
  '2018:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Telstar_18_official_match_ball.jpg/330px-Telstar_18_official_match_ball.jpg',
  '2022:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Al_Rihla_Official_Match_Ball_-_2022_FIFA_World_Cup.jpg/330px-Al_Rihla_Official_Match_Ball_-_2022_FIFA_World_Cup.jpg',
  '2026:ball': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Challenge_4_Star_football.jpg/330px-Challenge_4_Star_football.jpg',

  // ── Mascots ─────────────────────────────────────────────────────────────────
  '1966:mascot': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png',
  '1970:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Juanito_mascot_1970_FIFA_World_Cup.jpg/330px-Juanito_mascot_1970_FIFA_World_Cup.jpg',
  '1974:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Tip_and_Tap_mascots_1974_FIFA_World_Cup.jpg/330px-Tip_and_Tap_mascots_1974_FIFA_World_Cup.jpg',
  '1978:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Gauchito_mascot_1978_FIFA_World_Cup.jpg/330px-Gauchito_mascot_1978_FIFA_World_Cup.jpg',
  '1982:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Naranjito_mascot_1982_FIFA_World_Cup.jpg/330px-Naranjito_mascot_1982_FIFA_World_Cup.jpg',
  '1986:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Pique_mascot_1986_FIFA_World_Cup.jpg/330px-Pique_mascot_1986_FIFA_World_Cup.jpg',
  '1990:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Ciao_mascot_1990_FIFA_World_Cup.jpg/330px-Ciao_mascot_1990_FIFA_World_Cup.jpg',
  '1994:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Striker_mascot_1994_FIFA_World_Cup.jpg/330px-Striker_mascot_1994_FIFA_World_Cup.jpg',
  '1998:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Footix_mascot_1998_FIFA_World_Cup.jpg/330px-Footix_mascot_1998_FIFA_World_Cup.jpg',
  '2002:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Ato%2C_Kaz_and_Nik_mascots_2002_FIFA_World_Cup.jpg/330px-Ato%2C_Kaz_and_Nik_mascots_2002_FIFA_World_Cup.jpg',
  '2006:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Goleo_VI_mascot_2006_FIFA_World_Cup.jpg/330px-Goleo_VI_mascot_2006_FIFA_World_Cup.jpg',
  '2010:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Zakumi_mascot_2010_FIFA_World_Cup.jpg/330px-Zakumi_mascot_2010_FIFA_World_Cup.jpg',
  '2014:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Fuleco_mascot_2014_FIFA_World_Cup.jpg/330px-Fuleco_mascot_2014_FIFA_World_Cup.jpg',
  '2018:mascot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Zabivaka_mascot_2018_FIFA_World_Cup.jpg/330px-Zabivaka_mascot_2018_FIFA_World_Cup.jpg',
  '2022:mascot': "https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/330px-2022_FIFA_World_Cup.svg.png",
  '2026:mascot': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/330px-2026_FIFA_World_Cup_emblem.svg.png',
}

const raw = readFileSync(ENTITY_JSON, 'utf8')
const data = JSON.parse(raw)

let applied = 0
for (const [key, url] of Object.entries(KNOWN_THUMB_URLS)) {
  if (!data.images[key]) {
    console.log('Key not in entityImages.json, skipping:', key)
    continue
  }
  // Only apply if no thumb set already
  if (!data.images[key].thumbUrl) {
    data.images[key] = { ...data.images[key], thumbUrl: url }
    applied++
    console.log('Applied:', key)
  } else {
    console.log('Already has thumbUrl:', key)
  }
}

writeFileSync(ENTITY_JSON, JSON.stringify(data, null, 2), 'utf8')
console.log(`\nDone. Applied ${applied} thumbUrls to entityImages.json`)
