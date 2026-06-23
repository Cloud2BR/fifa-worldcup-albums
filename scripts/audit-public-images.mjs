import fs from 'node:fs'
import path from 'node:path'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const root = 'public/images'
const teams = readJson('src/data/teams.json')
const playerImages = readJson('src/data/playerImages.json').images || {}
const entityImages = readJson('src/data/entityImages.json').images || {}
const satelliteRefs = readJson('src/data/mapSatelliteReferences.json').items || []
const photoRefs = readJson('src/data/mapPhotoReferences.json').items || []

const teamCodes = Object.keys(teams)
const teamDir = path.join(root, 'teams')
const teamFiles = new Set(fs.existsSync(teamDir) ? fs.readdirSync(teamDir) : [])

const missingTeamCodes = teamCodes.filter(
  (code) => !teamFiles.has(`${code}.png`) && !teamFiles.has(`${code}.jpg`) && !teamFiles.has(`${code}.webp`),
)

let playerLocalFiles = 0
for (const entry of Object.values(playerImages)) {
  if (entry?.file && fs.existsSync(path.join(root, 'players', entry.file))) {
    playerLocalFiles += 1
  }
}

let entityLocalFiles = 0
for (const entry of Object.values(entityImages)) {
  if (entry?.file && fs.existsSync(path.join(root, 'entities', entry.file))) {
    entityLocalFiles += 1
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  teamCodes: teamCodes.length,
  teamImageFiles: teamFiles.size,
  missingTeamCodes: missingTeamCodes.length,
  missingTeamCodeList: missingTeamCodes,
  mappedPlayers: Object.keys(playerImages).length,
  playerLocalFiles,
  mappedEntities: Object.keys(entityImages).length,
  entityLocalFiles,
  mapSatelliteReferences: satelliteRefs.length,
  mapPhotoReferences: photoRefs.length,
}

fs.writeFileSync('src/data/publicImageAudit.json', `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

console.log(JSON.stringify(summary, null, 2))
if (missingTeamCodes.length) {
  console.log(`MISSING_TEAM_CODES=${missingTeamCodes.join(',')}`)
}
