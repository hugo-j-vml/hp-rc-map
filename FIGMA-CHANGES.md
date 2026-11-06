# Changes since Figma v2

Everything the live prototype now does differently from the **v2 frames** in Figma ([Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map), file key `PKAKHLevjAgWsfwa4gI0tF`). **The v3 frames have been built from this list** (section "v3 · Built from the live prototype (Nov 2026)", node `72:3749`, with kit `70:3703`). For changes made after that, add them here and update the v3 frames. The prototype's code (`prototype/css/styles.css` in particular) is the exact spec. Values below are taken from it.

Colours are the v2 kit greys: grey 050 `#f7f7f7`, 100 `#eeeeee`, 200 `#dedede`, 300 `#c4c4c4`, 500 `#8a8a8a`, 700 `#4d4d4d`, 900 `#1f1f1f`. Corners are 4px unless stated.

## Whole page

| Figma v2 | Prototype now |
|---|---|
| Inter | **Beausite Classic** (HP brand font; Regular 400, Medium 500, Semibold 600, Bold 700). Inter is only the fallback. The v3 Figma frames still use Inter, as Beausite isn't available in Figma |
| Desktop side panel 400px (560px only for the rich profile) | **560px for every view** (home, filters, both profiles), so it never jumps width |

## Header (D01–D04 desktop, M01–M04 mobile)

Figma v2 had its own header: HP logo, "Remote Communities Map", About the program, Stories, Find your service provider, Share. The prototype now uses a **wireframe of the live HP Remote Communities site header** (remotecommunities.horizonpower.com.au):

- **Desktop:** 138px tall, padding 0 24 0 48.
  - **Logo:** placeholder box 150 × 40, grey 300, labelled "Horizon Power | Remote Communities logo".
  - **Top row (82px tall, 1px grey 300 line underneath):** utility links Contact us, Login and Search. 32px icon and 16px Medium text, grey 500, 32px apart.
  - **Bottom row:** main nav Program purpose, Community progress, Latest news and Community members. 16px Semibold, grey 900, 32px apart.
- **Mobile:** 81px tall.
  - **Logo:** placeholder 130 × 32.
  - **Icons:** call, login (person) and search icons, then a menu icon. The "Menu" text label is gone.
- **Lost from the header:** the Figma header's Stories, Share and Find your service provider. Stories are in the side panel, Share is on each profile, and service providers are in Filters.

## Side panel: home (D01, D01b, M01)

- **Order:** the stats come before the search row, as before. On mobile the search row comes first, as before.
- **Search row:**
  - **Split:** the search box and Filters button now split the panel width **50/50**, 8px apart.
  - **Search box:** 48px high, with a **2px grey 900 border** and 4px corners (the same as the Filters button). Text and placeholder are **16px Semibold, grey 900** (the same as Filters).
  - **Search button:** now a **48 × 48 square**, flush on the right, grey 900, with a 28px search icon.
  - **Placeholder:** just **"Search"**, at every size, because "Search communities" doesn't fit the half-width box in Semibold.
  - **Filters button:** has a **sliders (filter) icon** before the label. The kit has no filter icon; this one was drawn to match, so ask the designer for an official one. With filters active it also shows a small count badge.
  - **Search results:** typing shows a results list under the row (name, also known as, region). This isn't in Figma; add it to the frames.
- **Story cards (the listing under the search row):**
  - The **"Read more →" link is gone**; the whole card is the link.
  - Title 18px Semibold, with the summary directly under it.
  - Image placeholder 120 × 90 on the right.
  - **States:** hover underlines the title, and keyboard focus puts a 3px grey 900 outline around the whole card.

## Side panel: filters (D02, M02)

- **Region tiles** are now HP's **four service areas** with counts: **Kimberley 78, Pilbara 17, Gascoyne/Mid West 8, Esperance/Goldfields 14**. Figma v2 had three regions: Kimberley 78, Pilbara & Mid West/Gascoyne 25, Goldfields-Esperance 14.
- **Service provider dropdown:** disabled, with the note "Service provider details are still to come from Horizon Power."
- **Footer:** Clear all, plus "Show N communities", where N is the live count.

## Map (all frames)

- **Regions:**
  - **Old drawing:** Figma's dashed region lines and three labels.
  - **New drawing:** **four shaded service areas**, traced from HP's "Service area" poster: Kimberley `#d9d9d9`, Pilbara `#e4e4e4`, Gascoyne/Mid West `#ededed`, Esperance/Goldfields `#e0e0e0`.
  - **Edges:** a 2px white line between areas, and the state outline in grey 500, 1.5px.
  - **South West:** the South West Interconnected System area is left **blank (white)**.
  - **Labels:** KIMBERLEY, PILBARA, GASCOYNE/MID WEST and ESPERANCE/GOLDFIELDS.
- **Markers:** sizes as v2.
  - **Community:** 14px, grey 700, with a 2px white border.
  - **Story:** 22px ring.
  - **Not in filter:** grey 300.
  - **Cluster:** 40px, grey 900, with a 3px white border.
  - **New: a cluster containing a story** gets an extra 2px grey 900 ring outside its white border.
- **Selected marker, tightened:** **26px overall.** That's a 22px grey 900 dot with a 3px white border and a 2px grey 900 ring hugging it (v2's outer ring was about 44px with a gap).
- **Community name labels:**
  - **Placement:** each name takes the first free spot around its dot: right, left, above, below, then the corners. Names never overlap other names or dots. So **some names sit left of, above or below their dot**, not always to the right.
  - **Resting:** 13px Medium, grey 700, 14px from the dot's centre, nudged 2px down so it centres optically.
  - **Hover, focus and selected:** the **name itself highlights in place**. Grey 900 background, white 13px Semibold text, 4px corners, 2px × 6px padding. It does **not** move or turn into a separate tooltip above the dot.
  - **Selected:** the name sits 25px from the centre, clear of the 26px ring.
  - **Clickable:** names select their community, just like the dot.
  - **Tooltip:** the floating dark tooltip above a dot now only appears when the dot has no visible name, for example when zoomed out.
- **Key:**
  - **On load:** shows open (as v2). It now has a chevron in its header row.
  - **After first use:** the first time someone uses the map, it **collapses to a "Key" pill** (fully rounded, 1px grey 500 border, chevron). The pill opens and closes it.
  - **Mobile:** it starts as the pill.
- **Zoom buttons (desktop):** unchanged, bottom right, 48 × 48.

## Profiles (D03/D03b, D04/D04b, M03/M04)

- **Width:** both profile types are now 560px wide on desktop (D04 was 400px).
- **No tabs (client edit, Nov 2026):** the rich profile's Overview / Story / Work / Yarn with us tabs are gone. The content just scrolls down the panel: facts, story, work, Yarn with us, nearby communities. The "Community story" tag still scrolls the panel to the story. **Not yet in the v3 Figma frames** (D03, D03b, M03, M03b still show the tabs).
- **Layout:** otherwise unchanged from v2.
- **Simple profile (D04):** for communities with no works data, it shows the note "[Works for this community will show here once the works data is loaded.]".
- **Nearby communities:** the list uses real distances, e.g. "Munget · 1 km away".

## Mobile (M01–M04)

- **Key and zoom buttons:** moved from the top of the map to the **bottom right, just above the bottom sheet**. The zoom buttons are stacked in the corner, with the Key pill to their left. The key opens upwards.
- **Profiles:** when a profile opens, the sheet takes 71% of the screen and the buttons move up with it.
- **Sheet heights:** home 40%, profile 71%. Filters are full screen.

## New layout options (prototype-only experiments, behind Shift + O)

These aren't in Figma at all. They're being compared, and the client is to choose. If one is picked, it needs new frames.

1. **Floating story cards** (`?cards=1`):
   - **Where:** the five featured stories sit as small cards in the empty space around WA (the sea and NT/SA), as close to their community as they fit. They keep 24px clear of the coast, border and map edges.
   - **Leader lines:** a thin grey 500 line runs from each card to its dot.
   - **Card:** 248 × 80, white, 1px grey 300 border, 64px image placeholder. Name 14px Semibold, summary 12px grey 700, up to 2 lines.
   - **Behaviour:** the cards stay put on screen, show on the opening view and the first zoom step, and are gone by the second.
   - **Order:** they're placed northernmost-first, so Four Mile sits above Cockatoo Springs.
2. **Pin story cards to the map** (`?pinned=1`): the same cards, fixed to the map and scaling with the zoom.
3. **Goldfields takes in the NG lands** (`?ngLands=1`): an alternative region drawing where Esperance/Goldfields extends north along the border to cover the 11 Ngaanyatjarra lands communities. There's an open question for the client: which drawing is right?
4. **Progress bars instead of tiles** (`?progress=1`):
   - **What changes:** the four stat tiles are replaced with **"Community transition progress"**, the four milestones from HP's Community progress page: Build strong community connections; Complete initial safety inspections and upgrades; Future energy system planning and endorsement; Future energy system delivery.
   - **Each row:** the HP milestone icon (28px), the step number (13px Semibold, grey 700), the title (14px Semibold) and a count on the right (e.g. "117/117", or "[86]/117" for illustrative numbers). Under that, a slim **6px bar** (grey 200 track, grey 900 fill, 3px corners).
   - **Stage 1:** complete, with a tick next to its count.
   - **Layout:** 12px between rows, and a small "Communities" caption right-aligned on the heading row. **No $65.8M line.** The block is about the same height as the tiles.

The options panel itself (black, bottom right) is a prototype tool, not part of the design.

## Unchanged from v2

Stats tile content and style, filter tile styles (program tiles with descriptions, selected = solid fill), facts, story sections (video, quote, photos, before and after), the "What is a smart meter?" explainer, the "Yarn with us" contact block, the work items with status tags, and the map's grey background (`#f5f5f5`).
