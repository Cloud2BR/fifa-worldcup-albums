export function filterWorldCups(worldCups, { winner = 'all' }) {
  return worldCups.filter((cup) => winner === 'all' || cup.winner === winner)
}
