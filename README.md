# hp-rc-map

Horizon Power Remote Communities Interactive Map.

## Simple prototype (current)

A plain HTML, CSS and vanilla JavaScript prototype. There is no build step, framework or server. Open the folder's `index.html` in a browser, or host it on any static host.

There are two versions: [`prototype/`](prototype/) is **version 1** (the first client review, frozen; last commit before the copy `e8d4674`) and [`prototype-v2/`](prototype-v2/) is **version 2**, the current one, built from the client's feedback. The root [`index.html`](index.html) is a launch page listing both (its files are in [`launch/`](launch/)).

Live on GitHub Pages at https://hugo-j-vml.github.io/hp-rc-map/ (served from `main`, root folder). The root `index.html` is the launch page, with links to each version. Any push to `main` updates the site. The notes below describe the prototype as it stands in version 1 and carry over to version 2.

It is built from these inputs:

- **Figma wireframes v2** ([Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map)): layout, copy, icons, markers and the WA outline.
- **The creative's visual treatment** ([Figma](https://www.figma.com/design/P9Y58ygtCG3Ap8DGGMThu2/Remote-Communities-Map)): colours, type, bands, icons, logo and the map's look, rolled in piece by piece (profiles, header logo, map, landing panel so far).
- **Horizon Power's Design System** ([Figma](https://www.figma.com/design/YO73hE2jQ5KwtoR9eYrnzj/Design-System)): buttons and the search input.
- **The communities spreadsheet** (`RESP_communities v3.4`): names, other names, coordinates and Horizon Power district for all 117 communities.
- **Horizon Power's "Service area" poster:** the four service areas (Kimberley, Pilbara, Gascoyne/Mid West, Esperance/Goldfields). Boundaries are traced in `prototype/js/outline.js`. The south west, served by the South West Interconnected System, is left blank.

### What works

- A zoomable, pannable map of WA. It supports the mouse wheel, drag, pinch on touch, and the + and − buttons. At full zoom every community shows on its own, even the closest pair (Embulgun and Munget, about 700 m apart). There is no street basemap.
- The key shows on load, then tucks into a "Key" button the first time someone uses the map. On mobile it starts as the button.
- Communities are grouped into numbered clusters when crowded, and the groups shrink as you zoom in. Click a cluster to zoom in. Names appear once you are zoomed in.
- Search by community name, other name (for example "Balgo" or "Blackstone") or region.
- Filters for region, program, type of work and status. Communities outside the filter turn into small blue dots.
- Story cards in the side panel are clickable as a whole, with no "Read more" links (better for accessibility).
- Community profiles:
  - A full "story" profile for the five flagship communities (Figma D03).
  - A simpler profile for everyone else (Figma D04).
  - Every profile lists the nearest communities, worked out from the real coordinates.
  - Closing a profile with the cross (or Escape) zooms the map back out to the whole state.
  - Each profile's key facts sit in an "About" box, followed by the works under a "Works" label (sample and placeholder works for now).
  - Every profile has a "Hear how to say" button next to the name. It shows a placeholder until community recordings are supplied.
- Deep links (`index.html#community=kiwirrkurra`) and Share (copies the link).
- Desktop and mobile layouts. On mobile, the panel becomes a bottom sheet, with the key and zoom buttons bottom right just above it.
- A wireframe of the live Horizon Power Remote Communities site header, with the real logo from the creative's design.

### Prototype options (Shift + O)

Press **Shift + O** to open the options panel in the bottom-right corner. It holds layout experiments that can be switched on and off. (Version 1 had a "Goldfields takes in the NG lands" option; it is gone from version 2, as the client doesn't need the region drawing to change.)

- **Region-specific colours (version 2 only):** gives each service area a flat colour of its own with no outlines (Kimberley `#D5E7C7`, Pilbara `#E8F6F6`, Gascoyne/Mid West `#FCF0D8`, Esperance/Goldfields `#DFEDFF`; Perth and the south west stay blank, and the sea behind the map is `#F3F3F4`). Off keeps the original neutral sand colours. Link parameter: `?regionColours=1`.
- **RC palette colours (version 2 only):** the other colour option: strong flat fills from the RC palette, no outlines (Kimberley Bush Mid 2 `#9EA790`, Pilbara Desert Light `#F2B63E`, Gascoyne/Mid West Desert Mid 2 `#F07A3F`, Esperance/Goldfields Bush Mid 1 `#4C6A48`, its name in white), on a pale yellow sea, Desert Light 20 `#FCF0D8`. It and Region-specific colours are alternatives: switching one on switches the other off. Link parameter: `?rcPalette=1`.

Settings are remembered in your browser. **Copy link with these options** gives a link with the settings in it (e.g. `?regionColours=1`), which overrides the remembered settings, so you can send someone a specific layout.

### Fonts

The prototype uses Horizon Power's brand font, **Beausite Classic**, when it's available, and Inter otherwise. Beausite is licensed for internal use only, so the font files are not in this repo and the public site shows Inter. To see Beausite, put the four `.woff2` files in `prototype/fonts/` in your own copy (see the README in that folder), or install the font on your computer.

### What is placeholder

Anything in `[square brackets]` is placeholder copy, carried over from Figma. These are not in the spreadsheet yet:

- population, languages, Traditional Owners
- service providers and their contact details
- works data

The program, type of work and status filters run on the handful of sample works shown in the Figma profiles (Papulankutja and Kiwirrkurra). They fill out once Horizon Power supplies works data.

### Files

| File | What it is |
|---|---|
| `prototype/index.html` | Page shell, wireframe of the HP site header, and the icon set (as an inline SVG sprite) |
| `prototype/css/styles.css` | All styles. Tokens at the top match the v2 wireframe kit |
| `prototype/js/app.js` | Map, clustering, zoom and pan, panels, search, filters, routing, options panel |
| `prototype/js/outline.js` | WA outline exported from Figma, the four service-area shapes, and the latitude/longitude projection onto it |
| `prototype/js/data.js` | The 117 communities, generated from the spreadsheet |
| `prototype/images/` | Photos for the five flagship stories, cleared by Horizon Power for public use |
| `prototype/js/content.js` | Regions, programs, work types, stories and sample works from the brief, Figma and HP's site |
| `prototype/fonts/` | Beausite Classic font files, on your own machine only (not committed) |
| `tools/build_data.py` | Rebuilds `data.js` from the spreadsheet |
| `FIGMA-CHANGES.md` | What has changed since the Figma v2 wireframes, for updating Figma |

### Updating the community data

```sh
pip install openpyxl
python3 tools/build_data.py path/to/RESP_communities.xlsx
```

Each community's region comes from Horizon Power's district code (`HP RC District` column): WKIM/EKIM → Kimberley, WPIL/EPIL → Pilbara, GS-NOMW/COMW → Gascoyne/Mid West, CEMW → Esperance/Goldfields. Only public fields are written out. Internal columns, such as document management IDs and links, are left out of the prototype.

## Fuller build (parked)

[`plan.md`](plan.md) describes a larger React, MapLibre and custom CMS build. It is parked while we test the simple prototype.
