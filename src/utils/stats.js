export function buildQuickStats(worldCups, albums) {
  return {
    tournaments: worldCups.length,
    uniqueWinners: new Set(worldCups.map((cup) => cup.winner)).size,
    totalGoals: worldCups.reduce((sum, cup) => sum + cup.goals, 0),
    albums: albums.length,
  }
}

export function buildWinnerTitlesData(worldCups) {
  const counts = worldCups.reduce((acc, cup) => {
    acc[cup.winner] = (acc[cup.winner] || 0) + 1
    return acc
  }, {})

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return {
    labels: entries.map(([team]) => team),
    datasets: [
      {
        label: 'Titles',
        data: entries.map(([, count]) => count),
        backgroundColor: '#0ea5e9',
      },
    ],
  }
}

export function buildGoalsTrendData(worldCups) {
  return {
    labels: worldCups.map((cup) => cup.year),
    datasets: [
      {
        label: 'Goals',
        data: worldCups.map((cup) => cup.goals),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.3)',
      },
    ],
  }
}

export function buildTeamsMatchesData(worldCups) {
  return {
    labels: worldCups.map((cup) => cup.year),
    datasets: [
      {
        label: 'Teams',
        data: worldCups.map((cup) => cup.teams),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
      },
      {
        label: 'Matches',
        data: worldCups.map((cup) => cup.matches),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.3)',
      },
    ],
  }
}

export function mergeTimelineData(worldCups, albums) {
  const albumByYear = new Map(albums.map((album) => [album.year, album]))

  return worldCups
    .filter((cup) => albumByYear.has(cup.year))
    .map((cup) => ({ ...cup, ...albumByYear.get(cup.year) }))
}
