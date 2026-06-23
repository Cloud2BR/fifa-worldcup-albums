import { toOrdinal } from '../utils/formatters'

function Timeline({ items }) {
  return (
    <div className="overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-4">
        {items.map((item) => (
          <li key={item.year} className="w-56 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <img src={item.coverImage} alt={`${item.year} album cover`} className="h-24 w-full rounded-md object-cover" />
            <p className="mt-2 text-sm font-semibold text-sky-300">{item.year}</p>
            <p className="text-sm text-slate-200">{item.winner} won in {item.host}</p>
            <p className="text-xs text-slate-400">{toOrdinal(item.stickerCount)} sticker in collection list</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default Timeline
