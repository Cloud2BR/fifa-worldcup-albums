# Script templates

Use these templates when adding future tournament automation scripts.

## Available template

- tournament-data-script.template.mjs

## How to use

1. Copy the template to scripts with a clear name, for example:
   - scripts/generate-tournament-2026.mjs
2. Replace the TODO section with source-fetch and transformation logic.
3. Write output to the correct dataset in src/data.
4. Run and validate:
   - node scripts/generate-tournament-2026.mjs --year=2026

## Conventions

- Use UTF-8 and pretty JSON output with trailing newline.
- Keep helper functions local unless shared by 2+ scripts.
- Fail fast on missing required arguments or missing source rows.
- Print a short summary with counts for generated/updated/missing records.
