# Architecture and security boundaries

## Overview

Winter Planner is a static, single-page browser app hosted by Vercel. It has no application server, database, sign-in, API endpoint, or shared user record. The catalogue and slot mappings are version-controlled in `js/data.js`; pure scheduling and backup-validation functions are in `js/planner-core.js`; browser UI and persistence are in `js/app.js`.

```text
GitHub main ── CI checks ── Vercel production static deployment
                                │
Browser: index.html → data.js + planner-core.js + app.js
                                │
          selections → localStorage (this browser only)
          JSON backup ↔ user-selected local file
```

## Data flow and trust boundaries

- The static catalogue is trusted as application data after review and `tools/validate-data.mjs`; it is not fetched from VTOP.
- Search text is used only for in-browser filtering. Catalogue values inserted into HTML are escaped by `js/app.js`.
- `localStorage` and imported JSON are treated as untrusted. Saved selections are normalized against the current catalogue; import accepts only a versioned Winter 2026–27 format, limits file size, resolves each section against the catalogue, and rejects duplicate components or clashes before changing the current plan.
- Timetable selections are not transmitted. Vercel Web Analytics receives page-view data on the Vercel hostname; Google Fonts are requested from Google. The PNG renderer is bundled locally in `js/vendor/html2canvas.min.js` and loaded only when requested.
- `vercel.json` applies a restrictive Content Security Policy, HTTPS HSTS, MIME sniffing protection, frame denial, a referrer policy, and a limited permissions policy. The CSP allows same-origin scripts only; dynamic subject colors use CSS classes, not inline styles.

## Checklist scope

SQL injection, database access control, server sessions, password storage, API-key management, server rate limiting, and database caching do not apply because this release has no server API, authentication, or database. Adding any of those features would change the privacy model and requires a separate design, data-retention policy, and security review. The existing connected Supabase project is not part of this app and must not be reused for it.

For more detail on the course-source limitations, see [data provenance](data-provenance.md). Operational deployment, backup, and recovery steps are in [operations](operations.md).
