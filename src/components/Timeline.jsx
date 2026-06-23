function Timeline({ items }) {
  return (
    <div className="overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-4">
        {items.map((item) => (
          <li key={item.year} className="group w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-sky-600">
            <div className="relative overflow-hidden">
              <img src={item.coverImage} alt={`${item.year} album cover`} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <span className="absolute bottom-1.5 left-2 text-sm font-bold text-sky-300">{item.year}</span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-100">🏆 {item.winner}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.host}</p>
              {item.stickerCount ? (
                <p className="mt-1 text-xs text-slate-500">{item.stickerCount} stickers</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default Timeline
