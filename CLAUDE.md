# CLAUDE.md

Guidance for Claude (and people) picking up this repo. Read `README.md` for what the prototype does. This file covers how we work on it and why things are the way they are.

## The project

An interactive map of Horizon Power's 117 remote Aboriginal communities in WA, built by VML for Horizon Power (HP) Remote Communities. The client brief (22 Sep 2026) asks for community profiles, works by program (ReGen, AMI, CDNP), community engagement and five flagship stories.

**Current phase:** a simple, clickable wireframe prototype for client review, in plain HTML, CSS and vanilla JavaScript in `prototype/`. The larger React, MapLibre and custom CMS build in `plan.md` is **parked**. Don't start on it unless asked.

## Working rules

- **Commit and push straight to `main`.** No feature branches or PRs unless asked. Every push to `main` updates the live site: https://hugo-j-vml.github.io/hp-rc-map/ (GitHub Pages, `main`, root folder. The root `index.html` forwards to `prototype/`).
- **UK English and Australian dollars** in all copy and docs.
- **Keep it simple:** no frameworks, build step, package manager or external JavaScript libraries. It must still work when `prototype/index.html` is opened straight from disk (`file://`), so data is loaded as `<script>` files, not `fetch`.
- **Wireframe fidelity:** greyscale only. Use the tokens at the top of `styles.css`, which match the Figma "Wireframe kit v2 (HP design system lookalikes)". The visual designer will skin it later.
- **Match the surrounding code:** ES5-style JavaScript (`var`, `function`, no arrow functions), one IIFE in `app.js` split into `// ---------- Section ----------` blocks, short "why" comments.
- **Plain-language, culturally safe copy:** say "Aboriginal" (not "Indigenous"), "power" (not "energy"/"electricity"), "Yarn with us", and spell out acronyms. Placeholder copy goes in `[square brackets]`, as in Figma.
- **Check your work before pushing.** Chromium and Playwright are available in cloud sessions (`require('playwright')`). Screenshot at 1920×1080, 1440×900 and 390×844 (mobile), check for console errors, and look at the screenshots. Keep test scripts and screenshots in the session scratchpad, **never in the repo**.

## Files

| File | What it holds |
|---|---|
| `prototype/index.html` | Page shell, wireframe of the HP Remote Communities site header, and the inline SVG icon sprite (HP RC icons from Figma) |
| `prototype/css/styles.css` | All styles. Tokens at the top. Mobile rules under `@media (max-width: 900px)` |
| `prototype/js/app.js` | Everything interactive: data prep, filtering, map zoom/pan/clustering/labels, key, panels (home, filters, profiles), routing, options panel, floating story cards |
| `prototype/js/content.js` | Stats, regions, programs, work types, statuses, sample works, stories and contact copy, all from the brief and Figma |
| `prototype/js/outline.js` | The WA outline (exported from Figma), the four service-area shapes and label spots, and `projectWA(lat, lng)` |
| `prototype/js/data.js` | **Generated.** The 117 communities. Don't hand-edit; run `tools/build_data.py` |
| `tools/build_data.py` | Spreadsheet → `data.js`. Writes public fields only |

## Inputs and where they live

- **Figma:** [Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map), file key `PKAKHLevjAgWsfwa4gI0tF`. **Use the v2 frames only. Ignore v1.**
  - Kit: "Wireframe kit v2 (HP design system lookalikes)" `45:1926`.
  - Desktop: `51:2011` (D01 map on load), `52:2193` (D02 filters), `52:2729` / `52:3189` (D03 rich profile and scroll), `52:3543` / `52:3912` (D04 simple profile and scroll), `52:4089` (D01b panel scroll).
  - Mobile: `53:3005`, `53:3177`, `53:3438`, `53:3859`, `53:4226`, `53:4510`.
  - Notes: `53:4707` (what changed in v0.2).
  - WA outline symbol: `3:180`.
- **Communities spreadsheet** (`Copy of RESP_communities_v3.4 … .xlsx`): supplied by the user. It is **not committed** because it holds internal HP document-management links. Sheet "Remote Communities-consolidated". Columns used: name (A), latitude (B), longitude (C), original contractual name (E, for other names), HP RC District (K, for region).
- **Brief:** `2026-27 RC Interactive Map BRIEF.docx`, also supplied by the user and not committed.
- **HP "Service area" poster:** a photo from the client's office. It defines the four service areas. The traced boundaries are in `outline.js`.
- **Live HP site header:** https://remotecommunities.horizonpower.com.au/community-progress/ (the prototype header is a wireframe of it).

## Decisions and why

- **Regions.** Use HP's four service areas: Kimberley, Pilbara, Gascoyne/Mid West, Esperance/Goldfields. The South West Interconnected System area stays blank.
  - Each community's region comes from HP's **district code** (spreadsheet column K: WKIM/EKIM → Kimberley, WPIL/EPIL → Pilbara, GS-NOMW/COMW → Gascoyne/Mid West, CEMW → Esperance/Goldfields), not from where it sits on the drawing. Counts: 78 / 17 / 8 / 14.
  - **Open question for the client:** the poster's boundaries agree with the district codes for 105 of the 117 communities. The 11 Ngaanyatjarra (NG) lands communities sit in the poster's Gascoyne/Mid West band but are coded Esperance/Goldfields (serviced from Esperance). Kurrawang sits in the blank SWIS notch near Kalgoorlie.
  - The "Goldfields takes in the NG lands" option shows the alternative drawing. The client is to decide.
- **Names.** "Blackstone" is shown as **Papulankutja** (also known as Blackstone), per the brief and Figma. Parenthetical and contract-name variants become "also known as" names and are searchable.
- **Map.** Plain SVG with an equirectangular projection calibrated to the Figma outline (see `outline.js`). There is no basemap or tile service.
  - Max zoom is 80× the state view, so the closest pair (Embulgun/Munget, about 700 m apart) separate. At full zoom there is no clustering.
  - Zoomed-in artefacts on the simplified coastline are accepted for the prototype.
- **Labels.** Each name takes the first free spot around its dot: right, left, top, bottom, then the corners. Other dots and names count as obstacles.
  - Hover, focus and selection highlight the name **in place**. The floating tooltip only shows for dots without a visible name.
  - Names are nudged 2px down to sit optically centred.
- **Selected marker:** 26px overall (dark centre, white gap, thin ring). Its name sits 25px out.
- **Sidebar:** 560px for every view on desktop, so it never jumps width.
- **Key:** shows on load, then collapses to a "Key" pill on first map interaction. On mobile it starts as the pill.
- **Mobile map controls:** the key pill and zoom buttons sit bottom right, just above the bottom sheet, and move up with the sheet when a profile opens (the sheet heights, 40% and 71%, are shared between `styles.css` and `visibleArea()` in `app.js`).
- **Story cards:** placed northernmost-first, so stacked cards follow their dots' order and leader lines don't cross.
- **RSPs (for later):** HP's Community progress page names the three Regional Service Providers: Kimberley Regional Service Provider (KRSP), Pilbara Meta Maya (PMM) and Ngaanyatjarra Services (NgS).
- **Placeholder data:** population, languages, Traditional Owners, service providers (RSPs) and works are placeholders for the life of this prototype. Program, type of work and status filters run on the sample works in `content.js` (from the Figma profiles).

## Prototype options panel (Shift + O)

Layout experiments the user can switch on and off to compare. They are stored in `localStorage` (`rcm-prototype-options`) and can be overridden by URL parameters (`?cards=1&pinned=1&ngLands=1`).

To add an option:
1. Add an entry to the `OPTIONS` array in `app.js`: `{ id, label, description, initial, requires? }`. `requires` greys it out until another option is on.
2. Read `options.<id>` where it matters.
3. React to changes in `applyOptions()`.
4. Document it in the README.

Current options: `cards` (floating story cards), `pinned` (cards fixed to map coordinates, scaling with zoom), `ngLands` (NG lands region drawing), `progress` (milestone progress bars instead of stat tiles; milestones in `content.js`, icons from HP's Community progress page).

## Environment gotchas (cloud sessions)

- **Figma image downloads (`www.figma.com/api/mcp/asset/…`) are blocked** by the network policy. To get SVGs, export them through the Figma MCP `use_figma` tool (`node.exportAsync({ format: 'SVG_STRING' })`). That's how the icons and the WA outline were obtained.
- `*.horizonpower.com.au` is allowed. `*.github.io` is not, so you can't check the live site from a session.
- Deleting remote branches was blocked by the session permissions. That's fine: we only use `main`.

## Updating community data

```sh
pip install openpyxl
python3 tools/build_data.py path/to/RESP_communities.xlsx
```
