#!/usr/bin/env node
/**
 * Print / PDF audit — real Chrome via puppeteer.
 *
 *   npm i --no-save puppeteer
 *   npx http-server . -p 8080 &
 *   node tools/check-print.mjs http://127.0.0.1:8080/
 *
 * Reproduces the thing students actually do — pick a few sections, open the
 * timetable, press Print → Save as PDF — and fails when the sheet is not a
 * clean, horizontal, A4-portrait page:
 *
 *   · the printed page is portrait A4 and not rotated (a rotated sheet is how a
 *     landscape @page rule turns into a sideways timetable in some print dialogs),
 *   · only the timetable is on the sheet (no header, filters, panels or footer),
 *   · the table fits the printable width — no sideways overflow,
 *   · no cell clips its text (every cell's content fits inside its box),
 *   · every cell has a real border and text of at least 6 pt.
 *
 * Exits 1 on any problem.
 */
import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_ARG = process.argv[2] || 'http://127.0.0.1:8080/';

/* A realistic plan, read straight out of js/data.js so the audit never goes
   stale when a slot changes. */
const data = new Function(readFileSync(join(ROOT, 'js/data.js'), 'utf8') + '; return COURSES;')();
const picks = [];
for (const code of ['MEC3002', 'MAT1010', 'CSE1006']) {
  const course = data.find((c) => c.code === code);
  if (!course) continue;
  for (const type of ['theory', 'lab']) {
    const section = course.sections.find((s) => s.type === type);
    if (!section) continue;
    picks.push({
      courseCode: course.code,
      courseName: course.name,
      sectionCode: section.code,
      venue: section.venue,
      faculty: section.faculty,
      type,
      credits: type === 'lab' ? course.labCredits : course.theoryCredits,
      color: '#4f46e5',
    });
  }
}
const stored = {};
for (const pick of picks) stored[`${pick.courseCode}::${pick.sectionCode}::${pick.venue}`] = pick;

const problems = [];
const fail = (m) => problems.push(m);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const page = await browser.newPage();
// A4 at 96 dpi is 794 × 1123 px; @page margins are 10 mm top/bottom, 8 mm sides,
// so the printable area is about 733 × 1047 px. Measure against that.
await page.setViewport({ width: 733, height: 1047, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((plan) => {
  localStorage.setItem('winter26-planner-v4', JSON.stringify(plan));
  localStorage.setItem('winterPlannerTheme', 'light');
}, stored);
await page.goto(URL_ARG, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('.nav-tab')].find((t) => t.dataset.view === 'timetable');
  if (tab) tab.click();
});
await new Promise((r) => setTimeout(r, 200));
await page.emulateMediaType('print');
await new Promise((r) => setTimeout(r, 200));

/* ---------------- what the print media query actually does ---------------- */
const report = await page.evaluate(() => {
  const shown = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
  };
  const out = {
    printHead: shown('.print-head'),
    header: shown('.site-header'),
    courses: shown('#view-courses'),
    panel: shown('.sel-panel'),
    footer: shown('.site-footer'),
    table: shown('.schedule-table'),
    legend: shown('.tt-legend'),
    docWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowing: [],
    clipped: [],
    tiny: [],
    borderless: [],
    page: { w: 0, h: 0 },
  };
  const limit = document.documentElement.clientWidth;
  const cells = [...document.querySelectorAll('.schedule-table th, .schedule-table td')];
  for (const cell of cells) {
    const r = cell.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > limit + 1) out.overflowing.push(`${cell.tagName.toLowerCase()}.${cell.className} right=${Math.round(r.right)}`);
    // clipped text: content wider/taller than the box it is drawn in
    if (cell.scrollWidth > cell.clientWidth + 1 || cell.scrollHeight > cell.clientHeight + 1) {
      out.clipped.push(`"${cell.textContent.trim().slice(0, 24)}" ${cell.clientWidth}×${cell.clientHeight} vs ${cell.scrollWidth}×${cell.scrollHeight}`);
    }
    const cs = getComputedStyle(cell);
    const size = parseFloat(cs.fontSize);
    if (size < 8) out.tiny.push(`"${cell.textContent.trim().slice(0, 18)}" ${size}px`);
    const bw = ['Top', 'Right', 'Bottom', 'Left']
      .map((side) => parseFloat(cs[`border${side}Width`]))
      .filter((n) => n > 0).length;
    if (bw < 4) out.borderless.push(`"${cell.textContent.trim().slice(0, 18)}" ${bw}/4 borders`);
  }
  for (const el of document.querySelectorAll('#view-timetable *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width && r.right > limit + 1) out.overflowing.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
  }
  return out;
});

if (!report.table) fail('the timetable table is not visible in print media');
if (!report.printHead) fail('.print-head (the sheet title) is not printed');
if (report.header) fail('.site-header is still printed');
if (report.courses) fail('the course catalogue is still printed');
if (report.panel) fail('the selections panel is still printed');
if (report.footer) fail('the site footer is still printed');
if (!report.legend) fail('the picked sections legend is not printed');
if (report.docWidth > report.clientWidth + 1) {
  fail(`the sheet scrolls sideways (${report.docWidth} > ${report.clientWidth} px)`);
}
if (report.overflowing.length) fail(`${report.overflowing.length} element(s) past the printable width — ${report.overflowing.slice(0, 4).join(', ')}`);
if (report.clipped.length) fail(`${report.clipped.length} cell(s) clip their text — ${report.clipped.slice(0, 4).join(', ')}`);
if (report.tiny.length) fail(`${report.tiny.length} cell(s) below 6 pt — ${report.tiny.slice(0, 4).join(', ')}`);
if (report.borderless.length) fail(`${report.borderless.length} cell(s) without a full border — ${report.borderless.slice(0, 4).join(', ')}`);

/* ---------------- the PDF itself ---------------- */
const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });

/* Chrome wraps the page dictionaries in object streams, so the sheet is read
   back with pdf.js instead of a regex. */
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await getDocument({ data: new Uint8Array(pdf), useSystemFonts: false, isEvalSupported: false }).promise;
const first = await doc.getPage(1);
const view = first.getViewport({ scale: 1 });
const w = Math.round(view.width);
const h = Math.round(view.height);
const pages = doc.numPages;

/* Upright text on a portrait sheet: every glyph run has to read left to right
   and stop before the right margin. A rotated run is the sideways timetable. */
const text = await first.getTextContent();
let glyphs = 0, tilted = 0, pastMargin = 0, furthest = 0;
const tiltedSamples = [];
for (const item of text.items) {
  if (!item.str || !item.str.trim()) continue;
  glyphs += 1;
  const angle = Math.abs((Math.atan2(item.transform[1], item.transform[0]) * 180) / Math.PI);
  if (angle > 1) {
    tilted += 1;
    if (tiltedSamples.length < 3) tiltedSamples.push(`"${item.str.trim().slice(0, 14)}" ${angle.toFixed(0)}°`);
  }
  const right = item.transform[4] + (item.width || 0);
  if (right > furthest) furthest = right;
  if (right > view.width - 8) pastMargin += 1;
}

if (w > h) fail(`the PDF page is landscape (${w}×${h} pt) — the timetable should be a portrait A4 sheet`);
if (Math.abs(w - 595) > 6 || Math.abs(h - 842) > 6) fail(`the PDF page is ${w}×${h} pt, not A4 portrait (595×842)`);
if (first.rotate % 360 !== 0) fail(`the PDF page is rotated ${first.rotate}° — that is the sideways timetable`);
if (pages > 2) fail(`the timetable spills over ${pages} pages`);
if (glyphs === 0) fail('the PDF contains no text — nothing was printed');
if (tilted) fail(`${tilted} of ${glyphs} text runs are rotated, not horizontal — ${tiltedSamples.join(', ')}`);
if (pastMargin) fail(`${pastMargin} text run(s) cross the right margin (furthest glyph ends at ${Math.round(furthest)} of ${Math.round(view.width)} pt) — the sheet is clipped`);
await doc.destroy();

/* ---------------- the PNG download (html2canvas reads screen CSS) ---------------- */
await page.emulateMediaType('screen');
const exportMode = await page.evaluate(() => {
  const grid = document.querySelector('#tt-grid');
  const table = document.querySelector('.schedule-table');
  grid.classList.add('is-exporting');
  const css = getComputedStyle(table);
  const width = Math.round(table.getBoundingClientRect().width);
  const cells = [...table.querySelectorAll('th, td')].filter((c) => c.getBoundingClientRect().width > 0);
  let clipped = 0, borderless = 0, past = 0;
  const tableRight = table.getBoundingClientRect().right;
  for (const cell of cells) {
    if (cell.scrollWidth > cell.clientWidth + 1 || cell.scrollHeight > cell.clientHeight + 1) clipped += 1;
    const cs = getComputedStyle(cell);
    const edges = ['Top', 'Right', 'Bottom', 'Left'].filter((side) => parseFloat(cs[`border${side}Width`]) > 0).length;
    if (edges < 4) borderless += 1;
    if (cell.getBoundingClientRect().right > tableRight + 1) past += 1;
  }
  const code = table.querySelector('.matrix-cell.is-selected .matrix-course b');
  const size = code ? parseFloat(getComputedStyle(code).fontSize) : 0;
  const wrap = code ? getComputedStyle(code).whiteSpace : '';
  grid.classList.remove('is-exporting');
  return { width, cells: cells.length, clipped, borderless, past, size, wrap, minWidth: css.minWidth };
});
if (exportMode.width < 1100) fail(`the PNG export sheet is only ${exportMode.width} px wide — it should be a wide, single-sheet capture`);
if (exportMode.clipped) fail(`${exportMode.clipped} export cell(s) clip their text`);
if (exportMode.borderless) fail(`${exportMode.borderless} export cell(s) without a border on all four sides`);
if (exportMode.past) fail(`${exportMode.past} export cell(s) past the table edge`);
if (exportMode.wrap !== 'normal') fail(`export captions are ${exportMode.wrap}, not wrapped`);
if (exportMode.size && exportMode.size < 10) fail(`export captions are ${exportMode.size} px — too small`);

await browser.close();

if (problems.length) {
  console.error(`✗ ${problems.length} print problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.error('  · ' + p);
  process.exit(1);
}
console.log(`✓ print sheet is clean — A4 portrait ${w}×${h} pt, rotation 0°, ${pages} page(s)`);
console.log(`  ${glyphs} horizontal text runs, none tilted, furthest glyph ${Math.round(furthest)} of ${w} pt`);
console.log('  timetable only · fits the printable width · no clipped cells · full borders · text ≥ 6 pt');
console.log(`  PNG export: ${exportMode.width} px sheet, ${exportMode.cells} cells, ${exportMode.clipped} clipped, ${exportMode.borderless} without borders`);
