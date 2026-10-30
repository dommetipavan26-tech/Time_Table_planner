#!/usr/bin/env node
/**
 * Catalogue validator — no dependencies, no build step.
 *
 *   node tools/validate-data.mjs
 *
 * Checks that js/data.js is internally consistent and that the docs/HTML agree
 * with it, so a mistyped slot token or a broken credit split fails loudly
 * instead of quietly rendering a wrong timetable. Exits 1 on any error.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const CATEGORIES = new Set(['PC', 'PE', 'UC', 'UE']);
const BRANCHES = new Set(['MECH', 'ECE', 'CSE', 'MIC', 'Common']);
const TYPES = new Set(['Embedded Theory and Lab', 'Embedded Theory and Project', 'Theory Only']);
const COURSE_CODE = /^[A-Z]{3}\d{4}$/;
// Rooms come as CB-516 / AB2-114 / CB-G15, or as a bare online room such as ONL01002.
const VENUE = /^(?:[A-Z]{2,4}\d{1,5}|[A-Z]{1,4}\d{0,2}-[A-Z0-9]{1,8})$/;

const errors = [];
const fail = (msg) => errors.push(msg);

/* ------------------------------------------------------------------ */
/* Load the catalogue exactly the way the browser does                 */
/* ------------------------------------------------------------------ */
const data = new Function(
  read('js/data.js') +
  '; return { COURSES, THEORY_SLOTS, LAB_SLOTS, DAYS, SLOT_THEORY_TIMES, SLOT_LAB_TIMES, THEORY_ROW, LAB_ROW };'
)();
const { COURSES, THEORY_SLOTS, LAB_SLOTS, DAYS, SLOT_THEORY_TIMES, SLOT_LAB_TIMES, THEORY_ROW, LAB_ROW } = data;

/* ------------------------------------------------------------------ */
/* Slot tables                                                         */
/* ------------------------------------------------------------------ */
const tokensFor = (table) => {
  const out = new Map(); // token -> Set(day)
  for (const day of DAYS) {
    for (const [token, idx] of Object.entries(table[day] || {})) {
      if (!out.has(token)) out.set(token, new Set());
      out.get(token).add(day);
      const limit = table === LAB_SLOTS ? SLOT_LAB_TIMES.length : SLOT_THEORY_TIMES.length;
      if (!(idx >= 0 && idx < limit)) fail(`slot table: ${day} ${token} → period ${idx} is out of range`);
    }
  }
  return out;
};
const THEORY_TOKENS = tokensFor(THEORY_SLOTS);
const LAB_TOKENS = tokensFor(LAB_SLOTS);

if (THEORY_ROW.length !== SLOT_THEORY_TIMES.length) {
  fail(`THEORY_ROW has ${THEORY_ROW.length} rows but SLOT_THEORY_TIMES has ${SLOT_THEORY_TIMES.length}`);
}
if (LAB_ROW.length !== SLOT_LAB_TIMES.length) {
  fail(`LAB_ROW has ${LAB_ROW.length} rows but SLOT_LAB_TIMES has ${SLOT_LAB_TIMES.length}`);
}
for (const day of DAYS) {
  if (!THEORY_SLOTS[day]) fail(`THEORY_SLOTS is missing ${day}`);
  if (!LAB_SLOTS[day]) fail(`LAB_SLOTS is missing ${day}`);
}

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */
if (!Array.isArray(COURSES) || COURSES.length === 0) fail('COURSES is empty or not an array');

const seenCodes = new Set();
let sections = 0;
let credits = 0;
let sessions = 0;
let tokenChecks = 0;

for (const course of COURSES) {
  const id = course.code || '(no code)';
  if (!COURSE_CODE.test(id)) fail(`${id}: course code must look like CSE1005`);
  if (seenCodes.has(id)) fail(`${id}: duplicate course code`);
  seenCodes.add(id);

  if (typeof course.name !== 'string' || !course.name.trim()) fail(`${id}: missing name`);
  if (!CATEGORIES.has(course.category)) fail(`${id}: category "${course.category}" is not PC/PE/UC/UE`);
  if (!BRANCHES.has(course.branch)) fail(`${id}: branch "${course.branch}" is not MECH/ECE/CSE/MIC/Common`);
  if (!TYPES.has(course.type)) fail(`${id}: type "${course.type}" is not a known course type`);

  const sum = (course.theoryCredits || 0) + (course.labCredits || 0) + (course.projectCredits || 0);
  if (sum !== course.credits) {
    fail(`${id}: theoryCredits ${course.theoryCredits} + labCredits ${course.labCredits}` +
         `${course.projectCredits ? ` + projectCredits ${course.projectCredits}` : ''} = ${sum}, but credits = ${course.credits}`);
  }
  credits += course.credits;

  if (!Array.isArray(course.faculty) || course.faculty.length === 0) fail(`${id}: faculty[] is empty`);
  const faculty = new Set(course.faculty || []);
  if (faculty.size !== (course.faculty || []).length) fail(`${id}: faculty[] has duplicates`);

  if (!Array.isArray(course.sections) || course.sections.length === 0) {
    fail(`${id}: sections[] is empty`);
    continue;
  }
  if (!course.sections.some((s) => s.type === 'theory')) fail(`${id}: no theory section`);
  if ((course.labCredits || 0) > 0 && !course.sections.some((s) => s.type === 'lab')) {
    fail(`${id}: labCredits is ${course.labCredits} but no lab section exists`);
  }
  if ((course.labCredits || 0) === 0 && course.sections.some((s) => s.type === 'lab')) {
    fail(`${id}: has lab sections but labCredits is 0`);
  }

  const seenSections = new Set();
  for (const section of course.sections) {
    sections += 1;
    const label = `${id} ${section.code} @ ${section.venue}`;
    if (section.type !== 'theory' && section.type !== 'lab') fail(`${label}: type must be theory or lab`);
    if (!VENUE.test(section.venue || '')) fail(`${label}: venue "${section.venue}" looks malformed`);
    if (!section.faculty) fail(`${label}: missing faculty`);
    else if (!faculty.has(section.faculty)) fail(`${label}: faculty "${section.faculty}" is not in faculty[]`);

    const key = `${section.code}|${section.venue}`;
    if (seenSections.has(key)) fail(`${label}: duplicate section (same slot and venue)`);
    seenSections.add(key);

    const tokens = String(section.code || '').split('+');
    if (tokens.length === 0 || tokens.some((t) => !t)) fail(`${label}: malformed slot code`);

    const pool = section.type === 'lab' ? LAB_TOKENS : THEORY_TOKENS;
    let hits = 0;
    for (const token of tokens) {
      tokenChecks += 1;
      const days = pool.get(token);
      if (!days) {
        fail(`${label}: unknown ${section.type} slot token "${token}"`);
        continue;
      }
      hits += days.size;
    }
    if (hits === 0) fail(`${label}: resolves to zero weekly sessions`);
    sessions += hits;
  }
}

/* ------------------------------------------------------------------ */
/* README + index.html agree with the data                             */
/* ------------------------------------------------------------------ */
const readme = read('README.md');
const totals = readme.match(/\*\*(\d+) courses · (\d+) credits · (\d+) sections\*\*/);
if (!totals) {
  fail('README.md: could not find the "**N courses · C credits · S sections**" totals line');
} else {
  const [, c, cr, s] = totals.map(Number);
  if (c !== COURSES.length) fail(`README says ${c} courses, data has ${COURSES.length}`);
  if (cr !== credits) fail(`README says ${cr} credits, data has ${credits}`);
  if (s !== sections) fail(`README says ${s} sections, data has ${sections}`);
}

const html = read('index.html');
const versions = [...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]);
if (versions.length === 0) fail('index.html: no ?v= cache-busting query found');
else if (new Set(versions).size !== 1) fail(`index.html: mixed asset versions ${[...new Set(versions)].join(', ')}`);

const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
if (!canonical) fail('index.html: missing canonical link');
if (!ogUrl) fail('index.html: missing og:url');
if (canonical && ogUrl && new URL(canonical[1]).origin !== new URL(ogUrl[1]).origin) {
  fail(`index.html: canonical (${canonical[1]}) and og:url (${ogUrl[1]}) point at different hosts`);
}
if (!ogImage) {
  fail('index.html: missing og:image');
} else {
  try {
    const path = new URL(ogImage[1]).pathname.replace(/^\//, '');
    if (!existsSync(join(ROOT, path))) fail(`index.html: og:image ${path} does not exist in the repo`);
  } catch {
    fail(`index.html: og:image "${ogImage[1]}" is not an absolute URL`);
  }
}

/* ------------------------------------------------------------------ */
/* Sitemap + robots.txt (what Google Search Console reads)             */
/* ------------------------------------------------------------------ */
const origin = canonical ? new URL(canonical[1]).origin : null;
let sitemapLocs = [];

if (!existsSync(join(ROOT, 'sitemap.xml'))) {
  fail('sitemap.xml is missing from the repo root');
} else {
  const xml = read('sitemap.xml').trim();
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) fail('sitemap.xml: missing the XML declaration');
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    fail('sitemap.xml: missing the sitemaps.org 0.9 <urlset> namespace');
  }
  if (!xml.endsWith('</urlset>')) fail('sitemap.xml: does not close with </urlset>');
  if ((xml.match(/<url>/g) || []).length !== (xml.match(/<\/url>/g) || []).length) {
    fail('sitemap.xml: unbalanced <url> elements');
  }
  sitemapLocs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (sitemapLocs.length === 0) fail('sitemap.xml: no <loc> entries');
  if (new Set(sitemapLocs).size !== sitemapLocs.length) fail('sitemap.xml: duplicate <loc> entries');
  for (const loc of sitemapLocs) {
    if (!/^https:\/\/[^\s]+$/.test(loc)) fail(`sitemap.xml: <loc> "${loc}" is not an absolute https URL`);
    else if (origin && new URL(loc).origin !== origin) {
      fail(`sitemap.xml: <loc> "${loc}" is not on the canonical host ${origin}`);
    }
  }
  for (const [, lastmod] of xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod.trim()) || Number.isNaN(Date.parse(lastmod.trim()))) {
      fail(`sitemap.xml: <lastmod> "${lastmod}" is not a real YYYY-MM-DD date`);
    }
  }
  if (canonical && sitemapLocs.length && !sitemapLocs.includes(canonical[1])) {
    fail(`sitemap.xml: the canonical URL ${canonical[1]} is not listed`);
  }
}

if (!existsSync(join(ROOT, 'robots.txt'))) {
  fail('robots.txt is missing from the repo root');
} else {
  const robots = read('robots.txt');
  if (!/^\s*Allow:\s*\/\s*$/m.test(robots)) fail('robots.txt: expected "Allow: /"');
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt: "Disallow: /" would hide the whole site from Google');
  const robotsSitemap = robots.match(/^\s*Sitemap:\s*(\S+)\s*$/m);
  if (!robotsSitemap) {
    fail('robots.txt: missing a "Sitemap:" line');
  } else if (origin && new URL(robotsSitemap[1]).origin !== origin) {
    fail(`robots.txt: Sitemap ${robotsSitemap[1]} is not on the canonical host ${origin}`);
  } else if (!/\/sitemap\.xml$/.test(robotsSitemap[1])) {
    fail(`robots.txt: Sitemap ${robotsSitemap[1]} should point at /sitemap.xml`);
  }
}

const sitemapLink = html.match(/<link rel="sitemap"[^>]*href="([^"]+)"/);
if (!sitemapLink) fail('index.html: missing <link rel="sitemap">');
else if (!/sitemap\.xml$/.test(sitemapLink[1])) fail(`index.html: <link rel="sitemap"> points at "${sitemapLink[1]}"`);

const robotsMeta = html.match(/<meta name="robots" content="([^"]+)"/);
if (!robotsMeta) fail('index.html: missing <meta name="robots">');
else if (/noindex/i.test(robotsMeta[1])) fail('index.html: <meta name="robots"> says noindex, so Google cannot list the page');

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
const perBranch = COURSES.reduce((acc, c) => ((acc[c.branch] = (acc[c.branch] || 0) + 1), acc), {});
const fourCredit = COURSES.filter((c) => c.credits === 4).length;

if (errors.length) {
  console.error(`✗ ${errors.length} problem${errors.length === 1 ? '' : 's'} found:\n`);
  for (const e of errors) console.error(`  · ${e}`);
  console.error('');
  process.exit(1);
}

console.log('✓ catalogue valid');
console.log(`  ${COURSES.length} courses · ${sections} sections · ${credits} credits · ${fourCredit} four-credit`);
console.log(`  branches: ${Object.entries(perBranch).map(([b, n]) => `${b} ${n}`).join(' · ')}`);
console.log(`  ${tokenChecks} slot tokens checked · ${sessions} weekly sessions resolved`);
console.log(`  README totals, asset version ${versions[0]}, canonical/og:url and og:image all consistent`);
console.log(`  sitemap.xml (${sitemapLocs.length} URL${sitemapLocs.length === 1 ? '' : 's'}) + robots.txt agree with the canonical host`);
