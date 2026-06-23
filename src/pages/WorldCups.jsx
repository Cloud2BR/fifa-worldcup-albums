import { useMemo, useState } from 'react'
import ResultsChart from '../components/ResultsChart'
import worldCups from '../data/worldcups.json'
import { filterWorldCups } from '../utils/filters'

function WorldCups() {
  const [winner, setWinner] = useState('all')

  const winners = useMemo(
    () => ['all', ...new Set(worldCups.map((cup) => cup.winner).sort())],
    [],
  )

  const filtered = useMemo(() => filterWorldCups(worldCups, { winner }), [winner])

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
