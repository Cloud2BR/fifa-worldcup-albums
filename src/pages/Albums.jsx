import { useMemo, useState } from 'react'
import VirtualAlbum from '../components/VirtualAlbum'
import albums from '../data/albums.json'

function Albums() {
  const years = useMemo(() => albums.map((album) => album.year).sort((a, b) => b - a), [])
  const [selectedYear, setSelectedYear] = useState(years[0] ?? null)
  const selectedAlbum = useMemo(
    () => albums.find((album) => album.year === selectedYear) ?? null,
    [selectedYear],
  )
  const totalStickers = albums.reduce((sum, a) => sum + (a.stickerCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-300/25 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          1930 - 2022 | Reference mode
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">World Cup Album Book Layout</h2>
        <p className="mt-2 text-slate-400">
          This view is tuned as a book-style reference: cover plus all generated pages shown in a
          filled spread sequence, similar to flipping through the full sticker book.
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          {albums.length} tournaments and {totalStickers.toLocaleString()} total sticker slots.
          Stickers are rendered as styled placeholders to respect copyright.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-300" htmlFor="album-year-select">
            Tournament year
          </label>
          <select
            id="album-year-select"
            value={selectedYear ?? ''}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {selectedAlbum ? (
            <p className="text-xs text-slate-400">
              {selectedAlbum.host} | {selectedAlbum.publisher} | {selectedAlbum.stickerCount}{' '}
              stickers
            </p>
          ) : null}
        </div>
      </section>

      {selectedAlbum ? <VirtualAlbum album={selectedAlbum} /> : null}
    </div>
  )
}

export default Albums
