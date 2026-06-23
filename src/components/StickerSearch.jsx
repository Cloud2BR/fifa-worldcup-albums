import { useMemo, useState } from 'react'
import { buildStickerIndex, getTeam } from '../utils/stickers'

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'player', label: 'Players' },
  { value: 'badge', label: 'Badges' },
  { value: 'stadium', label: 'Stadiums' },
  { value: 'mascot', label: 'Mascots' },
  { value: 'history', label: 'Honours' },
]

function StickerSearch({ albums, onOpenSticker }) {
  const index = useMemo(() => buildStickerIndex(albums), [albums])
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [kind, setKind] = useState('all')
  const [shinyOnly, setShinyOnly] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return index.filter((s) => {
      if (year !== 'all' && String(s.albumYear) !== year) return false
      if (kind !== 'all' && s.kind !== kind) return false
      if (shinyOnly && !s.isShiny) return false
      if (!q) return true
      const team = s.team ? getTeam(s.team).name.toLowerCase() : ''
      return (
        s.label.toLowerCase().includes(q) ||
        team.includes(q) ||
        String(s.number).includes(q) ||
        String(s.albumYear).includes(q) ||
        (s.host ?? '').toLowerCase().includes(q)
      )
    })
  }, [index, query, year, kind, shinyOnly])

  const shown = results.slice(0, 120)

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search across all stickers
          </label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Team, year, sticker number, mascot, stadium..."
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Album</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
          >
            <option value="all">All years</option>
            {albums.map((a) => (
              <option key={a.year} value={a.year}>
                {a.year} · {a.host}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={shinyOnly}
            onChange={(e) => setShinyOnly(e.target.checked)}
            className="accent-amber-400"
          />
          ✨ Shiny only
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {results.length.toLocaleString()} stickers match
        {results.length > shown.length ? ` (showing first ${shown.length})` : ''}.
        Click any result to open it in the virtual album.
      </p>

      {shown.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => {
            const team = s.team ? getTeam(s.team) : null
            return (
              <li key={`${s.albumYear}-${s.number}`}>
                <button
                  type="button"
                  onClick={() => onOpenSticker?.(s)}
                  className="group flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2 text-left transition hover:border-sky-500"
                >
                  <span
                    className="flex h-10 w-8 flex-shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold"
                    style={
                      team
                        ? {
                            background: s.isShiny
                              ? `linear-gradient(135deg, ${team.primary}, ${team.accent}, ${team.secondary})`
                              : team.primary,
                            color: team.secondary,
                          }
                        : {
                            background: s.isShiny ? 'linear-gradient(135deg,#f59e0b,#fde68a)' : '#334155',
                            color: '#fff',
                          }
                    }
                  >
                    #{s.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-100">
                      {s.label}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">
                      {s.albumYear} · {s.pageTitle}
                      {s.isShiny ? ' · ✨' : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">No stickers match those filters.</p>
      )}
    </section>
  )
}

export default StickerSearch
