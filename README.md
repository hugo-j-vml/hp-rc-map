# hp-rc-map

Horizon Power Remote Communities Interactive Map.

## Simple prototype (current)

A plain HTML, CSS and vanilla JavaScript prototype in [`prototype/`](prototype/). There is no build step, framework or server. Open `prototype/index.html` in a browser, or host the folder on any static host.

Live on GitHub Pages at https://hugo-j-vml.github.io/hp-rc-map/ (served from `main`, root folder). The root `index.html` forwards to `prototype/`, so any push to `main` updates the site.

It is built only from two inputs:

- **Figma wireframes v2** ([Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map)): layout, copy, icons, markers and the WA outline.
- **The communities spreadsheet** (`RESP_communities v3.4`): names, other names, coordinates and region for all 117 communities.

### What works

- A zoomable, pannable map of WA. It supports the mouse wheel, drag, pinch on touch, and the + and − buttons. Zoom is capped so the map never gets down to street level.
- Communities are grouped into numbered clusters when crowded. Click a cluster to zoom in. Names appear once you are zoomed in.
- Search by community name, other name (for example "Balgo" or "Blackstone") or region.
- Filters for region, program, type of work and status. Communities outside the filter fade, as in Figma.
- Community profiles:
  - A full "story" profile for the five flagship communities (Figma D03).
  - A simpler profile for everyone else (Figma D04).
  - Every profile lists the nearest communities, worked out from the real coordinates.
- Deep links (`index.html#community=kiwirrkurra`) and Share (copies the link).
- Desktop and mobile layouts. On mobile, the panel becomes a bottom sheet.

### What is placeholder

Anything in `[square brackets]` is placeholder copy, carried over from Figma. These are not in the spreadsheet yet:

- population, languages, Traditional Owners
- service providers and their contact details
- works data

The program, type of work and status filters run on the handful of sample works shown in the Figma profiles (Papulankutja and Kiwirrkurra). They fill out once Horizon Power supplies works data.

### Files

| File | What it is |
|---|---|
| `prototype/index.html` | Page shell and the HP RC icon set (as an inline SVG sprite) |
| `prototype/css/styles.css` | All styles. Tokens at the top match the v2 wireframe kit |
| `prototype/js/app.js` | Map, clustering, zoom and pan, panels, search, filters, routing |
| `prototype/js/outline.js` | WA outline exported from Figma, and the latitude/longitude projection onto it |
| `prototype/js/data.js` | The 117 communities, generated from the spreadsheet |
| `prototype/js/content.js` | Stats, programs, work types, stories and sample works from the brief and Figma |
| `tools/build_data.py` | Rebuilds `data.js` from the spreadsheet |

### Updating the community data

```sh
pip install openpyxl
python3 tools/build_data.py path/to/RESP_communities.xlsx
```

Only public fields are written out. Internal columns, such as document management IDs and links, are left out of the prototype.

## Fuller build (parked)

[`plan.md`](plan.md) describes a larger React, MapLibre and custom CMS build. It is parked while we test the simple prototype.
