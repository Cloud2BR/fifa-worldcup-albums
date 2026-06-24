# docs/images

This directory stores all image assets served directly by the app.

## Structure

- `albums/`: Album cover files (for example `2026.svg`).
- `entities/`: Tournament entities by year (`ball`, `mascot`, `emblem`) plus `global/` (`trophy`).
- `logos/`: Static project and competition logos.
- `players/`: Player portraits by `year/teamCode/file`.
- `references/`: External visual references captured from maps tools.
- `stadiums/`: Stadium assets (illustrations + downloaded photo variants).
- `teams/`: Team image assets by team code.
- `years/`: Year-scoped derived presentation assets (`cover`, per-year stadium copies).

## Conventions

- Prefer slug file names in lowercase with hyphens.
- Keep final runtime assets under stable folders used by UI paths.
- Put exploratory or verification captures only in `references/`.
- Track source/copyright metadata in `src/data/*.json` maps, not in file names.

## Current Quality Snapshot

Run `node scripts/audit-public-images.mjs` to regenerate:
- `src/data/publicImageAudit.json`

This report includes current coverage and missing-team-image codes.
