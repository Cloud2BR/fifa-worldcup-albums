import { useMemo } from 'react'

// Ordered phases for the main bracket flow (3rd place handled separately)
const BRACKET_PHASES = ['R32', 'R16', 'QF', 'SF', 'Final']

const PHASE_LABELS = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  Final: 'Final',
  '3rd': '3rd Place Play-off',
}

const MATCH_LIST_PHASE_ORDER = ['R32', 'R16', 'QF', 'SF', '3rd', 'Final']

// Context notes for tournaments that used a non-standard format
const FORMAT_NOTES = {
  1930: 'The 1930 World Cup had no quarterfinals — group winners advanced directly to the semi-finals.',
  1950: 'The 1950 World Cup used a final round-robin group of 4 teams instead of knockout semi-finals and a final. The match shown below is the decisive last game, known as the "Maracanazo".',
  1974: 'The 1974 World Cup replaced quarterfinals with a second group stage. The bracket shows the 3rd-place playoff and Final only.',
  1978: 'The 1978 World Cup replaced quarterfinals with a second group stage. The bracket shows the 3rd-place playoff and Final only.',
  1982: 'The 1982 World Cup had a second group stage and no quarterfinals or round of 16. The bracket shows semi-finals onward.',
  2026: 'The 2026 World Cup uses a 48-team format with a Round of 32 after the group stage. The bracket below updates as knockout fixtures and results are confirmed.',
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function sortMatchesByDate(a, b) {
  const aTs = a.date ? Date.parse(a.date) : Number.MAX_SAFE_INTEGER
  const bTs = b.date ? Date.parse(b.date) : Number.MAX_SAFE_INTEGER
  if (aTs !== bTs) return aTs - bTs
  return `${a.home}-${a.away}`.localeCompare(`${b.home}-${b.away}`)
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

function GroupTable({ group, adv }) {
  const hasStats = group.teams.some((t) => typeof t.p === 'number')
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <div className="border-b border-slate-700 bg-slate-800/60 px-2 py-1.5">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-sky-300">{group.name}</h5>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-[9px] uppercase tracking-wide text-slate-500">
            <th className="w-4 px-1 py-1 text-center">#</th>
            <th className="px-2 py-1 text-left">Team</th>
            {hasStats ? (
              <>
                <th className="px-1 py-1 text-center">P</th>
                <th className="px-1 py-1 text-center">W</th>
                <th className="px-1 py-1 text-center">D</th>
                <th className="px-1 py-1 text-center">L</th>
                <th className="px-1 py-1 text-center">GF</th>
                <th className="px-1 py-1 text-center">GA</th>
              </>
            ) : null}
            <th className="px-1 py-1 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.teams.map((team, idx) => {
            const name = typeof team === 'string' ? team : team.t
            const pts = typeof team === 'object' ? team.pts : null
            const advanced = typeof adv === 'number' ? idx < adv : false
            const advThird = typeof team === 'object' && team.adv3 === true
            const isAdv = advanced || advThird
            const isTbd = name === 'TBD' || name?.startsWith('Group')
            return (
              <tr
                key={name}
                className={[
                  'border-b border-slate-800/60 last:border-b-0',
                  isAdv ? 'bg-emerald-950/40' : '',
                ].join(' ')}
              >
                <td className="px-1 py-1 text-center text-slate-500">{idx + 1}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    {isAdv && !isTbd ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title="Advanced to knockout stage" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
                    )}
                    <span className={[
                      'truncate font-medium max-w-[90px]',
                      isAdv && !isTbd ? 'text-emerald-300' : isTbd ? 'text-slate-600 italic' : 'text-slate-300',
                    ].join(' ')}>
                      {name}
                    </span>
                  </div>
                </td>
                {hasStats ? (
                  <>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.p ?? '-'}</td>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.w ?? '-'}</td>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.d ?? '-'}</td>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.l ?? '-'}</td>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.gf ?? '-'}</td>
                    <td className="px-1 py-1 text-center text-slate-400 tabular-nums">{team.ga ?? '-'}</td>
                  </>
                ) : null}
                <td className="px-1 py-1 text-center font-bold tabular-nums">
                  <span className={isAdv && !isTbd ? 'text-emerald-300' : 'text-slate-300'}>
                    {pts ?? '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function GroupRound({ round }) {
  const cols = round.groups.length <= 4 ? round.groups.length : Math.min(4, Math.ceil(round.groups.length / 2))
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[Math.min(cols, 4)] ?? 'grid-cols-2 lg:grid-cols-4'

  return (
    <div className="space-y-2">
      <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{round.label}</h5>
      {round.advNote && (
        <p className="text-[10px] text-amber-400/80">{round.advNote}</p>
      )}
      <div className={`grid gap-2 ${gridClass}`}>
        {round.groups.map((group) => (
          <GroupTable key={group.name} group={group} adv={round.adv} />
        ))}
      </div>
    </div>
  )
}

function GroupStageSection({ groupData }) {
  if (!groupData) return null

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-300">Group Stage</h4>
        {groupData.format && (
          <span className="text-[10px] text-slate-500">{groupData.format}</span>
        )}
      </div>
      {groupData.note && (
        <div className="flex items-start gap-2 rounded-lg border border-sky-800/40 bg-sky-950/30 px-3 py-2 text-xs leading-relaxed text-sky-300">
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>{groupData.note}</span>
        </div>
      )}
      <div className="space-y-5">
        {groupData.rounds.map((round) => (
          <GroupRound key={round.label} round={round} />
        ))}
      </div>
      <p className="text-[10px] text-slate-600">
        🟢 Green dot = advanced to knockout stage
      </p>
    </div>
  )
}

function MatchResultsByStage({ matches, groupData }) {
  const byPhase = useMemo(() => {
    const grouped = new Map()
    for (const m of matches) {
      const phase = m.phase || 'Other'
      if (!grouped.has(phase)) grouped.set(phase, [])
      grouped.get(phase).push(m)
    }

    for (const [, list] of grouped) {
      list.sort(sortMatchesByDate)
    }

    const known = MATCH_LIST_PHASE_ORDER.filter((p) => grouped.has(p))
    const unknown = [...grouped.keys()].filter((p) => !MATCH_LIST_PHASE_ORDER.includes(p)).sort()
    return [...known, ...unknown].map((phase) => ({ phase, matches: grouped.get(phase) }))
  }, [matches])

  const groupPhaseMatches = useMemo(() => {
    const isGroupPhase = (phase) => {
      const p = String(phase ?? '').toLowerCase().trim()
      return p === 'group' || p === 'groups' || p === 'gs' || p === 'group stage'
    }

    return matches.filter((m) => isGroupPhase(m.phase)).sort(sortMatchesByDate)
  }, [matches])

  const hasGroupData = Boolean(groupData)
  if (byPhase.length === 0 && !hasGroupData) return null

  const totalMatches = byPhase.reduce((acc, item) => acc + item.matches.length, 0)

  return (
    <details className="rounded-xl border border-slate-800 bg-slate-900/50" open={false}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="space-y-0.5">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-300">All Match Results By Stage</span>
          <span className="block text-[10px] text-slate-500">Click here to expand or collapse this section</span>
        </div>
        <span className="text-[10px] text-slate-500">{totalMatches} total</span>
      </summary>

      <div className="space-y-3 border-t border-slate-800 px-4 py-3">
        {groupPhaseMatches.length > 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h5 className="text-xs font-bold uppercase tracking-wide text-sky-300">Group Stage Matches</h5>
              <span className="text-[10px] text-slate-500">
                {groupPhaseMatches.length} {groupPhaseMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-1">Date</th>
                    <th className="px-2 py-1">Home</th>
                    <th className="px-2 py-1">Score</th>
                    <th className="px-2 py-1">Away</th>
                    <th className="px-2 py-1">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {groupPhaseMatches.map((m, idx) => (
                    <tr key={`group-${idx}`} className="border-b border-slate-800/60 last:border-b-0">
                      <td className="px-2 py-1 text-slate-400">{formatDate(m.date) ?? 'TBD'}</td>
                      <td className="px-2 py-1 text-slate-200">{m.home}</td>
                      <td className="px-2 py-1 font-mono text-slate-100">{m.score ?? 'TBD'}</td>
                      <td className="px-2 py-1 text-slate-200">{m.away}</td>
                      <td className="px-2 py-1 text-slate-300">{m.winner ?? 'TBD'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : hasGroupData ? (
          <p className="text-xs text-slate-400">
            Group-stage match-by-match scores are not available yet for this tournament in the current dataset.
          </p>
        ) : null}

        {byPhase.length > 0 ? (
          <div className="space-y-4">
            {byPhase.map(({ phase, matches: phaseMatches }) => (
              <div key={phase} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold uppercase tracking-wide text-sky-300">
                    {PHASE_LABELS[phase] ?? phase}
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    {phaseMatches.length} {phaseMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-1">Date</th>
                        <th className="px-2 py-1">Home</th>
                        <th className="px-2 py-1">Score</th>
                        <th className="px-2 py-1">Away</th>
                        <th className="px-2 py-1">Win Type</th>
                        <th className="px-2 py-1">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phaseMatches.map((m, idx) => {
                        const winType = m.penalties ? `Pens ${m.penalties}` : m.extraTime ? 'AET' : 'Regular'
                        const undecided = m.score === 'TBD' || m.winner === 'TBD'
                        return (
                          <tr key={`${phase}-${idx}`} className="border-b border-slate-800/60 last:border-b-0">
                            <td className="px-2 py-1 text-slate-400">{formatDate(m.date) ?? 'TBD'}</td>
                            <td className="px-2 py-1 text-slate-200">{m.home}</td>
                            <td className="px-2 py-1 font-mono text-slate-100">{m.score ?? 'TBD'}</td>
                            <td className="px-2 py-1 text-slate-200">{m.away}</td>
                            <td className="px-2 py-1 text-slate-400">{undecided ? 'TBD' : winType}</td>
                            <td className="px-2 py-1 text-slate-300">{m.winner ?? 'TBD'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  )
}

function BracketDiagram({ matches, champion, groupData }) {
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

  if (matches.length === 0 && !groupData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">No match data available for this tournament.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Group Stage */}
      <GroupStageSection groupData={groupData} />

      <MatchResultsByStage matches={matches} groupData={groupData} />

      {matches.length > 0 && (
        <>
          {/* Format note for non-standard tournaments */}
          {formatNote && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-800/40 bg-sky-950/30 px-4 py-2.5 text-xs leading-relaxed text-sky-300">
              <span className="mt-0.5 shrink-0 text-base">ℹ️</span>
              <span>{formatNote}</span>
            </div>
          )}

          {/* Knockout Bracket header */}
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Knockout Bracket</h4>

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
        </>
      )}
    </div>
  )
}

export default BracketDiagram
