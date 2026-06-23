import { useMemo, useState } from 'react'
import ResultsChart from '../components/ResultsChart'
import BracketDiagram from '../components/BracketDiagram'
import worldCups from '../data/worldcups.json'
import matchesData from '../data/matches.json'
import { filterWorldCups } from '../utils/filters'

function WorldCups() {
  const [winner, setWinner] = useState('all')

  const winners = useMemo(
    () => ['all', ...new Set(worldCups.map((cup) => cup.winner).sort())],
    [],
  )

  const filtered = useMemo(() => filterWorldCups(worldCups, { winner }), [winner])

  // Show every tournament year in the selector, even when detailed bracket matches are missing.
  const allTournamentYears = useMemo(
    () => worldCups.map((cup) => cup.year).sort((a, b) => b - a),
    [],
  )
  const [bracketYear, setBracketYear] = useState(allTournamentYears[0] ?? null)
  const bracketMatches = useMemo(
    () => matchesData.matches.filter((m) => m.year === bracketYear),
    [bracketYear],
  )
  const bracketCup = useMemo(
    () => worldCups.find((c) => c.year === bracketYear) ?? null,
    [bracketYear],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">World Cup Results</h2>
        <label className="flex items-center gap-2 text-sm">
          Winner
          <select
            value={winner}
            onChange={(event) => setWinner(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
          >
            {winners.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">Knockout Bracket</h3>
          <label className="flex items-center gap-2 text-sm">
            Tournament
            <select
              value={bracketYear ?? ''}
              onChange={(event) =>
                setBracketYear(event.target.value ? Number(event.target.value) : null)
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
            >
              {allTournamentYears.map((year) => {
                const cup = worldCups.find((c) => c.year === year)
                return (
                  <option key={year} value={year}>
                    {year} {cup ? `— ${cup.host}` : ''}
                  </option>
                )
              })}
            </select>
          </label>
        </div>
        {bracketCup ? (
          <p className="text-xs text-slate-400">
            Champion: <span className="font-semibold text-amber-300">🏆 {bracketCup.winner}</span>
            {' · '}Runner-up: <span className="text-slate-200">{bracketCup.runnerUp}</span>
            {' · '}Final: <span className="font-mono text-slate-200">{bracketCup.finalScore}</span>
          </p>
        ) : null}
        <BracketDiagram matches={bracketMatches} champion={bracketCup?.winner} />
      </section>

      <ResultsChart worldCups={worldCups} />

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-left text-slate-300">
            <tr>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Host</th>
              <th className="px-3 py-2">Winner</th>
              <th className="px-3 py-2">Runner-up</th>
              <th className="px-3 py-2">Final Score</th>
              <th className="px-3 py-2">Goals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((cup) => (
              <tr key={cup.year} className="bg-slate-950/50">
                <td className="px-3 py-2">{cup.year}</td>
                <td className="px-3 py-2">{cup.host}</td>
                <td className="px-3 py-2">{cup.winner}</td>
                <td className="px-3 py-2">{cup.runnerUp}</td>
                <td className="px-3 py-2">{cup.finalScore}</td>
                <td className="px-3 py-2">{cup.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorldCups
