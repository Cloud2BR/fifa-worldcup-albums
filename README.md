# FIFA World Cup History Albums

A React + Vite web application that presents FIFA World Cup tournament results and a visual gallery of official sticker albums.

## Screenshots

> Add screenshots after first deployment:
- Home page
- World Cups analytics page
- Albums gallery modal

## Features

- Historical World Cup results table across all tournaments.
- Interactive charts for titles, goals, and tournament trends.
- Scrollable timeline combining tournament results and album visuals.
- Album gallery with modal/lightbox-style details.
- Responsive interface for desktop and mobile.

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** TailwindCSS
- **Data:** Local JSON files (`src/data/worldcups.json`, `src/data/albums.json`)
- **Visualization:** Chart.js via `react-chartjs-2`
- **Gallery:** Custom React modal gallery

## Project Structure

- `public/` static assets (album covers, logos)
- `src/components/` reusable UI components
- `src/pages/` route pages (Home, World Cups, Albums)
- `src/data/` JSON datasets
- `src/utils/` helper/stat functions
- `src/App.jsx` app shell and routes

## Data Schema

### `worldcups.json`
- `year` (number)
- `host` (string)
- `winner` (string)
- `runnerUp` (string)
- `finalScore` (string)
- `goals` (number)
- `teams` (number)
- `matches` (number)
- `topScorer` (string)

### `albums.json`
- `year` (number)
- `publisher` (string)
- `coverImage` (string, path inside `public/images/albums`)
- `stickerCount` (number)
- `notes` (optional string)

## Local Setup

```bash
npm install
npm run dev
npm run build
```

## GitHub Pages (Main Branch) Deployment

This project is configured for GitHub Pages hosted from the **main branch** using `/docs` as the publishing folder.

1. Run `npm run build` (outputs static site to `/docs`).
2. Commit the generated `/docs` folder to `main`.
3. In repository settings, set GitHub Pages source to:
   - **Branch:** `main`
   - **Folder:** `/docs`

Configured Vite base path: `/fifa-worldcup-albums/`.

## License

This repository is dual-licensed:

- Open-source license: **AGPL-3.0** (`LICENSE`)
- Commercial proprietary license: see `LICENSE-COMMERCIAL.md`
- Licensing summary: `NOTICE`
