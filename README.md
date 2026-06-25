# FIFA World Cup History Albums

Atlanta, USA

![GitHub](https://img.shields.io/badge/--181717?logo=github&logoColor=ffffff)  
[Cloud2BR OSS - Learning Hub](https://github.com/Cloud2BR-MSFTLearningHub)

Last updated: 2026-06-23

---

A React + Vite [web application](https://cloud2br.github.io/fifa-worldcup-albums/#/worldcups) that presents FIFA World Cup tournament results and a visual gallery of official sticker albums.

## Features

- Historical World Cup results table across all tournaments.
- Interactive charts for titles, goals, and tournament trends — including a  
stacked **goals-by-phase** breakdown (group → R16 → QF → SF → 3rd → Final)  
for World Cups with knockout data available.
- **Knockout bracket diagrams** — pick any tournament with seeded data  
(currently 2010, 2014, 2018, 2022) and follow the phase-by-phase flow  
with the champion path highlighted.
- Scrollable timeline combining tournament results and album visuals.
- Album gallery covering every World Cup from **1930 to 2022**, grouped by era  
(Pre-Panini, Classic Panini, Modern Panini).
- Album gallery now includes the **2026 in-progress edition** with placeholders for undecided teams/phases.
- **Virtual album viewer** — open any album as a two-page spread with sticker  
slots, keyboard navigation (← / →), swipe on mobile, and Esc to close.
- Local-first media library: stadium and team images are downloaded into the repository and organized by year/type.
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

- `docs/` static assets (album covers, logos)
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
- `goals` (number) — total goals scored in the tournament
- `teams` (number)
- `matches` (number)
- `topScorer` (string)
- `goalsPerMatch` (number) — pre-computed average (`goals / matches`, 2 dp)
- `goalsByPhase` (object | null) — per-phase breakdown when known, with  
keys `group`, `r16`, `qf`, `sf`, `thirdPlace`, `final`. The values sum  
to `goals`. Currently populated for 2010, 2014, 2018, 2022; `null` for  
earlier tournaments and can be backfilled following the same schema.

### `matches.json`

Knockout-stage matches per tournament. One entry per match under the  
`matches` array, with fields:

- `year` (number)
- `phase` (`"R16" | "QF" | "SF" | "3rd" | "Final"`)
- `date` (`YYYY-MM-DD`)
- `home`, `away` (string) — full team names matching `worldcups.json`
- `score` (string, `"h-a"`) — regulation score (or score at end of AET)
- `extraTime` (boolean) — `true` if extra time was played
- `penalties` (string | null) — penalty shoot-out score `"h-a"` if any
- `winner` (string) — name of the side that advanced (or the trophy  
winner for the Final / 3rd-place match)

Seeded for 2010, 2014, 2018, 2022. Older tournaments can be backfilled  
by appending entries to the same `matches` array — no schema change  
required.

### `stadiumImages.json`

Optional curated mapping from stadium name (as it appears in  
`albums.json` `stadiums[]`) to a free-license image entry:

- `file` (string) — filename under `docs/images/stadiums/`
- `author` (string)
- `license` (string) — must be PD / CC0 / CC-BY / CC-BY-SA
- `sourceUrl` (string) — link to the Wikimedia Commons file page
- `caption` (string)

Until the binary file is committed, the `VirtualAlbum` component falls  
back to its built-in SVG silhouette automatically. Every entry must  
also be listed in `[CREDITS.md](./CREDITS.md)`.

### `albums.json`

- `year` (number)
- `publisher` (string) — historical publisher; not always Panini for pre-1970 albums
- `official` (boolean) — `true` for the official Panini line (1970+), `false` for the pre-Panini era
- `coverImage` (string, path inside `docs/images/albums`)
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
and the players. **No copyrighted sticker images are bundled in this**  
**repository.** The virtual album renders styled placeholder slots (sticker  
number, team colours, position, shiny/foil flag) that mirror the structure of  
a real album so collectors can later drop in their own scans.

Stadium photographs may be optionally bundled under `docs/images/stadiums/`  
provided they are released under a permissive free-culture license  
(public-domain, CC0, CC-BY, or CC-BY-SA). Every bundled image must be  
listed in `[CREDITS.md](./CREDITS.md)` with its author, license, and  
source URL, and the same metadata must be present in  
`src/data/stadiumImages.json`. When no image file is present, the  
virtual album falls back to a styled SVG silhouette automatically.

## Local Setup

```bash
npm install
npm run dev
npm run build
```

## Media Sync (Download + Organize)

```bash
npm run media:stadiums
npm run media:teams
npm run media:index
npm run media:sync
```

- `media:stadiums`: downloads stadium photos and builds `docs/images/years/<year>/...`
- `media:teams`: downloads team crest/flag images where available
- `media:index`: regenerates grouped media metadata in `src/data/mediaIndex.json`
- `media:sync`: runs all three in order

More details: [docs/media-library.md](./docs/media-library.md)

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

![Total views](https://img.shields.io/badge/Total%20views-0-limegreen)

Refresh Date: 2026-06-23
