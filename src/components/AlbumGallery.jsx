function AlbumCard({ album, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(album)}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-sky-500 hover:shadow-lg hover:shadow-sky-900/30"
    >
      <div className="relative overflow-hidden rounded-md">
        <img
          src={album.coverImage}
          alt={`${album.year} album cover (${album.publisher})`}
          className="h-44 w-full rounded-md object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 rounded-md bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute bottom-2 left-2 rounded bg-sky-500 px-1.5 py-0.5 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
          Open virtual album
        </span>
        {!album.official ? (
          <span className="absolute top-2 right-2 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
            Pre-Panini
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-base font-bold text-slate-100">{album.year}</p>
      <p className="text-xs text-slate-400">
        {album.host} · {album.stickerCount} stickers
      </p>
      <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-slate-500" title={album.publisher}>
        {album.publisher}
      </p>
    </button>
  )
}

function AlbumGallery({ albums, onOpen }) {
  const eras = [
    {
      key: 'pre',
      title: 'Pre-Panini Era',
      subtitle: '1930 – 1966 · regional publishers, cigarette cards, and retrospective collections',
      match: (a) => a.year < 1970,
    },
    {
      key: 'classic',
      title: 'Classic Panini',
      subtitle: '1970 – 1998 · the golden age of paper stickers',
      match: (a) => a.year >= 1970 && a.year < 2002,
    },
    {
      key: 'modern',
      title: 'Modern Panini',
      subtitle: '2002 – 2022 · holographics, digital companion apps, global craze',
      match: (a) => a.year >= 2002,
    },
  ]

  return (
    <div className="space-y-8">
      {eras.map((era) => {
        const list = albums.filter(era.match)
        if (list.length === 0) return null
        return (
          <section key={era.key}>
            <div className="mb-3">
              <h3 className="text-lg font-bold text-white">{era.title}</h3>
              <p className="text-xs text-slate-400">{era.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((album) => (
                <AlbumCard key={album.year} album={album} onOpen={onOpen} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default AlbumGallery
