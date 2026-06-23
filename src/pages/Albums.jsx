import AlbumGallery from '../components/AlbumGallery'
import albums from '../data/albums.json'

function Albums() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold">Official Sticker Album Gallery</h2>
        <p className="mt-2 text-slate-300">
          Browse album covers and open each card to view details for publication and sticker count.
        </p>
      </section>
      <AlbumGallery albums={albums} />
    </div>
  )
}

export default Albums
