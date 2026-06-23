import { useMemo } from 'react'

const PHASES = ['R16', 'QF', 'SF', '3rd', 'Final']
const PHASE_LABELS = {
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  '3rd': 'Third place',
  Final: 'Final',
}

function formatResult(match) {
  let result = match.score
  if (match.extraTime) result += ' (a.e.t.)'
  if (match.penalties) result += ` · pens ${match.penalties}`
  return result
}

function MatchCard({ match, champion }) {
  const homeWon = match.winner === match.home
  const awayWon = match.winner === match.away
  const homeIsChampion = champion && match.home === champion
  const awayIsChampion = champion && match.away === champion
  const isChampionMatch = homeIsChampion || awayIsChampion

  const teamRow = (team, won, isChampionTeam) => (
    <div
      className={[
        'flex items-center justify-between gap-2 px-2 py-1.5 text-xs sm:text-sm',
        won ? 'font-semibold text-white' : 'text-slate-400',
        isChampionTeam && won ? 'text-amber-300' : '',
      ].join(' ')}
    >
      <span className="truncate">{team}</span>
      {won ? <span aria-hidden="true" className="text-[10px]">▶</span> : null}
    </div>
  )

  return (
    <article
      className={[
        'overflow-hidden rounded-lg border bg-slate-900/95 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/50',
        isChampionMatch && match.winner === champion
          ? 'border-amber-400/70 ring-1 ring-amber-400/40'
          : 'border-slate-700',
      ].join(' ')}
      title={match.date ? `${match.phase} · ${match.date}` : match.phase}
    >
      {teamRow(match.home, homeWon, homeIsChampion)}
      <div className="border-t border-slate-800" />
      {teamRow(match.away, awayWon, awayIsChampion)}
      <div className="border-t border-slate-800 bg-slate-950/80 px-2 py-1 text-center font-mono text-[10px] text-slate-300">
        {formatResult(match)}
      </div>
    </article>
  )
}

function BracketDiagram({ matches, champion }) {
  const byPhase = useMemo(() => {
    const map = Object.fromEntries(PHASES.map((p) => [p, []]))
    for (const match of matches) {
      if (map[match.phase]) map[match.phase].push(match)
    }
    return map
  }, [matches])

  const hasAny = matches.length > 0
  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        Knockout-stage match data is not yet available for this tournament.
        <br />
        Older tournaments can be backfilled by extending{' '}
        <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-xs">src/data/matches.json</code>.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/70 to-slate-950/30 p-3 sm:p-4">
      <div className="flex min-w-[760px] items-start gap-3 sm:gap-4">
        {PHASES.map((phase) => {
          const phaseMatches = byPhase[phase]
          if (phaseMatches.length === 0) return null
          return (
            <section
              key={phase}
              className="flex flex-1 min-w-[140px] flex-col"
              aria-label={PHASE_LABELS[phase]}
            >
              <h4 className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-sky-300">
                {PHASE_LABELS[phase]}
              </h4>
              <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-slate-500">
                {phaseMatches.length} {phaseMatches.length === 1 ? 'match' : 'matches'}
              </p>
              <div
                className={[
                  'flex flex-1 flex-col gap-2',
                  phase === 'R16' ? 'justify-between' : 'justify-around',
                ].join(' ')}
              >
                {phaseMatches.map((match, idx) => (
                  <MatchCard
                    key={`${match.year}-${match.phase}-${idx}`}
                    match={match}
                    champion={champion}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-slate-500">
        Champion path highlighted in amber. Scroll horizontally on small screens.
      </p>
    </div>
  )
}

export default BracketDiagram
