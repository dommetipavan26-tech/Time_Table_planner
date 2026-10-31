# Launch kit — directories, links and copy

Everything here is about one thing: getting `https://vitap-slots.vercel.app/` in front of students who
are registering for Winter 2026–27, and giving search engines and other sites a reason to link to it.

**This file is a checklist, not a build step.** Nothing in `docs/` is served by the site.

---

## 1. What is already done (no accounts needed)

| Thing | Where | State |
|---|---|---|
| Canonical URL | `index.html` | `https://vitap-slots.vercel.app/` |
| Sitemap | `sitemap.xml` | submitted-ready, one canonical URL |
| robots.txt | `robots.txt` | `Allow: /` + `Sitemap:` line |
| Search Console verification | `index.html` | `google-site-verification` meta tag present |
| Structured data | `index.html` | `WebSite` + `WebApplication` + `FAQPage` JSON-LD |
| Social preview | `index.html` + `docs/og-image.png` | 1200×630, `summary_large_image` |
| Deep links | `js/app.js` | `/#courses`, `/#timetable` — shareable, crawlable in-page targets |
| Internal links | footer | *Jump to* column: catalogue, timetable, faculty search, About |
| Search copy | `index.html` | title, H1, description and a static About section naming VIT-AP — see [`google-indexing.md`](google-indexing.md) |
| GitHub repo | repo settings | description + homepage `https://vitap-slots.vercel.app/` |

## 2. What I cannot do for you

Directory submissions and community posts need **your** account — I have no way to log in as you,
and I will not ask for a password or token. Every item in §3 is a two-minute copy-paste job with the
copy in §4.

Also worth saying plainly: **business directories are the wrong channel for this.** Justdial, Sulekha
and Google Business Profile are for local businesses with a shopfront and a phone number. A
free student tool does not qualify, and a fabricated listing would be removed — and could hurt the
domain. The channels that work for a semester tool are the college communities in §3.

## 3. Submission checklist

Do these in order; the first two matter far more than the rest.

| # | Where | What to submit | Link |
|---|---|---|---|
| 1 | **Google Search Console** | already verified → *Indexing → Sitemaps* → `sitemap.xml` → Submit; then *URL Inspection* → Request indexing | <https://search.google.com/search-console> |
| 2 | **Bing Webmaster Tools** | “Import from Google Search Console” (one click, sitemap comes along) | <https://www.bing.com/webmasters> |
| 3 | **GitHub topics** | `timetable-planner`, `vit-ap`, `ffcs`, `course-planner`, `student-tools`, `static-site`, `vercel` — repo → About → ⚙ | repo home |
| 4 | **Class / branch groups** | WhatsApp, Telegram, Discord: the copy in §4.3. This is what actually fills the planner with users. | — |
| 5 | **Reddit** | `r/VITAP`, `r/vit`, `r/IndianAcademia` — read each sub's self-promotion rule first; post as *“I built this, feedback welcome”*, never as an ad | <https://www.reddit.com/r/VITAP/> |
| 6 | **DEV.to / Hashnode** | the write-up in §4.4; link the live site in the first paragraph | <https://dev.to/new> |
| 7 | **LinkedIn** | §4.5, tagged to your college network | <https://www.linkedin.com/feed/> |
| 8 | **Product Hunt** | §4.2 as the tagline; schedule for a weekday morning IST | <https://www.producthunt.com/posts/new> |
| 9 | **AlternativeTo** | “Alternative to Excel timetable templates / VTOP slot list”; needs an account | <https://alternativeto.net/manage/> |
| 10 | **Hacker News** | only if you have a technical angle — *Show HN: Static FFCS timetable planner, no build step, no dependencies* | <https://news.ycombinator.com/submit> |
| 11 | **Awesome lists** | open a PR against a “awesome student tools / awesome India / awesome education” list — a permanent link on a high-authority repo. Search GitHub for `awesome student` first and follow that list's contributing rules. | github.com |

Afterwards, check back in a week: **Search Console → Performance** shows which queries land, and
**Vercel → Analytics** shows visits per referrer (that is your backlink report).

## 4. Copy to paste

### 4.1 Metadata (60 / 155 characters)

- **Title:** `Winter Planner · Course & Timetable Planner`
- **Description:** `Pick one theory and one lab slot per course and get an instant, conflict-checked weekly timetable for Winter 2026–27.`

### 4.2 Tagline (Product Hunt / AlternativeTo, ≤ 60 chars)

`Clash-free VIT-AP timetables in two minutes, no login.`

### 4.3 Community message (WhatsApp / Telegram / Discord)

> Built a small planner for this semester's registration — it lists every theory and lab section with
> the faculty and room, and blocks two classes that overlap, so you can see your week before you lock
> your slots. Free, no login, works on a phone, and you can save the timetable as an image or PDF.
> https://vitap-slots.vercel.app/
>
> It has all 21 courses / 796 sections from the VTOP print-outs — tell me if a course or faculty is
> missing and I'll add it.

### 4.4 Blog post outline (DEV / Hashnode)

1. **The problem** — FFCS means ~800 sections and a paper slot list; clashes are found after the fact.
2. **The build** — one HTML file, a data file, no framework, no build step; the whole catalogue is
   `js/data.js`.
3. **The hard part** — modelling the Tue–Sat theory *and* lab matrices, and one-theory-plus-one-lab
   selection.
4. **Guarding the data** — `tools/validate-data.mjs` fails the build on an unknown slot token, a
   broken credit split or a README total that disagrees with the data.
5. **Auditing it** — Lighthouse on GitHub Actions, and a puppeteer pass that catches sideways
   scrolling at 320 px.
6. **Link** — `https://vitap-slots.vercel.app/` in the first paragraph and in the closing line.

### 4.5 LinkedIn

> Registration week is a mess of slot lists and clashes, so I built a free planner for our Winter
> 2026–27 semester: every theory and lab section with faculty and room, one-theory-plus-one-lab
> selection, automatic clash detection, and a timetable you can export as PDF or image.
>
> No login, no data collected, works offline after the first load.
> https://vitap-slots.vercel.app/

### 4.6 Suggested anchor text for people who link to you

`VIT-AP timetable planner`, `Winter 2026–27 FFCS slot planner`, `clash-free timetable builder`,
`VIT-AP slot list with faculty`, `vitap-slots.vercel.app`.

## 5. What not to do

- **No paid link networks, PBNs or “1000 backlinks for ₹500” gigs.** Google treats them as spam and
  the penalty lands on this domain.
- **No mass directory blasting.** Fifty dead directories with no traffic are worth less than one
  Reddit comment that students actually read.
- **No duplicate pages.** The app is one page by design; adding `/courses`, `/timetable` copies would
  compete with the canonical URL. Use the `#courses` / `#timetable` fragments instead.
- **No keyword stuffing** in the `<title>`, description or JSON-LD — the current copy describes the
  tool accurately, which is what ranks.
