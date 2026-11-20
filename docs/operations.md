# Deployment, backup, and recovery runbook

## Routine checks

The repository's GitHub Actions run catalogue validation, planner unit tests, dependency audit, link/accessibility checks, CodeQL, Lighthouse, contrast, print/PDF checks, and browser smoke tests in Chromium, Firefox, and WebKit. A scheduled synthetic check probes the production HTTPS redirect, baseline security headers, page metadata, and local static assets every six hours. Check the Actions run history for failures; this workflow is not a paging service or an SLA monitor.

For a local release check:

```bash
npm ci
npm run audit:security
npm run validate
npm test
```

The browser audit setup is documented in the root [README](../README.md#checks).

## Timetable backups

Plans remain in the visitor's browser `localStorage`; the project has no server-side copy. Users should use **Backup JSON** in the Timetable view and keep the downloaded file somewhere safe. To recover on the same or another browser, choose **Restore backup** and select the JSON file. Imports are version-checked and validated against the current catalogue, and the current plan is not replaced if the file is invalid or contains clashes. The backup contains course/section identifiers and an export timestamp, not account or identity data.

The text and image exports are for viewing/printing; the JSON export is the restorable backup. Clearing site data, losing the browser profile, or losing the backup file can permanently lose a plan.

## Deployment and rollback

1. Open a pull request against `main`. Review the Vercel preview and wait for required GitHub checks to pass.
2. Merge the reviewed change. Vercel deploys the `main` commit to production; verify the production health-check workflow and the live preview.
3. For a broken deployment, use Vercel **Project → Deployments** to select the last known-good `Ready` production deployment and promote/rollback to it. Confirm the health workflow passes.
4. If the defect is in source or catalogue data, revert the offending commit through a reviewed pull request and let Vercel deploy that revert. Do not edit a production deployment by hand as a permanent fix.
5. Preserve the failed deployment URL, GitHub Actions run, and affected commit in the incident record before cleanup.

The static app has no database migration or server-side timetable state to restore. Git history is the source of truth for the catalogue and application; browser JSON backups are the source of truth for user-created plans. A Vercel project/account outage must be handled through the Vercel dashboard/support and repository redeployment.

## Recovery limitations

The scheduled workflow detects basic availability and header regressions but does not page an on-call person. GitHub notification settings determine whether maintainers are alerted. User plans are not backed up by the service. There is no database backup schedule or database restore procedure because the app has no database.
