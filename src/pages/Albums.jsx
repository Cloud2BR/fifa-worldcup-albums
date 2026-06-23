import AlbumGallery from '../components/AlbumGallery'
import albums from '../data/albums.json'

function Albums() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">Panini · 1970–2022</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Official Sticker Album Gallery</h2>
        <p className="mt-2 text-slate-400">
          Click any album to view the official ball, champion, sticker count, and tournament highlights.
        </p>
      </section>
      <AlbumGallery albums={albums} />
    </div>
  )
}

export default Albums
