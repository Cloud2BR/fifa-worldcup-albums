import { useMemo, useState } from 'react'
import { buildAlbumStickers, getTeam } from '../utils/stickers'

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getWinnerTeamCode(item) {
  const winnerKey = normalize(item.winner)
  for (const code of item.teams ?? []) {
    if (normalize(getTeam(code).name) === winnerKey) return code
  }
  return null
}

function Timeline({ items }) {
  const [selectedYear, setSelectedYear] = useState(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.year === selectedYear) ?? null,
    [items, selectedYear],
  )

  const winnerPlayers = useMemo(() => {
    if (!selectedItem) return []
    const winnerCode = getWinnerTeamCode(selectedItem)
    if (!winnerCode) return []

    return buildAlbumStickers(selectedItem)
      .filter((sticker) => sticker.kind === 'player' && sticker.team === winnerCode)
      .sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999))
  }, [selectedItem])

  const winnerCode = selectedItem ? getWinnerTeamCode(selectedItem) : null
  const winnerTeamName = winnerCode ? getTeam(winnerCode).name : selectedItem?.winner

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <ol className="flex min-w-max gap-4">
          {items.map((item) => {
            const isActive = selectedYear === item.year
            return (
              <li key={item.year}>
                <button
                  type="button"
                  onClick={() => setSelectedYear(item.year)}
                  className={[
                    'group w-52 overflow-hidden rounded-xl border bg-slate-900 text-left transition',
                    isActive
                      ? 'border-amber-400 ring-1 ring-amber-400/50'
                      : 'border-slate-800 hover:border-sky-600',
                  ].join(' ')}
                  aria-pressed={isActive}
                  aria-label={`Open ${item.year} winner squad details`}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={`${item.year} album cover`}
                      className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 text-sm font-bold text-sky-300">
                      {item.year}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-100">🏆 {item.winner}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.host}</p>
                    {item.stickerCount ? (
                      <p className="mt-1 text-xs text-slate-500">{item.stickerCount} stickers</p>
                    ) : null}
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {selectedItem ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-100">
              {selectedItem.year} winner team players - {winnerTeamName}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedYear(null)}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
            >
              Close
            </button>
          </div>
          {winnerPlayers.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {winnerPlayers.map((player) => (
                <li
                  key={`${selectedItem.year}-${player.number}`}
                  className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-100">{player.label}</p>
                  <p className="text-[11px] text-slate-400">
                    #{player.shirtNumber ?? '-'} {player.position ? `- ${player.position}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              Winner player details are not available for this tournament yet.
            </p>
          )}
        </div>
      ) : null}
    </>
  )
}

export default Timeline
