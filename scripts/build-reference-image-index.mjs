import fs from 'node:fs/promises'

const satellite = JSON.parse(await fs.readFile('src/data/mapSatelliteReferences.json', 'utf8'))
const photos = JSON.parse(await fs.readFile('src/data/mapPhotoReferences.json', 'utf8'))

const index = {
  generatedAt: new Date().toISOString(),
  notes: 'Reference-only assets from maps workflows. Keep attribution in source data files.',
  groups: {
    maps: {
      source: satellite.source,
      capturedAt: satellite.capturedAt,
      items: (satellite.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        screenshot: item.screenshot,
        mapsUrl: item.mapsUrl,
        coordinates: item.coordinates,
      })),
    },
    placePhotos: {
      source: photos.source,
      capturedAt: photos.capturedAt,
      items: (photos.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        screenshot: item.screenshot || null,
        placeUrl: item.placeUrl,
        photoHint: item.photoHint,
        coordinates: item.coordinates,
      })),
    },
  },
}

await fs.writeFile('public/images/references/index.json', `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log('Generated public/images/references/index.json')
