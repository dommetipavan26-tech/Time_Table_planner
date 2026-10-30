<div align="center">
  <img src="docs/banner.svg" alt="Winter Planner — course and timetable planner for Winter 2026–27" width="100%" />
</div>

<h1 align="center">Winter Planner</h1>

<p align="center">
  A focused, dependency-free course &amp; timetable planner for the <strong>Winter 2026–27</strong> semester
  (VIT-AP · FFCS). Browse the catalogue, pick one theory and one lab slot per course, and get an
  instant, conflict-checked weekly timetable.
</p>

<p align="center">
  <a href="https://timetableplanner.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/live-demo-4f46e5?style=flat-square" /></a>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img alt="No build step" src="https://img.shields.io/badge/build-none-22c55e?style=flat-square" />
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-22c55e?style=flat-square" />
  <img alt="Deployed on Vercel" src="https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
</p>

---

## Overview

Winter Planner replaces the "open twenty tabs and hope" approach to FFCS registration with a
single page. It renders the whole course catalogue with every slot, venue and instructor, places
your chosen sections on the official Tue–Sat slot matrix, and refuses to let two sessions share
the same period — so the plan you build here is the plan you can actually register.

Everything runs client-side: three static files, no framework, no build step, no server, and no
account. Your selections live in `localStorage` on your own device.

**Live demo:** <https://timetableplanner.vercel.app/>

## Features

| Area | What it does |
| --- | --- |
| **Catalogue** | Course cards with code, title, PC/UC category, credit breakdown, instructor list and every section (slot + venue + faculty). Search by code/name/faculty, filter by category and course type. |
| **Slot rules** | Each course holds exactly **one theory slot and one lab slot** — a paired lab such as `L31+L32` counts as a single slot. Picking another one swaps it in; the buttons read **Swap** and a blocked swap rolls back to the previous slot. |
| **Timetable** | Selections land on the official Tue–Sat grid (08:00–19:30) with colour-coded theory/lab sessions and instantaneous clash detection. |
| **My selections** | Every chosen section with a remove button, plus **Clear labs**, **Clear theory** and **Clear whole timetable** behind an in-page confirm dialog and a 6-second **Undo**. |
| **Export** | Save the timetable as a PNG (html2canvas) or **Print / PDF** using a dedicated print stylesheet. |
| **Persistence** | Selections survive reloads and are normalised on load, so stale or duplicate entries never corrupt the plan. |
| **Interface** | Frosted-glass surfaces, eased transitions, keyboard support (`/` to search, `Esc` to clear), visible focus rings, and full `prefers-reduced-motion` support. |

## Getting started

The site is plain static files — any static server works.

```bash
# 1. clone
git clone https://github.com/dommetipavan26-tech/Time_Table_planner.git
cd Time_Table_planner

# 2. serve (pick one)
python3 -m http.server 8000
# or: npx serve .
# or: open index.html directly in a browser

# 3. visit http://localhost:8000
```

There is **nothing to install and nothing to build**. No `package.json`, no bundler, no lockfile.

### Deploy

| Host | How |
| --- | --- |
| **Vercel** | Import the repository → framework preset **Other** → deploy. `index.html` is served as-is. |
| **GitHub Pages** | Settings → Pages → deploy from branch → `main` / root. |
| **Anywhere else** | Copy `index.html`, `css/`, `js/`, `favicon.svg` to any static host. |

## The plan

Winter 2026–27 · **11 courses · 41 credits · 483 sections**

| Code | Title | Cat. | Credits | Breakdown |
|---|---|:--:|:--:|---|
| `MEC3002` | Theory of Machines | PC | 4 | Theory 3 + Lab 1 |
| `MEC2018` | Thermal Engineering Systems | PC | 4 | Theory 3 + Lab 1 |
| `MEC2005` | Fundamentals of Manufacturing Processes | PC | 4 | Theory 3 + Lab 1 |
| `MAT1010` | Probability and Statistics | UC | 4 | Theory 3 + Lab 1 |
| `ECE2003` | Control Systems Engineering | PC | 4 | Theory 3 + Lab 1 |
| `ECE2006` | Communication Systems | PC | 4 | Theory 3 + Lab 1 |
| `ECE2009` | Data Acquisition and Transmission Systems | PE | 4 | Theory 3 + Lab 1 |
| `ECE3006` | HDL Verification and Methodology | PE | 4 | Theory 3 + Lab 1 |
| `CSE1022` | Introduction to Programming | UE | 4 | Theory 3 + Lab 1 |
| `MGT1040` | Entrepreneurship | UC | 4 | Theory 3 + Project 1 |
| `STS2011` | Qualitative and Quantitative Skills Practice | UC | 1 | Theory only |

`CSE1022` carries the full VTOP export — 115 theory and 114 lab slots — so its card opens with a
scrollable list behind **Show more sections**.

> Seat/availability counts from the registration export are **intentionally not included**; the
> planner only needs slot, venue and instructor.
>
> `MEC3011` (Operations and Research) and `MEC4003` (Internal Combustion Engines) are **not** part of
> the current plan; they were removed from the catalogue and any saved sections for them are dropped
> automatically on load.

## Project structure

```
.
├── index.html          # app shell: header, views, footer, dialogs
├── favicon.svg         # gradient "W" mark
├── manifest.webmanifest# installable-app metadata
├── css/
│   └── styles.css      # design system, glass/motion layer, print styles
├── js/
│   ├── data.js         # courses, sections, slot → period mapping
│   └── app.js          # rendering, selection rules, conflicts, exports
├── docs/
│   └── banner.svg      # README artwork
└── README.md
```

## Customising the data

All catalogue data lives in `js/data.js` — edit it and reload, no build step:

| Export | Purpose |
| --- | --- |
| `THEORY_SLOTS` / `LAB_SLOTS` | slot code → period index for each weekday |
| `TIMELINE` | rows of the weekly grid |
| `COURSES` | array of courses: `code`, `name`, `credits`, `theoryCredits`, `labCredits`, `category` (`PC`/`UC`), `type`, `faculty[]`, `sections[]` |

Each section is `{ code, venue, faculty, type: 'theory' | 'lab' }`, using VTOP slot notation
(`C2+TCC2` = theory + tutorial, `L9+L10` = two consecutive lab periods). Keep
`theoryCredits + labCredits = credits`.

Source of the current data: course/faculty details come from the supplied VTOP registration
exports and official course PDFs; the slot structure is transcribed from the official Winter
2026–27 slot timetable. Categories follow VTOP: `PC` programme core, `PE` programme elective,
`UC` university core, `UE` university elective.

## Accessibility & performance

- Landmarks, a skip link, labelled controls, `aria-pressed` on slot buttons and an
  `aria-live` region for toasts.
- Every animation is disabled under `prefers-reduced-motion: reduce`.
- Glass effects degrade to solid surfaces when `backdrop-filter` is unavailable, and are
  removed for print.
- No fonts, frameworks or vendors are required beyond Google Fonts and html2canvas (CDN);
  the page renders and plans without either.

## Known limitations

- Data is static and hand-maintained; it does **not** read from VTOP live.
- Seat availability and registration windows are out of scope.
- Selection state is per browser — clearing site data clears the plan.
- `localStorage` is the only store, so there is no sync between devices.

## License

This is a personal, non-commercial student project shared for reference. No licence has been
declared yet — if you intend to reuse the code, add the licence you want (MIT is a good default).
Not affiliated with VIT or VTOP.
