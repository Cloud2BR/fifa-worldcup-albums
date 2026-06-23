import fs from 'node:fs/promises'

const squads = JSON.parse(await fs.readFile('src/data/tournamentSquads.json', 'utf8'))

const out = {}
for (const [year, teamMap] of Object.entries(squads)) {
  const teams = Object.keys(teamMap || {})
  let players = 0
  for (const team of teams) {
    players += (teamMap[team] || []).length
  }
  out[year] = { teams: teams.length, players }
}

console.log(JSON.stringify(out, null, 2))
