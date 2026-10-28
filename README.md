# hp-rc-map

Horizon Power Remote Communities Interactive Map.

## Simple prototype (current)

A plain HTML, CSS and vanilla JavaScript prototype in [`prototype/`](prototype/). There is no build step, framework or server. Open `prototype/index.html` in a browser, or host the folder on any static host.

Live on GitHub Pages at https://hugo-j-vml.github.io/hp-rc-map/ (served from `main`, root folder). The root `index.html` forwards to `prototype/`, so any push to `main` updates the site.

It is built only from two inputs:

- **Figma wireframes v2** ([Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map)): layout, copy, icons, markers and the WA outline.
- **The communities spreadsheet** (`RESP_communities v3.4`): names, other names, coordinates and Horizon Power district for all 117 communities.
- **Horizon Power's "Service area" poster:** the four service areas (Kimberley, Pilbara, Gascoyne/Mid West, Esperance/Goldfields). Boundaries are traced in `prototype/js/outline.js`. The south west, served by the South West Interconnected System, is left blank.

### What works

- A zoomable, pannable map of WA. It supports the mouse wheel, drag, pinch on touch, and the + and − buttons. At full zoom every community shows on its own, even the closest pair (Embulgun and Munget, about 700 m apart). There is no street basemap.
- The key shows on load, then tucks into a "Key" button the first time someone uses the map. On mobile it starts as the button.
- Communities are grouped into numbered clusters when crowded, and the groups shrink as you zoom in. Click a cluster to zoom in. Names appear once you are zoomed in.
- Search by community name, other name (for example "Balgo" or "Blackstone") or region.
- Filters for region, program, type of work and status. Communities outside the filter fade, as in Figma.
- Community profiles:
  - A full "story" profile for the five flagship communities (Figma D03).
  - A simpler profile for everyone else (Figma D04).
  - Every profile lists the nearest communities, worked out from the real coordinates.
- Deep links (`index.html#community=kiwirrkurra`) and Share (copies the link).
- Desktop and mobile layouts. On mobile, the panel becomes a bottom sheet.

### Prototype options (Shift + O)

Press **Shift + O** to open the options panel in the bottom-right corner. It holds layout experiments that can be switched on and off.

- **Floating story cards:** featured stories sit in the empty space around WA (the sea, and NT/SA), as close to their community as they fit (keeping 24px clear of the coast, border and map edges), with a thin line to the dot. They are placed once against the opening view and stay put on screen while the map moves; only their lines follow the dots. They show on the opening view and the first zoom step, and are gone by the second. Clicking a card opens that community. On narrower screens WA shifts left to make room. A card that would sit more than about 280px from its community is left out. Desktop only.

- **Goldfields takes in the NG lands:** the poster puts the 11 Ngaanyatjarra lands communities (Papulankutja, Warburton, Warakurna and others) inside the Gascoyne/Mid West band, but Horizon Power's district codes put them in Esperance/Goldfields. Either way they are counted in Esperance/Goldfields; this toggle only changes the drawing, redrawing Esperance/Goldfields north along the border so the shading matches.
- **Pin story cards to the map** (needs floating story cards on): the same cards, but fixed to map positions in the empty space. They grow and shrink with the zoom like the map itself, so they never cover land or communities and never fade out. Dragging or scrolling over a card still moves the map.

Settings are remembered in your browser. **Copy link with these options** gives a link with the settings in it (e.g. `?cards=1&pinned=1`), which overrides the remembered settings, so you can send someone a specific layout.

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

Each community's region comes from Horizon Power's district code (`HP RC District` column): WKIM/EKIM → Kimberley, WPIL/EPIL → Pilbara, GS-NOMW/COMW → Gascoyne/Mid West, CEMW → Esperance/Goldfields. Only public fields are written out. Internal columns, such as document management IDs and links, are left out of the prototype.

## Fuller build (parked)

[`plan.md`](plan.md) describes a larger React, MapLibre and custom CMS build. It is parked while we test the simple prototype.
