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
            className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-sky-500"
          >
            <img
              src={album.coverImage}
              alt={`${album.year} official album cover`}
              className="h-36 w-full rounded-md object-cover"
            />
            <p className="mt-2 font-semibold text-slate-100">{album.year}</p>
            <p className="text-sm text-slate-400">{album.publisher}</p>
          </button>
        ))}
      </div>

      {selectedAlbum ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedYear(null)}
        >
          <article
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">{selectedAlbum.year} Official Album</h3>
              <button
                type="button"
                onClick={() => setSelectedYear(null)}
                className="rounded-md bg-slate-800 px-2 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <img
              src={selectedAlbum.coverImage}
              alt={`${selectedAlbum.year} album cover detail`}
              className="mt-4 h-64 w-full rounded-md object-cover"
            />
            <dl className="mt-4 grid gap-2 text-sm text-slate-300">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Publisher</dt>
                <dd>{selectedAlbum.publisher}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Stickers</dt>
                <dd>{selectedAlbum.stickerCount}</dd>
              </div>
              {selectedAlbum.notes ? (
                <div>
                  <dt className="text-slate-400">Notes</dt>
                  <dd>{selectedAlbum.notes}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        </div>
      ) : null}
    </>
  )
}

export default AlbumGallery
