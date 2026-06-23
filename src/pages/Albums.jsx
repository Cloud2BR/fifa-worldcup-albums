import { useCallback, useState } from 'react'
import AlbumGallery from '../components/AlbumGallery'
import StickerSearch from '../components/StickerSearch'
import VirtualAlbum from '../components/VirtualAlbum'
import albums from '../data/albums.json'

function Albums() {
  const [openAlbum, setOpenAlbum] = useState(null)
  const [initialPage, setInitialPage] = useState(0)

  const openAlbumAtPage = useCallback((album, page = 0) => {
    setOpenAlbum(album)
    setInitialPage(page)
  }, [])

  const handleOpenSticker = useCallback(
    (sticker) => {
      const album = albums.find((a) => a.year === sticker.albumYear)
      if (album) openAlbumAtPage(album, sticker.pageIndex ?? 0)
    },
    [openAlbumAtPage],
  )

  const totalStickers = albums.reduce((sum, a) => sum + (a.stickerCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          1930 – 2022 · Every World Cup album
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Virtual Sticker Album Gallery</h2>
        <p className="mt-2 text-slate-400">
          {albums.length} albums · {totalStickers.toLocaleString()} sticker slots across the
          pre-Panini era and every official Panini release. Click any album to open it as a
          page-by-page virtual album, or search across all stickers below.
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Sticker artwork is rendered as styled placeholders (number, team, type, shiny flag) to
          respect Panini and FIFA copyright. You can drop your own scans in later.
        </p>
      </section>

      <StickerSearch albums={albums} onOpenSticker={handleOpenSticker} />

      <AlbumGallery albums={albums} onOpen={(album) => openAlbumAtPage(album, 0)} />

      {openAlbum ? (
        <VirtualAlbum
          album={openAlbum}
          initialPage={initialPage}
          onClose={() => setOpenAlbum(null)}
        />
      ) : null}
    </div>
  )
}

export default Albums
