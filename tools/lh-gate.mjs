#!/usr/bin/env node
/**
 * Fail the build only on the things that matter.
 *
 *   node tools/lh-gate.mjs lh-mobile.json lh-desktop.json mobile.txt
 *
 * Gates (deliberately generous on performance, strict on correctness):
 *   accessibility    ≥ 0.95 on both form factors
 *   best practices   ≥ 0.90
 *   SEO              = 1.00 (the page is meant to be found)
 *   performance      ≥ 0.70 mobile, ≥ 0.90 desktop
 * plus: the mobile layout audit must have exited 0.
 *
 * Everything else Lighthouse reports is printed by lh-summary.mjs but does not
 * block — a CDN font that arrives late should not fail a data fix.
 */
import { existsSync, readFileSync } from 'node:fs';

const GATES = {
  mobile: { performance: 0.70, accessibility: 0.95, 'best-practices': 0.90, seo: 1 },
  desktop: { performance: 0.90, accessibility: 0.95, 'best-practices': 0.90, seo: 1 },
};

let failed = 0;
const report = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed += 1;
};

for (const [mode, gates] of Object.entries(GATES)) {
  const file = `lh-${mode}.json`;
  if (!existsSync(file)) { report(false, `${mode}: no Lighthouse report (${file})`); continue; }
  const r = JSON.parse(readFileSync(file, 'utf8'));
  for (const [cat, min] of Object.entries(gates)) {
    const score = r.categories[cat]?.score;
    report(score !== null && score !== undefined && score >= min,
      `${mode} ${cat}: ${score === null || score === undefined ? 'n/a' : Math.round(score * 100)} (needs ≥ ${Math.round(min * 100)})`);
  }
}

if (existsSync('mobile.txt')) {
  const txt = readFileSync('mobile.txt', 'utf8');
  const code = (txt.match(/exit=(\d+)/) || [])[1];
  report(code === '0', `mobile layout audit exited ${code ?? 'unknown'}${code === '0' ? '' : ' — see the PR comment for the list'}`);
} else {
  report(false, 'mobile layout audit produced no output');
}

process.exit(failed ? 1 : 0);
