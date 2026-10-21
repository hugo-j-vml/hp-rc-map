# Remote Communities Interactive Map — Prototype Plan

**Client:** Horizon Power (Remote Communities)
**Agency:** VML
**Status:** Draft for review — v0.1, 21 October 2026
**Inputs:** *2026-27 RC Interactive Map brief* (22 Sep 2026); *Remote Aboriginal Communities Communications Guide v1* (Oct 2026)

---

## 1. What we are building

A **working prototype** of an interactive map of Western Australia that shows the 117 remote communities Horizon Power serves. For each community it shows the infrastructure works and engagement activity under the Remote Communities programs (ReGen, AMI and CDNP). It is a stakeholder-management and comms artefact. It needs to show, clearly and respectfully, that the work is happening and that communities are being engaged along the way.

The prototype has three parts:

1. **The map experience.** A React component that can be dropped onto Horizon Power's site (React on Optimizely CMS). It has a **map view** and a **list view**, and the same search and filters drive both.
2. **A lightweight, self-built CMS (the "Admin").** Staff can import spreadsheets, edit communities, activities and visits, add rich content (photos, video, case studies) and publish. There are no third-party vendors, accounts or licences.
3. **A reusable map engine.** The map and list interaction is built separately from Horizon Power's content, so VML can reuse it on future projects.

### Guiding constraints (agreed)

| Constraint | Implication |
|---|---|
| No Optimizely sandbox | We build against our own **JSON data contract**. Optimizely integration is documented and stubbed, but not built. |
| Must be "drop-in" for the client's site | We deliver a runnable package: an npm-style React library plus a standalone embed bundle, with React as a peer dependency, scoped CSS and no global side effects. |
| No external CMS vendor | We build our own CMS. Content is stored as JSON files plus a media folder, so we control the format entirely. |
| Data arrives as spreadsheets | Spreadsheet import (XLSX/CSV) with validation is a core CMS feature, not an extra. |
| Wireframe fidelity, skinned later by a visual designer | All visual decisions go through **design tokens** (CSS custom properties). Components stay structurally clean and deliberately plain. |
| Reuse in future | We split the code into a generic `map-explorer` engine and a Horizon Power-specific `rc-map` layer. |
| Location precision | Sharing community locations is fine. We **cap the maximum zoom level** so the map never resolves to individual streets or houses. |

---

## 2. Architecture overview

```
 Spreadsheets (XLSX/CSV)
        │  import + validate
        ▼
 ┌──────────────────────┐      writes       ┌─────────────────────────┐
 │  Admin (own CMS)      │ ───────────────▶ │  /content               │
 │  React app + small    │                   │   communities/*.json    │
 │  Node API (local)     │ ◀─────────────── │   programs.json, ...    │
 └──────────────────────┘      reads        │   media/ (originals)    │
                                             └──────────┬──────────────┘
                                                        │ publish (build step)
                                                        ▼
                                  ┌──────────────────────────────────────┐
                                  │  Published bundle                     │
                                  │   rc-map-data.json (approved only,    │
                                  │   metrics pre-calculated)             │
                                  │   media/ (resized, responsive)        │
                                  └──────────┬───────────────────────────┘
                                             │ fetched at runtime
                                             ▼
             ┌──────────────────────────────────────────────────────┐
             │  <RcMap />  (packages/rc-map)                          │
             │   Horizon Power content: profiles, programs, stories   │
             │        └── built on <MapExplorer /> (packages/map-explorer)
             │              generic: nodes, filters, map ⇄ list, URL │
             └──────────────────────────────────────────────────────┘
                 │                                   │
        Prototype demo site                 Client's Optimizely site
        (apps/demo)                         (drop-in React block)
```

The main design decision is that **the published JSON file is the contract**. The map never talks to the CMS directly. In production, Horizon Power's developers can either:
- keep using our Admin and publish step, or
- model the same content in Optimizely and expose it through an endpoint or Content Graph query that returns the same JSON shape, mapped with a small adapter.

Either way, the map component doesn't change.

---

## 3. Tech choices

| Area | Choice | Why |
|---|---|---|
| Language | **TypeScript** throughout | A typed content model shared by the map, Admin and import tools. |
| Build | **Vite** (library mode for packages, app mode for demo and Admin) | Fast, simple, and outputs portable ES modules. It doesn't tie the client to a framework such as Next.js. |
| UI | **React 18+** as a *peer dependency* | Matches the client stack. We never bundle a second copy of React into their site. |
| Repo layout | **npm workspaces** monorepo | One repo, separate publishable packages, no extra tooling to learn. |
| Map rendering | **MapLibre GL JS** (+ `react-map-gl`) | Open source (BSD), no API keys or per-view fees. WebGL gives smooth pinch and zoom on mobile. Built-in clustering. Fully stylable from tokens. |
| Basemap | **Self-hosted vector data**: WA state outline, region boundaries and a handful of reference towns, as GeoJSON | No third-party tile service. A tiny download for remote connections. A clean, wireframe-friendly look the designer can skin. A full basemap (e.g. a single Protomaps `.pmtiles` file) can be added later if needed. |
| Data validation | **Zod** schemas | One definition gives runtime validation for spreadsheet import and the Admin, TypeScript types, and an exported JSON Schema for the client's developers. |
| Spreadsheet import | **SheetJS** (installed from the SheetJS CDN tarball, not the outdated npm package) or **ExcelJS** | Reads XLSX and CSV in the browser or in Node. |
| Admin API | Small **Node** server (Hono or Express) that reads and writes `/content` | Keeps the Admin "real" (saving, media upload) without a database. It runs locally for the prototype and can be hosted behind auth later. |
| Rich text | **Markdown**, rendered and sanitised | Portable, diff-friendly, and easy to move into Optimizely rich text later. |
| Case study layout | Ordered **content blocks** (text, image, gallery, video, quote, before/after) | Mirrors Optimizely's block and content area model, which makes migration straightforward. |
| Images | Resized at publish time with **sharp** into responsive sizes (WebP + JPEG fallback) | Essential for low-bandwidth users. |
| Video | Embed-by-URL (YouTube/Vimeo) **or** self-hosted MP4 with poster image. Never autoplay, and load only on tap. | Respects data limits. *(See open question Q9.)* |
| Styling | **CSS Modules + CSS custom properties (design tokens)**, all prefixed `rcm-` | Styles can't leak into or out of the host site. The designer skins everything by editing one tokens file. |
| State and deep links | View mode, filters and selected community stored in the **URL query string** | Shareable links for comms (e.g. `?view=list&program=ami&community=kiwirrkurra`). |
| Testing | **Vitest** + Testing Library (units), **Playwright** + **axe-core** (end-to-end and accessibility) | Accessibility checks run automatically. |
| Prototype hosting | Static build: any static host (GitHub Pages, VML hosting, or a zip the client opens locally) | The map is static files plus one JSON file. *(See Q10.)* |

### Why build our own CMS (and its limits)

**For:** we have total control, no vendor procurement and no cost. The content model is exactly what the map needs, and spreadsheet import is first-class.

**Against, to flag with the client early:** a home-built CMS isn't something Horizon Power's digital governance team will want to run long term alongside Optimizely. It needs proper authentication, hosting, backups and security review before production use. **We position the Admin as a prototype tool that proves the content model and editing workflow.** The recommended production path is to move content management into Optimizely while keeping our JSON contract (see section 9).

---

## 4. Repository structure (proposed)

```
hp-rc-map/
├── plan.md                    ← this document
├── packages/
│   ├── map-explorer/          ← REUSABLE engine (no Horizon Power content)
│   │   ├── src/
│   │   │   ├── MapExplorer.tsx      shell: view toggle, filters, panel slots
│   │   │   ├── map/                 MapLibre map, markers, clusters, zoom limits
│   │   │   ├── list/                accessible list/table view
│   │   │   ├── filters/             search + facet filters (config-driven)
│   │   │   ├── panel/               detail drawer/sheet (mobile + desktop)
│   │   │   ├── state/               URL-synced view/filter/selection state
│   │   │   └── tokens.css           design tokens (wireframe defaults)
│   │   └── README.md
│   └── rc-map/                ← Horizon Power layer
│       ├── src/
│       │   ├── schema/              Zod content model (single source of truth)
│       │   ├── RcMap.tsx            configures MapExplorer for communities
│       │   ├── profile/             community profile panel
│       │   ├── programs/            program summaries + metrics
│       │   ├── stories/             case study renderer (blocks)
│       │   ├── cultural/            acknowledgement, deceased-persons notice
│       │   ├── glossary/            plain-language acronym explainers
│       │   └── embed.ts             standalone <script> embed entry
│       └── README.md                integration guide for client devs
├── apps/
│   ├── demo/                  ← prototype site that hosts <RcMap />
│   └── admin/                 ← our CMS (React UI + Node API)
├── content/                   ← CMS-managed source content (JSON + media)
├── tools/
│   ├── import/                spreadsheet → content importer (CLI + used by Admin)
│   └── publish/               content → published bundle (validate, filter, resize, metrics)
├── geo/                       ← WA outline, regions, reference towns (GeoJSON)
└── templates/
    └── rc-map-import-template.xlsx   ← spreadsheet template we give the client
```

---

## 5. Content model (for your review)

Plain-language naming follows the Communications Guide. Field labels shown to the public use "power" (not "energy" or "electricity") and spell out acronyms.

### 5.1 Entities

**Community**

| Field | Type | Notes |
|---|---|---|
| `id` | slug | Stable key, e.g. `kiwirrkurra`. Used in URLs and to match spreadsheet rows. |
| `name` | text | Primary display name. |
| `alternativeNames` | text[] | e.g. Blackstone ↔ Papulankutja. Search matches every name. |
| `location` | { lat, lng } | Shown up to the capped zoom level only. |
| `regionId` | → Region | |
| `rspId` | → RSP | Regional Service Provider. |
| `population` | number or band | *Q4: exact number or a size band ("Under 50", "50–200" and so on)?* |
| `languages` | text[] | |
| `traditionalOwnerGroup` | text | |
| `summary` | Markdown (short) | Plain-language intro. |
| `heroImage` | → Media | Optional. |
| `caseStudyId` | → CaseStudy | Optional. Flagship communities only. |
| `programIds` | derived | Calculated from activities, never typed in. |
| `visited` | derived | True if one or more visits are recorded. Drives the green tick. |
| `review` | Review | Workflow state (see 5.3). |

**Region**: `id`, `name` (e.g. Kimberley, Pilbara, Mid-West, Goldfields–Esperance… *Q5: Horizon Power's own regions or WA Government regions?*), optional boundary in `/geo`.

**RSP (Regional Service Provider)**: `id`, `name`, `contactName`, `phone`, `email`, `website`, `address`, `notes`.

**Program**: `id` (`regen`, `ami`, `cdnp`), `name`, `shortName`, `plainName` (e.g. "New smart power meters"), `objective`, `investmentAud` (number, AUD), `highlights[]` (text + optional FY), `colourToken`.

**ActivityType** (managed list, so new types need no developer):
`id`, `technicalName` (e.g. "Advanced Metering Infrastructure (AMI) installation"), `plainName` (e.g. "New smart power meter"), `plainDescription`, `icon`, `defaultProgramId`.

Seeded from the brief: fuel tank replacement · waste tank replacement · engine replacement · transformer replacement · Starlink installation · PVC replacement · pole testing · earthing and protection study · AMI installation · power station upgrade / new generation asset · other safety, reliability and sustainability improvement.

**Activity** (one row per piece of work in a community)

| Field | Type | Notes |
|---|---|---|
| `id` | auto | |
| `communityId` | → Community | |
| `activityTypeId` | → ActivityType | |
| `programId` | → Program | Defaults from the type. Can be overridden. |
| `status` | enum | `to-be-commenced` · `in-progress` · `completed` *(Q6: do we need a separate "planned – funding confirmed" status?)* |
| `financialYear` | text | e.g. `FY26`. Lets us filter "past three years" versus future. |
| `startDate` / `completedDate` | date (optional) | |
| `quantity` | number (optional) | e.g. 3 engines. |
| `publicNote` | Markdown (optional) | Plain-language description of the benefit. |
| `media` | → Media[] (optional) | e.g. before/after photos. |

**Visit / Engagement**: `id`, `communityId`, `date`, `type` (community visit, yarn / meeting, Board meeting, event…), `publicSummary`, `media[]`, `review`.

**CaseStudy**: `id`, `communityId`, `title`, `standfirst`, `heroImage`, `blocks[]`, `review`.

Block types: `text` (Markdown) · `image` · `gallery` · `video` · `quote` (testimonial with attribution and consent flag) · `beforeAfter` (paired images) · `outcomes` (bullet list of benefits).

**Media**: `id`, `file` or `url`, `kind` (image or video), `alt` (required for images), `caption`, `credit`, `consentRecorded` (bool), `culturalFlags` (see 5.3).

**Glossary term**: `term` (e.g. "SPS"), `expanded` ("Standalone Power System"), `plainExplanation` (from the Communications Guide wording, e.g. "Local power system that can run on its own").

**Site settings**: Acknowledgement of Country text, deceased-persons notice text, "Yarn with us" contact, program totals override, map zoom limits.

### 5.2 Calculated metrics (worked out by the code, never typed in)

- Communities per program, by status (e.g. "AMI delivered to 18 communities").
- Activity counts by type and status, overall and per region, RSP or program.
- Communities visited (green ticks) out of 117.
- Total investment = sum of `Program.investmentAud` (currently A$31.8M + A$24M + A$10M = **A$65.8M**).

Dollar figures are kept at **program level only**, as per the brief. *Q7: is there any per-community or per-activity spend we should show, or must not show?*

### 5.3 Cultural safety and review workflow

Built in response to the Communications Guide's *Internal reviews and approvals* requirement: all materials must be culturally reviewed by the Traditional Owner Relationship and Reconciliation (TORR) team and/or the Remote Communities Engagement team.

- **Review states** on Communities, Visits, Case Studies and Media:
  `draft` → `in-cultural-review` → `approved` → `published` (and `withdrawn`).
  Each change records who changed it, when, and an optional note. **Only `published` items reach the public JSON file.**
- **Media cultural flags:** `mayDepictDeceasedPerson`, `restricted` (never publish), `consentRecorded`.
- **Fast withdrawal:** one action unpublishes a media item or story everywhere (for Sorry Business or a community request) and republishes.
- **Public-facing safeguards:** Acknowledgement of Country, and a notice that the content may contain images or names of deceased people (shown on first visit and on any story that includes flagged media).
- **Language:** "Aboriginal" (not "Indigenous"), "power", "yarn with us". Acronyms are always spelled out or explained through the glossary tooltip. The tone is strength-based.

---

## 6. Experience: functional scope of the prototype

### 6.1 Map explorer (reusable engine, `map-explorer`)

- **Global view switch: Map ⇄ List.** It is always visible and stored in the URL, and it remembers your choice for next time. The list view is a full equivalent, not a fallback: same search, filters, sorting and access to every profile.
- **The list view loads first and fast.** The map library loads only when the map view is used, so someone on a poor connection who chooses List never downloads it.
- **Search** by any community name (including alternative names), region or RSP.
- **Facet filters** (config-driven): region · RSP · program · activity type · status · visited · has a story.
- **Map:** WA outline and regions, community markers styled by status or program (the designer decides), clustering where markers are dense (e.g. the Kimberley), **min/max zoom limits**, bounded panning, keyboard-operable controls, and "reset view".
- **Detail panel:** a bottom sheet on mobile and a side drawer on desktop. Focus is managed, closes with Esc, and has a deep link.
- **Accessibility target: WCAG 2.2 AA.** Checked automatically with axe, plus a manual keyboard and screen-reader pass.

### 6.2 Horizon Power layer (`rc-map`)

- **Community profile:** name and alternative names, region, Traditional Owner group, languages, population, RSP and contact details ("Yarn with us"), visited tick, activities grouped by status, link to the story.
- **Program views:** ReGen, AMI and CDNP summaries with objective, investment and highlights. Calculated metrics. Selecting a program filters the map.
- **Headline stats strip:** total investment, communities reached, works completed and communities visited.
- **Case studies** (5 flagship: Blackstone/Papulankutja, Kiwirrkurra, and three in the Kimberley — Cockatoo Springs, Chile Creek, and Four Mile or Embalgun): a block-based story page or panel with gallery, video, testimonials and before/after.
- **Glossary tooltips** for technical terms.
- **Distinguishing communities, projects and programs** (a brief requirement): markers represent communities, activities are listed within each community, and programs work as filters and overlays.

### 6.3 Admin (own CMS)

- **Spreadsheet import:** upload XLSX/CSV, map columns, then preview a validation report (errors and warnings per row) **before** anything is saved. Re-importing updates existing records by `id` (it never duplicates them).
- **Communities:** list and edit; set location by typing coordinates or dropping a pin on a mini map.
- **Activities:** bulk status updates (e.g. mark all AMI installs in a region as *completed*).
- **Visits:** quick "log a visit" form.
- **Case study editor:** add, reorder and remove blocks; Markdown text; image upload with mandatory alt text.
- **Media library:** upload, alt text, credit, consent and cultural flags.
- **Review workflow:** state changes, review queue, change history.
- **Publish:** validates everything, builds the public JSON and resized media, and shows a "what changed" summary.
- **Export to spreadsheet:** round-trips data back to XLSX for reporting.
- **Auth (prototype level):** a simple local password, or none when run locally. *Production needs proper SSO; out of scope.*

---

## 7. Drop-in package for the client's developers

What we hand over:

1. **`@hp/rc-map` React library** (ESM + TypeScript types, React as a peer dependency):
   ```tsx
   import { RcMap } from '@hp/rc-map';
   import '@hp/rc-map/styles.css';

   <RcMap dataUrl="/api/rc-map-data.json" initialView="map" />
   ```
   Alternatively, pass `data={...}` directly, for example from an Optimizely block's server-side props.
2. **Standalone embed** for pages where they would rather not touch their React build:
   ```html
   <div id="rc-map" data-src="/rc-map-data.json"></div>
   <script type="module" src="/rc-map/embed.js"></script>
   ```
3. **Data contract:** a versioned JSON Schema (generated from Zod) plus sample data.
4. **Integration guide** (`packages/rc-map/README.md`): an Optimizely block example, the CSS isolation approach, theming with tokens, performance budget and accessibility notes.
5. **Runnable demo:** `npm install && npm run dev` starts the demo site and Admin locally with sample content.

**Host-site safety:** no global CSS resets, all classes and tokens prefixed, no `window` globals (except the embed entry), and no third-party network calls.

---

## 8. Delivery phases

Estimates are prototype effort for one developer working with Claude. They are indicative and assume inputs arrive on time.

| Phase | Outcome | Depends on |
|---|---|---|
| **0. Set-up** (½ day) | Monorepo, tooling, linting, CI, empty packages, this plan agreed. | Plan sign-off |
| **1. Content model + seed data** (1–2 days) | Zod schema, sample content for around 10 real communities, spreadsheet template, importer CLI. | Data structure review (you) |
| **2. Map explorer engine** (3–4 days) | Map ⇄ list switch, search, filters, clustering, zoom limits, detail panel, URL state, wireframe tokens. | WA geo data |
| **3. Horizon Power layer** (2–3 days) | Profiles, program views, stats, glossary, cultural notices. | Figma wireframe |
| **4. Admin CMS** (4–6 days) | Import with validation, editing screens, media, review workflow, publish, export. | Phase 1 |
| **5. Case studies** (2 days) | Block renderer and editor, gallery, video, before/after. | Sample story content |
| **6. Packaging + hardening** (2–3 days) | Library and embed builds, integration guide, accessibility and performance pass, Playwright tests, demo deployment. | Hosting decision |
| **7. Full data load** (1 day plus fixes) | All 117 communities imported from client spreadsheets. | Client data |

**Indicative total: about 3–4 weeks of build** for a polished, runnable prototype. Phases 2 and 4 can overlap. The visual designer can start skinning once phase 3 lands, because only the tokens and CSS change.

---

## 9. Path to production (for the client's developers)

Not in prototype scope. We'll document it so the estimate conversation is informed:

- **Option A: keep our Admin.** Host the Admin and API behind Horizon Power SSO, add backups and audit logging, and get a security review. Lowest integration effort, but a second CMS to govern.
- **Option B: content in Optimizely (recommended).** Create content types matching section 5 (Community, Activity, Program, CaseStudy as page/block types), then expose an endpoint or Content Graph query that outputs our JSON contract. `<RcMap />` stays the same. Our spreadsheet importer can be reused as a one-off migration script.
- Either way: cultural review stays a workflow step (Optimizely has content approval workflows), and media moves to their DAM or CDN.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Spreadsheet data is inconsistent (names, spellings, missing coordinates) | Validation report on import, community `id` matching with alternative names, and a "missing location" queue in the Admin. |
| Client developers reject the custom CMS | Position it as a prototype tool. The JSON contract and Option B (section 9) make it disposable. |
| Cultural review delays content | Placeholder content clearly marked as sample. The review workflow is built in so approval status is visible. |
| Low-bandwidth performance | List-first loading, lazy-loaded map, self-hosted lightweight geodata, responsive images, no autoplay video. Budget: under 200 KB JS on initial load (excluding the map chunk). |
| Host-site CSS or JS conflicts | Scoped CSS Modules, prefixed tokens, React as a peer dependency, a tested embed in a plain HTML page. |
| Over-fitting the engine to Horizon Power | Strict package boundary: `map-explorer` has no Horizon Power imports and is configured through props and config only. |

---

## 11. What we need from you (checklist)

### Decisions
- [ ] **Sign off this plan** (or mark changes).
- [ ] **Review the content model** in section 5 and answer the questions below.
- [ ] **Hosting for the demo** (Q10).

### Assets and data
- [ ] **Figma wireframe link** (map view, list view, community profile, program view, case study, mobile states).
- [ ] **Community spreadsheet(s).** Even a partial or sample version early helps us shape the importer. Ideally the 117 communities with name, alternative names, coordinates, region, RSP, population, languages and Traditional Owner group.
- [ ] **Activity data.** Tell us how it is currently tracked (one row per activity, or a grid of communities × activity types with statuses). We'll match the importer to whatever exists.
- [ ] **RSP list with contact details.**
- [ ] **Visit and engagement records** (or confirm visits are a simple yes/no for now).
- [ ] **Program copy:** objectives, investment figures and highlights. Confirm the A$ figures in the brief are approved for public use.
- [ ] **Case study content** for at least one flagship community (text, photos and video, with consent status) so we can prototype the story format.
- [ ] **Region boundaries:** which regional breakdown to use (Q5).
- [ ] **Approved wording:** Acknowledgement of Country and deceased-persons notice (or confirm we use the Communications Guide versions).

### Open questions
1. **Q1 — Audience split:** is the public site the only audience, or will a staff/executive view need extra (internal-only) data? This would affect the publish filter.
2. **Q2 — Optimizely version:** CMS 12 or SaaS CMS? And React how: a headless Next.js front end, or React components rendered inside Optimizely pages? (This shapes the integration guide, even without a sandbox.)
3. **Q3 — Browser support** and any client CSP (Content Security Policy) rules we should design around, for example for web workers (MapLibre uses them) or video embeds.
4. **Q4 — Population:** exact figure or size band?
5. **Q5 — Regions:** Horizon Power operating regions or WA Government regions?
6. **Q6 — Statuses:** are `to be commenced`, `in progress` and `completed` enough, or do we need "planned (funding confirmed)" for future works?
7. **Q7 — Spend:** any community-level dollar figures to show (or to avoid)?
8. **Q8 — Map look:** geographic (real coastline, regions, towns) or stylised/illustrative? This depends on the Figma wireframe. The engine supports both.
9. **Q9 — Video hosting:** is YouTube/Vimeo acceptable, or must video be self-hosted?
10. **Q10 — Demo hosting:** where should the clickable prototype live for client review (VML hosting, GitHub Pages, or a zip that runs locally)?
11. **Q11 — Languages:** any need for content in Aboriginal languages (beyond names), now or later? This would affect the content model.

---

## 12. Immediate next steps

1. You review this plan and the content model, and answer what you can of section 11.
2. On sign-off: Phase 0 (scaffold), then Phase 1 (schema, spreadsheet template, sample data).
3. When the Figma link arrives: read the wireframe through the Figma integration and map its components to the structure above.
