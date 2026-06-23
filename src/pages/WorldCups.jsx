import { useEffect, useMemo, useState } from 'react'
import ResultsChart from '../components/ResultsChart'
import BracketDiagram from '../components/BracketDiagram'
import worldCups from '../data/worldcups.json'
import matchesData from '../data/matches.json'
import groupStandingsData from '../data/groupStandings.json'
import { filterWorldCups } from '../utils/filters'

function WorldCups() {
  const [winner, setWinner] = useState('all')
  const [activeTab, setActiveTab] = useState('bracket')

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
  const bracketTournamentYears = useMemo(
    () => (winner === 'all' ? allTournamentYears : filtered.map((cup) => cup.year).sort((a, b) => b - a)),
    [winner, filtered, allTournamentYears],
  )

  useEffect(() => {
    if (!bracketTournamentYears.length) {
      setBracketYear(null)
      return
    }

    if (!bracketTournamentYears.includes(bracketYear)) {
      setBracketYear(bracketTournamentYears[0])
    }
  }, [bracketTournamentYears, bracketYear])

  const bracketMatches = useMemo(
    () => matchesData.matches.filter((m) => m.year === bracketYear),
    [bracketYear],
  )
  const bracketCup = useMemo(
    () => worldCups.find((c) => c.year === bracketYear) ?? null,
    [bracketYear],
  )
  const bracketGroupData = useMemo(
    () => (bracketYear ? groupStandingsData[String(bracketYear)] ?? null : null),
    [bracketYear],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">World Cup Results</h2>
        <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-xs text-slate-400">Filters bracket, charts, and table.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('bracket')}
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition',
            activeTab === 'bracket'
              ? 'bg-sky-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          Bracket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition',
            activeTab === 'charts'
              ? 'bg-sky-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          Charts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition',
            activeTab === 'table'
              ? 'bg-sky-500 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          Results Table
        </button>
      </div>

      {activeTab === 'bracket' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Tournament Bracket</h3>
            <label className="flex items-center gap-2 text-sm">
              Tournament
              <select
                value={bracketYear ?? ''}
                onChange={(event) =>
                  setBracketYear(event.target.value ? Number(event.target.value) : null)
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              >
                {bracketTournamentYears.map((year) => {
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
          <BracketDiagram matches={bracketMatches} champion={bracketCup?.winner} groupData={bracketGroupData} />
        </section>
      ) : null}

      {activeTab === 'charts' ? <ResultsChart worldCups={filtered} /> : null}

      {activeTab === 'table' ? (
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
      ) : null}
    </div>
  )
}

export default WorldCups
