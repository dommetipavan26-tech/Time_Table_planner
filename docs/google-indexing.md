# Getting the planner into Google

Searching **“vitap time table planner”** and not finding the site is almost always **one of two
things**: the page is not indexed yet, or it is indexed but has nothing telling Google it is *the*
VIT-AP timetable planner. The code side of the second problem is fixed in the repository; the first
one needs five minutes in Search Console, and that part has to be done by you, because it is tied to
your Google account.

---

## 1. Check whether Google has the page at all

Open Google and search:

```
site:vitap-slots.vercel.app
```

- **Nothing comes back** → the page is not indexed. Go to step 2.
- **The homepage comes back** → it is indexed and this is a ranking problem. Go to step 5.

## 2. Check that the live URL is not marked `noindex`

Vercel marks *preview* deployments (`git-main-….vercel.app`, `*-git-….vercel.app`) with
`X-Robots-Tag: noindex`. Only the production domain is indexable. Run this on your own machine:

```bash
curl -sI https://vitap-slots.vercel.app/ | grep -i -E 'x-robots-tag|location'
```

- No `x-robots-tag` line → good, the URL is indexable.
- `x-robots-tag: noindex` → you are looking at a preview deployment. In Vercel, open **Project →
  Settings → Domains** and make sure `vitap-slots.vercel.app` is attached to **Production**.

## 3. Search Console: verify, then ask for a crawl

1. <https://search.google.com/search-console> → **Add property → URL prefix** →
   `https://vitap-slots.vercel.app/`.
2. Verify with the **HTML tag** method — the tag is already in the page:
   `<meta name="google-site-verification" content="b4TffC88QJJZiPkaB0fR9VJNgeLzIqiI1Ec2n8nTvog" />`
   If Search Console shows a different token, replace that line in `index.html` and redeploy.
3. **Sitemaps** → enter `sitemap.xml` → **Submit**. (`robots.txt` already advertises it.)
4. **URL Inspection** → paste `https://vitap-slots.vercel.app/` → **Request indexing**.
   Quota is about ten requests a day; one is enough.

Google normally crawls a newly requested page within a few hours to a few days. The **Pages** report
(Indexing → Pages) is the honest answer to “is it in?” — it lags by a day or two.

## 4. Bing and the rest

- <https://www.bing.com/webmasters> → **Import from Google Search Console** (one click, inherits the
  sitemap).
- Optional: DuckDuckGo and Yahoo follow Bing; Yandex and Baidu need their own consoles and are not
  worth it for a VIT-AP audience.

## 4a. What happens after you press “Request indexing”

Requesting indexing puts the URL in a queue; it is not a publish button.

| When | What you should see | Where |
|---|---|---|
| Minutes | “Indexing requested” under the URL, sometimes “URL is on Google” within the hour | Search Console → URL Inspection |
| 1–3 days | **Pages** report moves the URL from *Discovered / Crawled – currently not indexed* to **Indexed** | Indexing → Pages |
| 3–7 days | `site:vitap-slots.vercel.app` returns the page; it may sit at position 30+ for a while | Google |
| 1–3 weeks | Impressions appear for long-tail phrases (“vitap ffcs planner”, “cse1006 slot”, …) | Performance → Queries |

Two states that look like failure but are normal:

- **“Crawled – currently not indexed”** — Google has the page and thinks it is not worth ranking yet.
  Real fix: more inbound links and fresher content, not more markup.
- **“Discovered – currently not indexed”** — the URL is known but the crawl budget has not reached it.
  It usually resolves on its own; a link from a page that is already crawled speeds it up.

Do **not** request indexing repeatedly for the same URL — the queue remembers, and hammering it does
nothing. One request after each meaningful change is right.

## 4b. Keep it fast (Google's tie-breaker)

The mobile Lighthouse run in CI is the early-warning system. The PNG export used to pull `html2canvas`
from a CDN in front of the app's own scripts on every page load; it now loads only when someone taps
**Save image**, so the catalogue paints without waiting for a third-party download.

## 5. Why a brand-new site ranks low, and what actually moves it

Google ranks by usefulness **and** by who points at you. A three-week-old `*.vercel.app` page with no
inbound links will sit below VTOP itself and below any older blog post, no matter how good the
markup is. In rough order of impact:

| Lever | What to do | Effort |
|---|---|---|
| Inbound links | Post the link once in the VIT-AP student groups you are already in (WhatsApp/Telegram, r/VITAP, the batch Discord), answer a “how do I plan my slots?” question on Quora/Reddit with the link, add it to your GitHub profile and LinkedIn | 15 min, biggest effect |
| Search Console request | Step 3 above | 2 min |
| Exact-match content | Done: the page now says “VIT-AP time table planner” in the title, the H1, the description, the About copy and the schema | — |
| Freshness | Update the page each semester; Google re-crawls pages that change | per semester |
| Custom domain | `vitap-slots.vercel.app` is fine, but a short `.in`/`.com` reads more trustworthy in results and is easier to link to | optional, costs money |

Forget paid “SEO submission” services, directory spam and link farms — for a free student tool they
do nothing but add noise.

## 6. What the page now does for search (already in the repo)

- **Title:** `VIT-AP Time Table Planner · FFCS Winter 2026–27` (50 characters, keyword first).
- **H1:** “VIT-AP time table planner” with the tagline underneath — previously the H1 was only
  “Plan your semester, section by section.”, which told Google nothing.
- **Description:** 164 characters naming VIT-AP, FFCS, the course/section counts and the promise.
- **Static copy:** an About section plus a **list of all 26 courses** and six FAQs, so the page has
  real text without JavaScript — the catalogue itself is rendered client-side.
- **Schema:** `WebSite` + `WebApplication` (with `alternateName`: “VITAP Time Table Planner”,
  “VIT-AP FFCS Planner”) + `FAQPage` mirroring the visible questions.
- **Crawl basics:** canonical, `robots.txt` with the sitemap, single-URL `sitemap.xml`, `index,
  follow, max-image-preview:large`, no `noindex` anywhere.
- **Fast first paint:** no third-party script in the critical path (`html2canvas` is fetched on demand
  for the PNG export), one CSS file, fonts with `display=swap`.
- **`tools/validate-data.mjs` now fails the build** if the title stops naming VIT-AP, if the
  description leaves 90–175 characters, if the static course list drifts from `js/data.js`, or if a
  FAQ schema question is not visible on the page.

## 7. How to tell it is working

- **Search Console → Performance** shows the queries you appear for. First impressions usually come
  from long-tail phrases: “vitap ffcs planner”, “vitap winter 2026 timetable”, “cse1006 slot
  planner”, “vitap slot booking helper”.
- **Search Console → URL Inspection** on the homepage shows the last crawl date and the rendered
  HTML.
- Expect **one to three weeks** from a cold start, sooner if a couple of real pages link to you.

If nothing appears after three weeks with the sitemap submitted and the URL inspection saying
“Crawled — currently not indexed”, the page is being seen but judged thin or duplicated; the usual
fix is more real inbound links plus a semester’s worth of fresh content.
