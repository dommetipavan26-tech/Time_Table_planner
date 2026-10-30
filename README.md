# Winter 2026–27 Course Planner

A clean course-registration & timetable planner for the Winter Semester 2026–27
(VIT-AP, FFCS).

## Registered courses (6)

| Code | Title | Credits | Breakdown |
|---|---|---|---|
| MEC3002 | Theory of Machines | 4 | Theory 3 + Lab 1 |
| MEC2018 | Thermal Engineering Systems | 4 | Theory 3 + Lab 1 |
| MEC2005 | Fundamentals of Manufacturing Processes | 4 | Theory 3 + Lab 1 |
| MAT1010 | Probability and Statistics | 4 | Theory 3 + Lab 1 |
| MGT1040 | Entrepreneurship | 4 | Theory 3 + Project 1 |
| STS2011 | Qualitative and Quantitative Skills Practice | 1 | Theory only |

**Total: 21 credits** if all are registered.

\* MEC3011 (Operations and Research) and MEC4003 (Internal Combustion Engines)
were removed from the catalogue — they are no longer offered in the planner. Any
saved sections for them are dropped automatically on load.

Sections, faculty and venues for MAT1010 / MGT1040 / STS2011 are taken from the
official course PDFs (OCR); MEC3002 / MEC2018 / MEC2005 sections are from the
VTOP registration screenshots. Edit `js/data.js` to adjust.

## Features

- **Courses** — cards with code, name, category (PC/UC), credit breakdown
  (`Theory 3 cr + Lab 1 cr`), faculty and every section (slot, venue, faculty).
  Search by code/name/faculty; filter by category and course type. No seat
  numbers shown.
- **Timetable** — selections are placed on the weekly grid (Tue–Sat,
  08:00–19:30) straight from the slot timetable. Theory/Lab sessions are
  colour-coded, clashes flash red, and a toggle reveals the full institute slot
  schedule behind your picks.
- **My selections panel** — every chosen section with × to remove, plus
  **Clear labs**, **Clear theory** and **Clear whole timetable** (in-page
  confirm + 6-second **Undo**). A **Clear all** button also sits in the header.
- **Faculty** — directory grouping every course by instructor.
- **Glass + motion** — frosted header, floating filter toolbar and card
  surfaces (`backdrop-filter` with a `-webkit-` prefix and a solid fallback),
  soft ambient colour behind the glass, eased hover/press transitions, a
  fading view switch, and a scroll-aware header. Everything is disabled under
  `prefers-reduced-motion: reduce` and stripped back for printing.
- Selections persist in `localStorage` (key `winter26-planner-v4`).

## Run locally

```bash
python3 -m http.server 8000   # inside this folder
# open http://localhost:8000
```

## Edit data (`js/data.js`)

- `THEORY_SLOTS` / `LAB_SLOTS` — slot code → period index, per day
- `TIMELINE` — rows of the timetable grid
- `COURSES` — each course has `credits`, `theoryCredits`, `labCredits`,
  `category` (PC/UC), `type`, `faculty[]`, and `sections[]`
  (`code`, `venue`, `faculty`, `type: 'theory' | 'lab'`).
  Keep `theoryCredits + labCredits = credits`.

Section codes follow the VTOP format, e.g. `C2+TCC2` (theory + tutorial) or
`L9+L10` (two consecutive lab periods).

## Project structure

```
index.html        # page shell, header/nav/views
css/styles.css    # design system (palette, typography, grid)
js/data.js        # courses, slots, timetable structure
js/app.js         # rendering, selection, conflict detection
```
