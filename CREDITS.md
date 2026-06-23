# Image Credits

This file lists every third-party image referenced by the app, together
with its author, license, and source URL. Only public-domain, CC0,
CC-BY, or CC-BY-SA imagery is accepted. Sticker artwork, player
photographs, mascots, tournament emblems, and Panini layouts remain the
property of their respective rights holders and are **not** bundled in
this repository (see `NOTICE` and `README.md`).

## How attribution is shown

The `VirtualAlbum` component renders the photo at its sticker slot and
exposes the author and license through the `title` attribute (browser
tooltip). The same information is recorded permanently here so the
attribution survives independently of the UI.

## Stadiums (`public/images/stadiums/`)

Entries below mirror `src/data/stadiumImages.json`. Until the binary
file is committed at the indicated path, the app falls back to a styled
SVG silhouette automatically — no code change required.

| File | Stadium | Author | License | Source |
| ---- | ------- | ------ | ------- | ------ |
| `estadio-centenario.jpg` | Estadio Centenario, Montevideo | Jimmy Baikovicius | CC-BY-SA-2.0 | <https://commons.wikimedia.org/wiki/File:Estadio_Centenario.jpg> |
| `maracana.jpg` | Estádio do Maracanã, Rio de Janeiro | Arthur Boppré | CC-BY-2.0 | <https://commons.wikimedia.org/wiki/File:Maracana_Stadium_2014_b.jpg> |
| `wembley.jpg` | Wembley Stadium, London | Wojciech Kocot | CC-BY-SA-4.0 | <https://commons.wikimedia.org/wiki/File:Wembley_Stadium_(London,_UK)_panorama.jpg> |
| `estadio-azteca.jpg` | Estadio Azteca, Mexico City | Anagoria | CC-BY-3.0 | <https://commons.wikimedia.org/wiki/File:15-07-13-Estadio-Azteca-Mexico-RalfR-WMA_0894.jpg> |
| `olympiastadion-berlin.jpg` | Olympiastadion, Berlin | Avda | CC-BY-SA-3.0 | <https://commons.wikimedia.org/wiki/File:Olympiastadion_Berlin_2014.jpg> |
| `soccer-city.jpg` | Soccer City, Johannesburg | Erik Cleves Kristensen | CC-BY-2.0 | <https://commons.wikimedia.org/wiki/File:Soccer_City_Stadium.jpg> |
| `luzhniki.jpg` | Luzhniki Stadium, Moscow | Soccer.ru | CC-BY-SA-3.0 | <https://commons.wikimedia.org/wiki/File:Luzhniki_Stadium_in_June_2018.jpg> |
| `lusail-stadium.jpg` | Lusail Iconic Stadium, Lusail | Hamad I Mohammed | CC-BY-SA-4.0 | <https://commons.wikimedia.org/wiki/File:Lusail_Iconic_Stadium,_Qatar.jpg> |
| `stade-de-france.jpg` | Stade de France, Saint-Denis | Liondartois | CC-BY-SA-4.0 | <https://commons.wikimedia.org/wiki/File:Stade_de_France_2017.jpg> |

> **Note:** Before committing any binary file under
> `public/images/stadiums/`, verify the licence on Wikimedia Commons,
> confirm the file is genuinely covered by the licence claimed here, and
> keep the URL stable (Commons file pages are stable; thumbnail URLs are
> not). When CC-BY / CC-BY-SA is used, the author credit above must
> remain visible.

## Adding new images

1. Pick a Commons file under PD / CC0 / CC-BY / CC-BY-SA.
2. Add an entry to `src/data/stadiumImages.json` keyed by the stadium
   name as it appears in `src/data/albums.json` (`stadiums[]`).
3. Add a row to this file with the same metadata.
4. Drop the file into `public/images/stadiums/<file>`.

No component changes are required — the lookup is data-driven.
