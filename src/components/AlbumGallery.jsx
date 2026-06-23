import { useMemo, useState } from 'react'

function AlbumGallery({ albums }) {
  const [selectedYear, setSelectedYear] = useState(null)

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.year === selectedYear),
    [albums, selectedYear],
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {albums.map((album) => (
          <button
            key={album.year}
            type="button"
            onClick={() => setSelectedYear(album.year)}
            className="group rounded-xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-sky-500 hover:shadow-lg hover:shadow-sky-900/30"
          >
            <div className="relative overflow-hidden rounded-md">
              <img
                src={album.coverImage}
                alt={`${album.year} official Panini album cover`}
                className="h-44 w-full rounded-md object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
              <span className="absolute bottom-2 left-2 rounded bg-sky-500 px-1.5 py-0.5 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                View details
              </span>
            </div>
            <p className="mt-2 text-base font-bold text-slate-100">{album.year}</p>
            <p className="text-xs text-slate-400">
              {album.host} · {album.stickerCount} stickers
            </p>
          </button>
        ))}
      </div>

      {selectedAlbum ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedYear(null)}
        >
          <article
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedAlbum.year} FIFA World Cup
                </h3>
                <p className="text-sm text-slate-400">{selectedAlbum.host} · Official Panini Album</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYear(null)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex gap-4 p-5">
              <img
                src={selectedAlbum.coverImage}
                alt={`${selectedAlbum.year} album cover detail`}
                className="h-56 w-40 flex-shrink-0 rounded-xl object-cover shadow-lg"
              />
              <div className="flex flex-col gap-3">
                <dl className="grid gap-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Publisher</dt>
                    <dd className="font-medium text-slate-200">{selectedAlbum.publisher}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Host</dt>
                    <dd className="font-medium text-slate-200">{selectedAlbum.host}</dd>
                  </div>
                  {selectedAlbum.winner ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">Champion</dt>
                      <dd className="font-medium text-sky-400">🏆 {selectedAlbum.winner}</dd>
                    </div>
                  ) : null}
                  {selectedAlbum.ball ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">Official Ball</dt>
                      <dd className="font-medium text-slate-200">{selectedAlbum.ball}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Stickers</dt>
                    <dd className="font-medium text-slate-200">{selectedAlbum.stickerCount.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {selectedAlbum.notes ? (
              <div className="border-t border-slate-800 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">About this tournament</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{selectedAlbum.notes}</p>
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </>
  )
}

export default AlbumGallery
