# Stadium photographs

This folder is now populated by automated lookup scripts instead of manual-only
copying.

1. Run `node scripts/download-stadium-images.mjs`.
2. The script performs a full Wikipedia search for stadium names found in
	`src/data/albums.json`.
3. It updates `src/data/stadiumImages.json` with discovered image metadata
	(`sourceUrl`, `thumbUrl`, and `file`) and downloads local images here when
	available.

If an image is not found or cannot be downloaded, keep the entry in
`src/data/stadiumImages.json` and rerun the downloader later after adjusting
queries/source URLs.
