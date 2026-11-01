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
  <img alt="Catalogue validated" src="https://img.shields.io/badge/catalogue-validated-22c55e?style=flat-square" />
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
| ECE | `ECE2003` `ECE2006` `ECE2009` `ECE3006` `ECE2016` |
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

```bash
node tools/validate-data.mjs                          # catalogue, credits, README totals, SEO tags
node tools/check-links.mjs                            # dead links, labels, ids, unused bindings
node tools/check-mobile.mjs http://127.0.0.1:8080/    # layout at 320–1024 px (needs puppeteer)
node tools/check-print.mjs  http://127.0.0.1:8080/    # printed A4 sheet and PNG export (pdfjs-dist)
```

`validate.yml` runs the first two on every push and pull request. `audit.yml` runs Lighthouse plus
the layout, contrast and print audits, posts the numbers on the pull request, and gates on
accessibility ≥ 95, best practices ≥ 90, SEO = 100 and performance ≥ 70 mobile / ≥ 90 desktop.

## Project structure

```
index.html          # app shell: header, views, footer, dialogs
css/styles.css      # design system, motion layer, print and export styles
js/data.js          # courses, sections, slot → period mapping
js/app.js           # rendering, selection rules, conflicts, exports
tools/              # validators and browser audits
docs/               # banner, OG image, launch kit, indexing notes
```

## Privacy and scope

Selections are written to `localStorage` and never leave the device; the only page-view request is
cookieless Vercel Web Analytics. The catalogue is static and hand-maintained — it does not read VTOP
live, seat availability and registration windows are out of scope, and there is no sync between
devices. Not affiliated with VIT or VTOP.

More detail: [docs/google-indexing.md](docs/google-indexing.md) for getting the page listed, and
[docs/launch-kit.md](docs/launch-kit.md) for the submission checklist.

## License

[MIT](LICENSE) © 2026 Dommeti Pavan Sesha Kumar.
