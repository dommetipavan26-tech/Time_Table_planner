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
  <img alt="No runtime npm dependencies" src="https://img.shields.io/badge/runtime%20npm%20dependencies-0-22c55e?style=flat-square" />
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
- **Export and recovery** — **Print / PDF**, PNG and text exports, plus a validated, restorable JSON backup for moving or recovering a plan.
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
then bump the `?v=` asset version in `index.html` (and the versioned local vendor URL in `js/app.js`), the totals line above and the sitemap `lastmod` —
`node tools/validate-data.mjs` checks all three.

## Checks

The catalogue and planner-logic checks use Node's built-in test runner and need no install step:

```bash
node tools/validate-data.mjs
node --test tools/planner-core.test.mjs
node tools/check-links.mjs
```

For browser checks, install the pinned development tooling and browser engines, then serve the site
in one terminal:

```bash
npm ci
npx playwright install chromium firefox webkit
python3 -m http.server 8080
```

Then, in another terminal, run:

```bash
npm run check:compat -- http://127.0.0.1:8080/
node tools/check-mobile.mjs http://127.0.0.1:8080/
node tools/check-contrast.mjs http://127.0.0.1:8080/
node tools/check-print.mjs http://127.0.0.1:8080/
node tools/check-live-site.mjs
```

The local live-site probe targets production; set `SITE_URL` to check a different deployed URL. The
mobile/contrast/print scripts use Puppeteer and need a compatible Chromium/Chrome installation; set
`CHROME_PATH` if it is not found automatically. `validate.yml` runs catalogue validation, unit tests,
link/CSP-header configuration checks and `npm audit` on every pull request and push to `main`. `audit.yml` runs
Lighthouse, Chrome layout/contrast/print audits, and Chromium/Firefox/WebKit smoke tests. A separate
scheduled health workflow probes the production site; CodeQL and Dependabot provide scheduled code
and dependency checks. Audit reports are workflow artifacts; same-repository PRs also receive a
comment with the browser results.

## Project structure

```
index.html          # app shell: header, views, footer, dialogs
css/styles.css      # design system, motion layer, print and export styles
js/data.js          # courses, sections, slot → period mapping
js/planner-core.js  # pure scheduling/conflict logic shared with unit tests
js/app.js           # rendering, selection rules, persistence, import/export
js/analytics.js     # production-only Vercel Web Analytics loader
js/vendor/          # licensed, locally served PNG-export library
vercel.json         # CSP, security headers and static asset caching
package.json        # pinned development-only audit tools; no runtime npm deps
tools/              # validators, unit tests and browser audits
.github/workflows/  # validation, security scans, browser audits and health probe
docs/               # architecture, operations, source provenance and launch notes
```

## Privacy and scope

Your selected sections are stored in this browser's `localStorage`; the planner does not transmit
or sync your timetable. The PNG exporter is a licensed, versioned library served from this repository
and loaded only on demand. Browser requests do include Google Fonts; on the Vercel deployment,
cookieless Vercel Web Analytics also receives page-view data. These requests are independent of your
selected timetable. If browser storage is unavailable, the planner remains usable for the current page
but cannot preserve picks after reload or close. Use **Backup JSON** to create a restorable local
backup.

The catalogue is static and hand-maintained — it does not read VTOP live, seat availability and
registration windows are out of scope, and there is no sync between devices. Check the current
official information before registering; see [docs/data-provenance.md](docs/data-provenance.md) for
the source notes and transcription limits. Not affiliated with VIT or VTOP.

More detail: [docs/architecture.md](docs/architecture.md) for data flow and trust boundaries,
[docs/operations.md](docs/operations.md) for deployment/backup/recovery, [docs/data-provenance.md](docs/data-provenance.md)
for catalogue caveats, [docs/google-indexing.md](docs/google-indexing.md) for search indexing, and
[docs/launch-kit.md](docs/launch-kit.md) for the submission checklist.

## Validation Results (Nov 20, 2026)

- **Data validation:** ✅ 26 courses, 906 sections, 100 credits; all 1867 slot tokens resolve to 2396 weekly sessions.
- **Planner tests:** ✅ 9 Node tests passed for scheduling, overlap detection, safe persistence and JSON-backup validation.
- **Static/security checks:** ✅ link/control checks verify the deployed CSP/security-header configuration; JSON/JS syntax checks pass.
- **Dependency audit:** ✅ pinned development dependencies; `npm audit --audit-level=high` reports 0 vulnerabilities.
- **Browser/live checks:** not run locally because browser engines and production network access are unavailable in this workspace. GitHub Actions now runs Chromium/Firefox/WebKit smoke tests, visual/browser audits, and a scheduled production health probe.
- Catalogue integrity was checked on Nov 20; this is not independent source verification. See [data provenance](docs/data-provenance.md) for the transcription caveats.

## License

[MIT](LICENSE) © 2026 Dommeti Pavan Sesha Kumar.