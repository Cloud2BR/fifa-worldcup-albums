import fs from 'node:fs/promises'

const squads = JSON.parse(await fs.readFile('src/data/tournamentSquads.json', 'utf8'))
const winners = JSON.parse(await fs.readFile('src/data/winnerSquads.json', 'utf8'))

console.log('tournamentSquads years:', Object.keys(squads).join(','))
console.log('winnerSquads years:', Object.keys(winners).join(','))
