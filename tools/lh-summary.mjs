#!/usr/bin/env node
/**
 * Summarise a Lighthouse JSON report in the terminal, so CI logs are readable.
 *
 *   node tools/lh-summary.mjs lighthouse-mobile.json [lighthouse-desktop.json ...]
 *
 * Prints the four category scores, then every audit scored below 1 that carries
 * weight — the list of things worth fixing — with the audit id so it can be
 * looked up in the HTML report.
 */
import { readFileSync } from 'node:fs';

let bad = 0;

for (const file of process.argv.slice(2)) {
  const r = JSON.parse(readFileSync(file, 'utf8'));
  const score = (n) => (n === null || n === undefined ? 'n/a' : Math.round(n * 100));
  const mode = r.configSettings?.formFactor === 'desktop' ? 'desktop' : 'mobile';
  console.log(`\n=== ${file} (${mode}) ===`);
  for (const [id, c] of Object.entries(r.categories)) {
    console.log(`  ${String(score(c.score)).padStart(3)}  ${id}`);
  }
  const failing = Object.values(r.audits).filter((a) =>
    a.score !== null && a.score < 1 && !a.scoreDisplayMode?.startsWith('informative') && a.scoreDisplayMode !== 'notApplicable');
  const withWeight = failing.filter((a) => {
    const refs = Object.values(r.categories).flatMap((c) => c.auditRefs || []);
    const ref = refs.find((x) => x.id === a.id);
    return ref && ref.weight > 0;
  });
  const rest = failing.filter((a) => !withWeight.includes(a));

  if (withWeight.length) {
    console.log(`\n  weighted failures (${withWeight.length}):`);
    for (const a of withWeight) {
      console.log(`   · ${a.id} — ${a.title}${a.displayValue ? ` [${a.displayValue}]` : ''}`);
      for (const item of (a.details?.items || []).slice(0, 3)) {
        const where = item.url || item.node?.selector || item.source?.url || item.node?.snippet || '';
        if (where) console.log(`       ${String(where).slice(0, 110)}`);
      }
    }
  }
  if (rest.length) {
    console.log(`\n  other non-perfect audits (${rest.length}):`);
    for (const a of rest.slice(0, 20)) console.log(`   · ${a.id} — ${a.title}`);
  }
  if (withWeight.length) bad += withWeight.length;
}

console.log('');
process.exit(process.env.LH_STRICT === '0' ? 0 : bad ? 1 : 0);
