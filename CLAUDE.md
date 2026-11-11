# CLAUDE.md

Guidance for Claude (and people) picking up this repo. Read `README.md` for what the prototype does. This file covers how we work on it and why things are the way they are.

## The project

An interactive map of Horizon Power's 117 remote Aboriginal communities in WA, built by VML for Horizon Power (HP) Remote Communities. The client brief (22 Sep 2026) asks for community profiles, works by program (ReGen, AMI, CDNP), community engagement and five flagship stories.

**Current phase:** a simple, clickable wireframe prototype for client review, in plain HTML, CSS and vanilla JavaScript in `prototype/`. The larger React, MapLibre and custom CMS build in `plan.md` is **parked**. Don't start on it unless asked.

## Working rules

- **Commit titles say what changed,** e.g. "Remove the All communities link from profiles". Don't start every title with the same prefix: they become impossible to tell apart in the history.
- **Commit and push straight to `main`.** No feature branches or PRs unless asked. Every push to `main` updates the live site: https://hugo-j-vml.github.io/hp-rc-map/ (GitHub Pages, deployed by `.github/workflows/pages.yml`, so each run in the Actions tab is titled with its commit message. The root `index.html` forwards to `prototype/`).
- **UK English and Australian dollars** in all copy and docs.
- **Keep it simple:** no frameworks, build step, package manager or external JavaScript libraries. It must still work when `prototype/index.html` is opened straight from disk (`file://`), so data is loaded as `<script>` files, not `fetch`.
- **Brand font, never committed:** Horizon Power's font is Beausite Classic (Fatype), licensed for internal HP use only. The `.woff2` files go in `prototype/fonts/`, which git ignores, so they never reach the public repo or Pages site; there everything falls back to Inter. Without the files the browser logs four "file not found" errors for them; that's expected. Never commit font files, and never link to HP's own font files on their website.
- **Wireframe fidelity:** greyscale only. Use the tokens at the top of `styles.css`, which match the Figma "Wireframe kit v2 (HP design system lookalikes)". The visual designer will skin it later.
- **Match the surrounding code:** ES5-style JavaScript (`var`, `function`, no arrow functions), one IIFE in `app.js` split into `// ---------- Section ----------` blocks, short "why" comments.
- **Plain-language, culturally safe copy:** say "Aboriginal" (not "Indigenous"), "power" (not "energy"/"electricity"), "Yarn with us", and spell out acronyms. Placeholder copy goes in `[square brackets]`, as in Figma.
- **Check your work before pushing.** Chromium and Playwright are available in cloud sessions (`require('playwright')`). Screenshot at 1920×1080, 1440×900 and 390×844 (mobile), check for console errors, and look at the screenshots. Keep test scripts and screenshots in the session scratchpad, **never in the repo**.

## Files

| File | What it holds |
|---|---|
| `index.html` (repo root) | Forwards to `prototype/`, so GitHub Pages serves the prototype from the repo root |
| `prototype/index.html` | Page shell, wireframe of the HP Remote Communities site header, and the inline SVG icon sprite: HP RC icons from Figma, filter and speaker icons drawn to match (the kit has neither), and placeholder milestone status icons (tick, crossed box) |
| `prototype/css/styles.css` | All styles. Tokens at the top. Mobile rules under `@media (max-width: 900px)` |
| `prototype/js/app.js` | Everything interactive: data prep, filtering, map zoom/pan/clustering/labels, key, panels (home, filters, profiles), routing, options panel |
| `prototype/js/content.js` | The five transition milestones, regions, programs, work types, statuses, sample works, stories and contact copy, all from the brief and Figma |
| `prototype/js/outline.js` | The WA outline (exported from Figma), the four service-area shapes and label spots, and `projectWA(lat, lng)` |
| `prototype/js/data.js` | **Generated.** The 117 communities. Don't hand-edit; run `tools/build_data.py` |
| `prototype/images/` | Story photos (one per flagship community), cleared by HP for public use. JPEGs re-saved from HP's "RC highlight communities" Word doc (Nov 2026), which strips camera metadata |
| `prototype/fonts/` | Beausite Classic `.woff2` files on your own machine only. Git ignores everything here except its README |
| `tools/build_data.py` | Spreadsheet → `data.js`. Writes public fields only |
| `.gitignore` | Keeps font files and any stray `shots/` screenshots out of the repo |
| `FIGMA-CHANGES.md` | Everything the prototype does differently from the Figma v2 frames, with exact values. The v3 frames were built from it. Keep it up to date with each visible change, and update the latest Figma export to match |

## Inputs and where they live

- **Figma:** [Remote Communities Map](https://www.figma.com/design/PKAKHLevjAgWsfwa4gI0tF/Remote-Communities-Map), file key `PKAKHLevjAgWsfwa4gI0tF`. **The current wireframes are the section "Export for Jaz - 11 November" (`95:6750`)**: a copy of v3 brought up to date with the November client edits. v3 and v2 are kept as earlier references. Ignore v1.
  - "Export for Jaz - 11 November" `95:6750`: desktop D01 `95:6751`, D02 `95:6819`, D03 `95:6906`, D04 `95:7016`, D05 `95:7253`; scroll views D01b `95:7126`, D03b `95:7145`, D04b `95:7221`; option O3 `95:7937`; mobile M01 `95:7338`, M02 `95:7383`, M03 `95:7419`, M03b `95:7610`, M04 `95:7535`, M04b `95:7686`; notes `95:8005`. Kit "Wireframe kit v4 (Export for Jaz - 11 November)" `98:9083`: search row, Hear the name button, speaker/done/image-placeholder icons, milestone row (Completed, In progress). v3 options O1, O2 and O4 were left out because those options were removed.
  - v3 section "v3 · Built from the live prototype (Nov 2026)" `72:3749`: desktop D01–D05 (`72:3750`, `74:3955`, `75:4199`, `75:4455`, `78:4913`), scroll views D01b/D03b/D04b, options O1–O4 (`83:5876`, `83:6181`, `87:6544`, `83:6422`), mobile M01–M04b, and notes `88:6752`. Kit "Wireframe kit v3 (from live prototype)" `70:3703` holds the new WF3 components; unchanged v2 components are reused. Frames use Inter because Beausite isn't in Figma.
  - v2 kit: "Wireframe kit v2 (HP design system lookalikes)" `45:1926`.
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
  - The poster's boundaries agree with the district codes for 105 of the 117 communities. The 11 Ngaanyatjarra (NG) lands communities sit in the poster's Gascoyne/Mid West band but are coded Esperance/Goldfields (serviced from Esperance), and Kurrawang sits in the blank SWIS notch near Kalgoorlie. The "Goldfields takes in the NG lands" option shows the alternative drawing (see open questions).
- **Names.** "Blackstone" is shown as **Papulankutja** (also known as Blackstone), per the brief and Figma. Parenthetical and contract-name variants become "also known as" names and are searchable.
- **Map.** Plain SVG with an equirectangular projection calibrated to the Figma outline (see `outline.js`). There is no basemap or tile service.
  - Max zoom is 80× the state view, so the closest pair (Embulgun/Munget, about 700 m apart) separate. At full zoom there is no clustering.
  - Zoomed-in artefacts on the simplified coastline are accepted for the prototype.
- **Labels.** Each name takes the first free spot around its dot: right, left, top, bottom, then the corners. Other dots and names count as obstacles.
  - Hover, focus and selection highlight the name **in place**. The floating tooltip only shows for dots without a visible name.
  - Names are part of their dot's button, so clicking or tapping a name selects the community just like its dot. A drag that starts on a name still pans the map.
  - Names are nudged 2px down to sit optically centred.
- **Selected marker:** 26px overall (dark centre, white gap, thin ring). Its name sits 25px out.
- **Header:** a greyscale wireframe of the live HP Remote Communities site header (logo; Contact us, Login, Search; Program purpose, Community progress, Latest news, Community members). Header Search focuses the map search; the other links show a "not part of the prototype" notice.
- **Sidebar:** 560px for every view on desktop, so it never jumps width.
- **Search row:** the search box takes the room and Filters is only as wide as its content (client edit: about 3/4 and 1/4 on desktop). The search button is a 48px square flush in the field. The search box uses the Filters button's type (16px semibold, grey 900) and border (2px grey 900, 4px corners). The placeholder is "Search communities" on desktop and just "Search" on mobile, where the longer one doesn't fit; the field is always labelled "Search communities" for screen readers. Filters has a sliders icon and shows a count of active filters.
- **Key:** shows on load, then collapses to a "Key" pill on first map interaction. On mobile it starts as the pill.
- **Mobile map controls:** the key pill and zoom buttons sit bottom right, just above the bottom sheet, and move up with the sheet when a profile opens (the sheet heights, 40% and 71%, are shared between `styles.css` and `visibleArea()` in `app.js`).
- **Sidebar story cards are whole-card links, with no "Read more":** "Read more" links aren't accessible (they all read the same out of context). Each card's title is its one link, named after the community, stretched over the card with `::after`. Hover underlines the title; keyboard focus outlines the whole card. Use the same pattern for any new cards.
- **Profiles have no tabs (client edit, Nov 2026):** the content scrolls down the panel in one column. There are no "Community story" or "Our team visited" tags under the name (client edit). In-panel links like the footer's "Yarn with us" use `data-jump` to scroll the panel without changing the route hash.
- **Hear the name:** a speaker button after the community name in both profiles (`nameRow()` in `app.js`), labelled "Hear how to say [name]". It will play a recording of a community member saying the name, with permission. Never use text-to-speech, which gets Aboriginal names wrong. There are no recordings yet, so it shows a placeholder message.
- **Closing a profile:** the cross (and Escape) close the profile and glide the map back to the opening whole-of-WA view, on every screen size (`closeProfile()` → `fitState(true)`). There is no "All communities" back link (client edit): it did nothing the cross doesn't, so the profile bar holds only Share and Close.
- **About box:** a profile's key facts sit in a grey box like the service provider one, headed "About [name]", followed by the community's **transition milestones** (no heading) from the client's mock-up (`aboutBlock()` and `milestoneList()` in `app.js`, list in `content.js`): Initial community engagement, Initial safety upgrades, Future energy system planning, Community endorsement, New energy system delivered. Each is a white row with an icon, the title and its status: "Completed [dd mmm yy]" (tick in a dark circle), or "In progress · Due [completion date]" (crossed-box placeholder icon, as in the mock-up). **Only completed and in-progress milestones show** (client edit): HP is sensitive to attention on work that hasn't started, so not-started ones stay in `content.js` but are never displayed, unless the client asks for them later. This rule is for milestones only: the works list, its "What we've done and what's planned" heading and the Planned status filter deliberately still show planned work. It's a vertical list rather than the mock-up's five cards across, because five across doesn't fit the 560px panel or mobile. Every community shows the same illustrative statuses for now (two completed, one in progress). The rows may become smaller boxes later. On simple profiles with no works data, the box replaces the "works will show here" note.
- **Landing panel has no stats (client edit, Nov 2026):** the four stat tiles ($65.8M and so on) and the progress bars option are gone; the intro leads straight into the search row and the story list. The floating and pinned story cards options are gone too.
- **Story content (Nov 2026):** headlines, text and photos come from HP's "RC highlight communities" document, cleared for public use. The text is HP's, kept word for word, even where it says "energy" or "electricity" (ask before rewording it). Each story's headline is also its side-panel card summary; the doc's call-to-action lines ("Read the Kiwirrkurra story") aren't used, as the cards are whole-card links named after the community. Photos are in colour even though the wireframe is greyscale: they're content, not interface. Card thumbnails have empty alt text (the card's title names it); the profile hero has a description (`imageAlt`). The video, quote, photo gallery and before-and-after sections only show for a story that has them (just Papulankutja, as placeholders). A story can add other names (`otherNames`, e.g. Cockatoo Springs is also Ngunulum), which show and are searchable. A story can also link to an HP news article straight after its text (`article: { title, url }`; just Papulankutja for now): a "Latest news" label, then the article's own title as an underlined text link with an arrow. The link text is always the article title, never "Read more" (WCAG 2.4.4, link purpose). It opens in the same tab.
- **RSPs (for later):** HP's Community progress page names the three Regional Service Providers: Kimberley Regional Service Provider (KRSP), Pilbara Meta Maya (PMM) and Ngaanyatjarra Services (NgS).
- **Placeholder data:** population, languages, Traditional Owners, service providers (RSPs) and works are placeholders for the life of this prototype. Program, type of work and status filters run on the sample works in `content.js` (from the Figma profiles).

## Open questions for the client

- **NG lands region:** should the 11 Ngaanyatjarra lands communities be drawn in Esperance/Goldfields (their HP district) or Gascoyne/Mid West (the poster)? Compare with the "Goldfields takes in the NG lands" option.
- **Transition milestones:** each community's real status and dates for the five milestones, and final milestone icons from the designer.
- **Community details:** population, languages, Traditional Owners, and RSP contacts per community.
- **Works data:** activities by community, program, type and status, to replace the sample works.
- **Story content:** the five flagships (Papulankutja, Kiwirrkurra, Cockatoo Springs, Chile Creek, Four Mile) have HP's headlines, text and one photo each. Still to come: higher-resolution photos (the doc's are 510px wide, a little soft in the 560px hero), and Papulankutja's video, quote, photo gallery and before-and-after photos.
- **Name recordings:** audio of a community member saying each community's name (with permission), for the "Hear how to say" button.
- **Filter and speaker icons:** the HP RC icon set has neither; ask the designer for official ones.

## Prototype options panel (Shift + O)

Layout experiments the user can switch on and off to compare. They are stored in `localStorage` (`rcm-prototype-options`) and can be overridden by URL parameters (e.g. `?ngLands=1`).

To add an option:
1. Add an entry to the `OPTIONS` array in `app.js`: `{ id, label, description, initial, requires? }`. `requires` greys it out until another option is on.
2. Read `options.<id>` where it matters.
3. React to changes in `applyOptions()`.
4. Document it in the README.

Current options: `ngLands` (NG lands region drawing). Floating story cards, pinned cards and progress bars were removed after client review (Nov 2026); they're in the git history if needed again.

## Regression checklist (before each push)

Test scripts live in the session scratchpad and don't survive between sessions, so rebuild them with Playwright as needed. Check:

- **Console:** no errors at 1920×1080, 1440×900 and 390×844, apart from the four expected font "file not found" errors when `prototype/fonts/` is empty.
- **Labels:** zoomed all the way in (e.g. open `#community=embulgun`, then press + until it stops), all 117 communities show a name. Hovering a name highlights it in place without moving it, and clicking a name opens that community.
- **Options panel:** Shift + O opens it, toggles apply straight away and are remembered after a reload, and `?option=0/1` links override that.
- **Side panel:** the story cards have no "Read more", clicking anywhere on a card opens its community, and Tab + Enter works.
- **Filters:** region counts are 78 / 17 / 8 / 14.
- **Close:** the profile's cross and Escape zoom back out to exactly the opening view.
- **Mobile:** the key and zoom buttons sit bottom right, just above the sheet, and move up when a profile opens.

## Environment gotchas (cloud sessions)

- **Figma image downloads (`www.figma.com/api/mcp/asset/…`) are blocked** by the network policy. To get SVGs, export them through the Figma MCP `use_figma` tool (`node.exportAsync({ format: 'SVG_STRING' })`). That's how the icons and the WA outline were obtained.
- `*.horizonpower.com.au` is allowed. `*.github.io` is not, so you can't check the live site from a session.
- Deleting remote branches was blocked by the session permissions. That's fine: we only use `main`.
- **Testing in Beausite:** the user can upload the `.otf` files. Convert them in the scratchpad (`pip install fonttools brotli`, then `TTFont(path)`, `flavor = 'woff2'`, `save(...)`), copy them into `prototype/fonts/` to test, and check `git status` shows nothing new. Don't commit them.

## Updating community data

```sh
pip install openpyxl
python3 tools/build_data.py path/to/RESP_communities.xlsx
```
