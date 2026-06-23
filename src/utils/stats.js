export function buildQuickStats(worldCups, albums) {
  const totalMatches = worldCups.reduce((sum, cup) => sum + (cup.matches || 0), 0)
  const totalGoals = worldCups.reduce((sum, cup) => sum + (cup.goals || 0), 0)
  return {
    tournaments: worldCups.length,
    uniqueWinners: new Set(worldCups.map((cup) => cup.winner)).size,
    totalGoals,
    totalMatches,
    goalsPerMatch: totalMatches > 0 ? Math.round((totalGoals / totalMatches) * 100) / 100 : 0,
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
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#bae6fd',
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true,
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
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#86efac',
        pointRadius: 2,
        pointHoverRadius: 5,
        stepped: true,
      },
      {
        label: 'Matches',
        data: worldCups.map((cup) => cup.matches),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.3)',
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fdba74',
        pointRadius: 2,
        pointHoverRadius: 5,
        stepped: true,
      },
    ],
  }
}

export function parseFinalScore(finalScore) {
  if (typeof finalScore !== 'string') return { winnerGoals: null, runnerUpGoals: null }
  const match = finalScore.match(/(\d+)\s*-\s*(\d+)/)
  if (!match) return { winnerGoals: null, runnerUpGoals: null }
  return { winnerGoals: Number(match[1]), runnerUpGoals: Number(match[2]) }
}

export function buildMatchesAndFinalScoreData(worldCups) {
  const scores = worldCups.map((cup) => parseFinalScore(cup.finalScore))
  return {
    labels: worldCups.map((cup) => cup.year),
    datasets: [
      {
        type: 'bar',
        label: 'Matches played',
        data: worldCups.map((cup) => cup.matches),
        backgroundColor: 'rgba(14, 165, 233, 0.6)',
        borderColor: '#0ea5e9',
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 34,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'Final – winner goals',
        data: scores.map((score) => score.winnerGoals),
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.3)',
        pointBackgroundColor: '#facc15',
        pointBorderColor: '#fde68a',
        pointRadius: 3,
        pointHoverRadius: 6,
        spanGaps: true,
        yAxisID: 'yScore',
        tension: 0.3,
        order: 1,
      },
      {
        type: 'line',
        label: 'Final – runner-up goals',
        data: scores.map((score) => score.runnerUpGoals),
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244, 114, 182, 0.3)',
        borderDash: [6, 4],
        pointBackgroundColor: '#f472b6',
        pointBorderColor: '#fbcfe8',
        pointRadius: 3,
        pointHoverRadius: 6,
        spanGaps: true,
        yAxisID: 'yScore',
        tension: 0.3,
        order: 1,
      },
    ],
  }
}

export function buildGoalsByPhaseData(worldCups) {
  const withPhase = worldCups.filter((cup) => cup.goalsByPhase)
  return {
    labels: withPhase.map((cup) => cup.year),
    datasets: [
      {
        label: 'Group',
        data: withPhase.map((cup) => cup.goalsByPhase.group),
        backgroundColor: '#0ea5e9',
        stack: 'goals',
      },
      {
        label: 'R16',
        data: withPhase.map((cup) => cup.goalsByPhase.r16),
        backgroundColor: '#22c55e',
        stack: 'goals',
      },
      {
        label: 'QF',
        data: withPhase.map((cup) => cup.goalsByPhase.qf),
        backgroundColor: '#f97316',
        stack: 'goals',
      },
      {
        label: 'SF',
        data: withPhase.map((cup) => cup.goalsByPhase.sf),
        backgroundColor: '#a855f7',
        stack: 'goals',
      },
      {
        label: '3rd place',
        data: withPhase.map((cup) => cup.goalsByPhase.thirdPlace),
        backgroundColor: '#94a3b8',
        stack: 'goals',
      },
      {
        label: 'Final',
        data: withPhase.map((cup) => cup.goalsByPhase.final),
        backgroundColor: '#facc15',
        stack: 'goals',
      },
    ],
  }
}

export function buildGoalsPerMatchData(worldCups) {
  return {
    labels: worldCups.map((cup) => cup.year),
    datasets: [
      {
        label: 'Goals per match',
        data: worldCups.map((cup) =>
          cup.goalsPerMatch != null
            ? cup.goalsPerMatch
            : cup.matches
              ? Math.round((cup.goals / cup.matches) * 100) / 100
              : null,
        ),
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.3)',
        tension: 0.3,
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
