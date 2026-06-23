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

// Normalize "West Germany" → "Germany" for continuity across eras
function normalizeTeam(name) {
  return name === 'West Germany' ? 'Germany' : name
}

/** Cumulative title count per major nation at each tournament year */
export function buildCumulativeTitlesData(worldCups) {
  const TRACKED = ['Brazil', 'Germany', 'Italy', 'Argentina', 'France', 'Uruguay', 'England', 'Spain']
  const COLORS = {
    Brazil:    '#facc15',
    Germany:   '#38bdf8',
    Italy:     '#4ade80',
    Argentina: '#818cf8',
    France:    '#f472b6',
    Uruguay:   '#fb923c',
    England:   '#e2e8f0',
    Spain:     '#f87171',
  }
  const counts = Object.fromEntries(TRACKED.map((t) => [t, 0]))
  const series = Object.fromEntries(TRACKED.map((t) => [t, []]))

  for (const cup of worldCups) {
    const winner = normalizeTeam(cup.winner)
    if (counts[winner] !== undefined) counts[winner]++
    for (const team of TRACKED) series[team].push(counts[team])
  }

  return {
    labels: worldCups.map((c) => c.year),
    datasets: TRACKED.map((team) => ({
      label: team,
      data: series[team],
      borderColor: COLORS[team],
      backgroundColor: COLORS[team] + '18',
      pointBackgroundColor: COLORS[team],
      pointBorderColor: COLORS[team],
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 7,
      tension: 0,
      stepped: true,
    })),
  }
}

/** Top 10 nations by total World Cup final appearances, split wins vs runner-up */
export function buildFinalsAppearancesData(worldCups) {
  const wins = {}
  const ruUps = {}
  for (const cup of worldCups) {
    const w = normalizeTeam(cup.winner)
    const r = normalizeTeam(cup.runnerUp)
    wins[w] = (wins[w] || 0) + 1
    ruUps[r] = (ruUps[r] || 0) + 1
  }
  const all = new Set([...Object.keys(wins), ...Object.keys(ruUps)])
  const sorted = [...all]
    .sort((a, b) => ((wins[b] || 0) + (ruUps[b] || 0)) - ((wins[a] || 0) + (ruUps[a] || 0)))
    .slice(0, 10)

  return {
    labels: sorted,
    datasets: [
      {
        label: 'Champion',
        data: sorted.map((t) => wins[t] || 0),
        backgroundColor: 'rgba(250, 204, 21, 0.85)',
        borderColor: '#facc15',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Runner-up',
        data: sorted.map((t) => ruUps[t] || 0),
        backgroundColor: 'rgba(100, 116, 139, 0.65)',
        borderColor: '#64748b',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
}

/** Goal difference in each World Cup final, coloured by drama level */
export function buildFinalMarginsData(worldCups) {
  const colors = []
  const margins = []

  for (const cup of worldCups) {
    const fs = cup.finalScore ?? ''
    const hasPens = /pens/i.test(fs) || /\(\d+-\d+\)/.test(fs)
    if (hasPens) {
      margins.push(0)
      colors.push('rgba(251, 191, 36, 0.85)')   // amber — shootout
    } else {
      const m = fs.match(/(\d+)\s*[-–]\s*(\d+)/)
      if (m) {
        const diff = Math.abs(Number(m[1]) - Number(m[2]))
        margins.push(diff)
        colors.push(diff >= 2 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(56, 189, 248, 0.85)')
      } else {
        margins.push(0)
        colors.push('rgba(100, 116, 139, 0.5)')
      }
    }
  }

  return {
    labels: worldCups.map((c) => c.year),
    datasets: [
      {
        label: 'Goal difference',
        data: margins,
        backgroundColor: colors,
        borderColor: colors.map((c) => c.replace(/[\d.]+\)$/, '1)')),
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 28,
      },
    ],
  }
}

/** UEFA vs CONMEBOL World Cup wins grouped by decade */
export function buildContinentalRivalryData(worldCups) {
  const CONMEBOL = new Set(['Uruguay', 'Brazil', 'Argentina'])
  const decades = {}
  for (const cup of worldCups) {
    const label = `${Math.floor(cup.year / 10) * 10}s`
    if (!decades[label]) decades[label] = { UEFA: 0, CONMEBOL: 0 }
    const winner = normalizeTeam(cup.winner)
    if (CONMEBOL.has(winner)) decades[label].CONMEBOL++
    else decades[label].UEFA++
  }
  const labels = Object.keys(decades)
  return {
    labels,
    datasets: [
      {
        label: 'UEFA (Europe)',
        data: labels.map((d) => decades[d].UEFA),
        backgroundColor: 'rgba(96, 165, 250, 0.85)',
        borderColor: '#60a5fa',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 36,
      },
      {
        label: 'CONMEBOL (S. America)',
        data: labels.map((d) => decades[d].CONMEBOL),
        backgroundColor: 'rgba(250, 204, 21, 0.85)',
        borderColor: '#facc15',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 36,
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
