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
- Album gallery covering every World Cup from **1930 to 2022**, grouped by era
  (Pre-Panini, Classic Panini, Modern Panini).
- **Virtual album viewer** — open any album as a two-page spread with sticker
  slots, keyboard navigation (← / →), swipe on mobile, and Esc to close.
- **Cross-album sticker search** — filter all ~9,000 sticker slots by team,
  year, type (player / badge / stadium / mascot / honour), shiny only, or
  sticker number. Click a result to jump straight to its page in the album.
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
- `publisher` (string) — historical publisher; not always Panini for pre-1970 albums
- `official` (boolean) — `true` for the official Panini line (1970+), `false` for the pre-Panini era
- `coverImage` (string, path inside `public/images/albums`)
- `stickerCount` (number) — total sticker slots; the generator produces exactly this many
- `host` (string)
- `winner` (string)
- `runnerUp` (optional string)
- `ball` (optional string) — official match ball
- `mascot` (optional string)
- `stadiums` (string[]) — venues
- `teams` (string[]) — three-letter codes of qualified national teams (see `teams.json`)
- `notes` (optional string)

### `teams.json`
A keyed map of three-letter team codes to `{ name, primary, secondary, accent }`
colours, used to style badge and player sticker slots. Includes historical
entities such as `FRG` (West Germany), `TCH` (Czechoslovakia), `URS` (Soviet
Union), `YUG` (Yugoslavia), `ZAI` (Zaire), and `SCG` (Serbia & Montenegro).

### Generated stickers
Stickers themselves are not stored as data. The deterministic generator in
`src/utils/stickers.js` builds every sticker for an album from its metadata:

1. Intro / history slots (cover, trophy, host, champion, ball, emblem)
2. One slot per stadium
3. Mascot (when applicable)
4. Per-team block: a foil badge plus N player slots
5. Closing honours (Golden Boot, Golden Ball, etc.)

Each generated sticker has `number`, `albumYear`, `kind`
(`player` | `badge` | `stadium` | `mascot` | `history`), `team` (or `null`),
`isShiny`, and a `label`. The total always matches the album's declared
`stickerCount`.

## Copyright

Real Panini sticker artwork, player photographs, club crests and tournament
emblems are the property of Panini S.p.A., FIFA, the national federations,
and the players. **No copyrighted sticker images are bundled in this
repository.** The virtual album renders styled placeholder slots (sticker
number, team colours, position, shiny/foil flag) that mirror the structure of
a real album so collectors can later drop in their own scans.

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
