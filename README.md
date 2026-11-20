<div align="center">
  <img src="docs/banner.svg" alt="Winter Planner — course and timetable planner for Winter 2026–27" width="100%" />
</div>

<h1 align="center">Winter Planner</h1>

<p align="center">
  A single-page course and timetable planner for the <strong>Winter 2026–27</strong> FFCS semester at
  VIT-AP. Browse the catalogue, pick one theory and one lab slot per course, and get an instant,
  clash-free weekly timetable.
</p>

<p align="center">
  <a href="https://vitap-slots.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/live-demo-4f46e5?style=flat-square" /></a>
  <img alt="No build step" src="https://img.shields.io/badge/build-none-22c55e?style=flat-square" />
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-22c55e?style=flat-square" />
  <img alt="Catalogue validated" src="https://img.shields.io/badge/catalogue-validated-23c55e?style=flat-square" />
</p>

**Live:** <https://vitap-slots.vercel.app/> — plain HTML, CSS and JavaScript. No framework, no build
step, no server and no account; your selections stay in your own browser.

## Features

- **Catalogue** — every course with its code, title, category, credit split, instructors and every
  section (slot, venue, faculty). Search by code, title, faculty or room; stack the branch,
  category and type filters.
- **One theory, one lab** — a paired lab such as `L31+L32` counts as a single slot. Picking another
  swaps it in; a blocked swap rolls back to the previous one.
- **Timetable** — selections land on the official Tue–Sat grid (08:00–19:30), colour-coded by
  theory and lab, with instant clash detection.
- **Selections panel** — drop a single section, or clear labs, theory or the whole plan with undo.
- **Export** — **Print / PDF** for a clean A4 portrait sheet, or **Save image** for a PNG.
- **Everyday details** — dark mode, deep links (`/#courses`, `/#timetable`), keyboard shortcuts and
  full `prefers-reduced-motion` support.

## Run it

```bash
git clone https://github.com/dommetipavan26-tech/Time_Table_planner.git
cd Time_Table_planner
python3 -m http.server 8000    # or: npx serve .  — or just open index.html
```

Nothing to install and nothing to build. To deploy, import the repository on **Vercel** with the
*Other* preset, or point **GitHub Pages** at `main` / root.

## Catalogue

Winter 2026–27 · **26 courses · 100 credits · 906 sections**

| Group | Courses |
|---|---|
| MECH | `MEC4003` `MEC3002` `MEC2018` `MEC2005` |
| ECE | `ECE2003` `ECE2006` `ECE2017` `ECE3005` `ECE2016` |
| CSE | `CSE1005` `CSE1006` `CSE1007` `CSE1021` `CSE2007` `CSE2008` `CSE3008` |
| MIS | `CSE3001` `CSE3002` `SWE2004` `SWE3001` `SWE2006` |
| MIC | `ECE2015` (+ the four MIS courses that sit on both lists) |
| Common | `MAT1010` `MGT1040` `CSE1022` `STS2011` |

Common courses suit every branch and are pinned to the top of the **All** view. Everything is
4 credits except `STS2011` (1) and `CSE1021` (3). Cards list theory slots alphabetically and labs
numerically, with `L1+L2` treated as a single lab. Seat counts are deliberately left out — the
planner only needs slot, venue and instructor.

## Editing the data

All catalogue data lives in `js/data.js`: edit it and reload.

| Export | Purpose |
|---|---|
| `THEORY_SLOTS` / `LAB_SLOTS` | slot code → period index, per weekday |
| `TIMELINE` | rows of the weekly grid |
| `COURSES` | `code`, `name`, `credits`, `theoryCredits`, `labCredits`, `category` (`PC`/`PE`/`UC`/`UE`), `branch` (`MECH`/`ECE`/`CSE`/`MIS`/`MIC`/`Common`), optional `also[]`, `type`, `faculty[]`, `sections[]` |

A section is `{ code, venue, faculty, type: 'theory' | 'lab' }` in VTOP slot notation (`C2+TCC2` is
theory + tutorial, `L9+L10` two consecutive lab periods). Keep `theoryCredits + labCredits = credits`,
then bump the `?v=` asset version in `index.html`, the totals line above and the sitemap `lastmod` —
`node tools/validate-data.mjs` checks all three.

## Checks

The catalogue and planner-logic checks use Node's built-in test runner and need no install step:

```bash
node tools/validate-data.mjs
node --test tools/planner-core.test.mjs
node tools/check-links.mjs
```

For real-browser layout, contrast and print checks, install the audit-only dependencies and serve the
site in one terminal:

```bash
npm install --no-save puppeteer@23 pdfjs-dist@4
python3 -m http.server 8080
```

Then, in another terminal, run:

```bash
node tools/check-mobile.mjs http://127.0.0.1:8080/
node tools/check-contrast.mjs http://127.0.0.1:8080/
node tools/check-print.mjs http://127.0.0.1:8080/
```

Puppeteer needs a compatible Chromium/Chrome installation; set `CHROME_PATH` if it is not found
automatically. `validate.yml` runs catalogue validation, planner unit tests and link/control checks
on every pull request and push to `main`. `audit.yml` runs Lighthouse plus the browser audits and
gates on accessibility ≥ 95, best practices ≥ 90, SEO = 100 and performance ≥ 70 mobile / ≥ 90
desktop. Audit reports are uploaded as workflow artifacts; same-repository pull requests also get a
comment with the results.

## Project structure

```
index.html          # app shell: header, views, footer, dialogs
css/styles.css      # design system, motion layer, print and export styles
js/data.js          # courses, sections, slot → period mapping
js/planner-core.js  # pure scheduling/conflict logic shared with unit tests
js/app.js           # rendering, selection rules, conflicts, exports
tools/              # validators, unit tests and browser audits
docs/               # banner, OG image, launch kit, indexing and data provenance
```

## Privacy and scope

Your selected sections are stored in this browser's `localStorage`; the planner does not transmit
or sync your timetable. Browser requests do include Google Fonts, and the PNG export feature loads
`html2canvas` from cdnjs on demand. On the Vercel deployment, cookieless Vercel Web Analytics also
receives page-view data. These requests are independent of your selected timetable. If browser
storage is unavailable, the planner remains usable for the current page but cannot preserve picks
after reload or close.

The catalogue is static and hand-maintained — it does not read VTOP live, seat availability and
registration windows are out of scope, and there is no sync between devices. Check the current
official information before registering; see [docs/data-provenance.md](docs/data-provenance.md) for
the source notes and transcription limits. Not affiliated with VIT or VTOP.

More detail: [docs/google-indexing.md](docs/google-indexing.md) for getting the page listed, and
[docs/launch-kit.md](docs/launch-kit.md) for the submission checklist.

## Validation Results (Nov 20, 2026)

- **Data validation:** ✅ `node tools/validate-data.mjs` — 26 courses, 906 sections, 100 credits; all 1867 slot tokens resolve to 2396 weekly sessions.
- **Planner unit tests:** ✅ `node --test tools/planner-core.test.mjs` — 6 tests passed, including paired slots, unknown slots, overlap boundaries, multiple conflicts and storage failures.
- **Link and control checks:** ✅ `node tools/check-links.mjs` — 19 page references, 1 form control, 25 buttons and 30 unique IDs; no dead bindings or unlabeled filter groups.
- **Browser audits:** not run in this workspace because Chromium/Chrome is not installed. The mobile, contrast and print/PDF checks are available with the setup above and run in `audit.yml` on GitHub Actions.
- Catalogue integrity was checked on Nov 20; this is not independent source verification. See [data provenance](docs/data-provenance.md) for the transcription caveats.

## License

[MIT](LICENSE) © 2026 Dommeti Pavan Sesha Kumar.