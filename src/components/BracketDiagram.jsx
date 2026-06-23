import { useMemo } from 'react'

// Ordered phases for the main bracket flow (3rd place handled separately)
const BRACKET_PHASES = ['R16', 'QF', 'SF', 'Final']

const PHASE_LABELS = {
  R16: 'Round of 16',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  Final: 'Final',
  '3rd': '3rd Place Play-off',
}

// Context notes for tournaments that used a non-standard format
const FORMAT_NOTES = {
  1930: 'The 1930 World Cup had no quarterfinals — group winners advanced directly to the semi-finals.',
  1950: 'The 1950 World Cup used a final round-robin group of 4 teams instead of knockout semi-finals and a final. The match shown below is the decisive last game, known as the "Maracanazo".',
  1974: 'The 1974 World Cup replaced quarterfinals with a second group stage. The bracket shows the 3rd-place playoff and Final only.',
  1978: 'The 1978 World Cup replaced quarterfinals with a second group stage. The bracket shows the 3rd-place playoff and Final only.',
  1982: 'The 1982 World Cup had a second group stage and no quarterfinals or round of 16. The bracket shows semi-finals onward.',
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function WinTypeBadge({ match }) {
  if (match.penalties) {
    return (
      <span className="shrink-0 rounded bg-violet-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-200">
        Pens&nbsp;{match.penalties}
      </span>
    )
  }
  if (match.extraTime) {
    return (
      <span className="shrink-0 rounded bg-sky-800/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-200">
        AET
      </span>
    )
  }
  return null
}

function MatchCard({ match, champion, size = 'normal' }) {
  const homeWon = match.winner === match.home
  const awayWon = match.winner === match.away
  const homeIsChamp = champion && match.home === champion
  const awayIsChamp = champion && match.away === champion
  const champInMatch = homeIsChamp || awayIsChamp
  const isFinal = match.phase === 'Final'

  const [homeGoals, awayGoals] = (match.score ?? '-').split('-').map((s) => s.trim())

  const nameClass = size === 'large' ? 'text-sm' : 'text-xs'
  const scoreClass = size === 'large' ? 'text-xl font-black' : 'text-base font-bold'

  const teamRow = (name, goals, won, isChamp) => (
    <div
      className={[
        'flex items-center gap-2 px-3 py-2',
        won ? 'bg-slate-800/60' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex-1 truncate font-medium',
          nameClass,
          won && isChamp ? 'text-amber-300 font-bold' : won ? 'text-white' : 'text-slate-400',
        ].join(' ')}
      >
        {won && isChamp ? '🏆 ' : ''}{name}
      </span>
      <span
        className={[
          'shrink-0 tabular-nums',
          scoreClass,
          won && isChamp ? 'text-amber-300' : won ? 'text-white' : 'text-slate-500',
        ].join(' ')}
      >
        {goals ?? '-'}
      </span>
    </div>
  )

  return (
    <article
      className={[
        'overflow-hidden rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
        isFinal
          ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/40 to-slate-900 ring-1 ring-amber-500/30 shadow-amber-900/20'
          : champInMatch
          ? 'border-amber-400/40 bg-slate-900 ring-1 ring-amber-400/15'
          : 'border-slate-700 bg-slate-900 hover:border-slate-500',
      ].join(' ')}
    >
      {/* Meta row: date + win-type badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 px-3 py-1">
        <span className="text-[10px] text-slate-500">{formatDate(match.date) ?? ''}</span>
        <WinTypeBadge match={match} />
      </div>

      {teamRow(match.home, homeGoals, homeWon, homeIsChamp)}

      {/* Score divider */}
      <div className="flex items-center gap-1 border-y border-slate-800/60 bg-slate-950/50 px-3 py-1">
        <div className="flex-1 border-t border-dashed border-slate-700/60" />
        <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">vs</span>
        <div className="flex-1 border-t border-dashed border-slate-700/60" />
      </div>

      {teamRow(match.away, awayGoals, awayWon, awayIsChamp)}
    </article>
  )
}

function PhaseColumn({ phase, matches, champion }) {
  const isFinalPhase = phase === 'Final'
  return (
    <section className="flex min-w-[155px] flex-1 flex-col" aria-label={PHASE_LABELS[phase]}>
      {/* Phase header */}
      <div className="mb-3 text-center">
        <h4
          className={[
            'text-[10px] font-bold uppercase tracking-widest',
            isFinalPhase ? 'text-amber-400' : 'text-sky-300',
          ].join(' ')}
        >
          {PHASE_LABELS[phase]}
        </h4>
        <p className="mt-0.5 text-[10px] text-slate-500">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </div>

      {/* Match cards, vertically centered in available space */}
      <div className="flex flex-1 flex-col justify-around gap-2.5">
        {matches.map((match, idx) => (
          <MatchCard
            key={`${match.year}-${phase}-${idx}`}
            match={match}
            champion={champion}
            size={isFinalPhase ? 'large' : 'normal'}
          />
        ))}
      </div>
    </section>
  )
}

function ConnectorArrow() {
  return (
    <div className="flex shrink-0 items-center self-center text-slate-600" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10 H14 M10 5 L15 10 L10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function BracketDiagram({ matches, champion }) {
  const { byPhase, thirdMatch, year } = useMemo(() => {
    const byPhase = Object.fromEntries(BRACKET_PHASES.map((p) => [p, []]))
    let thirdMatch = null
    let year = null
    for (const m of matches) {
      if (!year) year = m.year
      if (m.phase === '3rd') { thirdMatch = m; continue }
      if (byPhase[m.phase]) byPhase[m.phase].push(m)
    }
    return { byPhase, thirdMatch, year }
  }, [matches])

  const activePhases = BRACKET_PHASES.filter((p) => byPhase[p].length > 0)
  const formatNote = year ? FORMAT_NOTES[year] : null

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">No match data available for this tournament.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Format note for non-standard tournaments */}
      {formatNote && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-800/40 bg-sky-950/30 px-4 py-2.5 text-xs leading-relaxed text-sky-300">
          <span className="mt-0.5 shrink-0 text-base">ℹ️</span>
          <span>{formatNote}</span>
        </div>
      )}

      {/* Main bracket */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900/60 p-4">
        <div className="flex min-w-max items-start gap-1">
          {activePhases.map((phase, idx) => (
            <div key={phase} className="flex items-start gap-1">
              <PhaseColumn phase={phase} matches={byPhase[phase]} champion={champion} />
              {idx < activePhases.length - 1 && <ConnectorArrow />}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-slate-600">
          🏆 Champion path highlighted in amber · Scroll horizontally on small screens
        </p>
      </div>

      {/* 3rd place play-off */}
      {thirdMatch && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {PHASE_LABELS['3rd']}
          </h4>
          <div className="max-w-xs">
            <MatchCard match={thirdMatch} champion={null} size="normal" />
          </div>
        </div>
      )}
    </div>
  )
}

export default BracketDiagram
