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
// Chrome writes the page dictionaries uncompressed, so the sheet geometry can be
// read straight out of the bytes — no PDF library needed.
const bytes = pdf.toString('latin1');
const box = /MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(bytes);
let w = 0, h = 0;
if (box) { w = Number(box[3]) - Number(box[1]); h = Number(box[4]) - Number(box[2]); }
else fail('the PDF has no MediaBox — could not read the page size');

const rotate = /\/Rotate\s+(\d+)/.exec(bytes);
const pages = (bytes.match(/\/Type\s*\/Page[^s]/g) || []).length;

if (w && h) {
  if (w > h) fail(`the PDF page is landscape (${Math.round(w)}×${Math.round(h)} pt) — the timetable should be a portrait A4 sheet`);
  if (Math.abs(w - 595) > 6 || Math.abs(h - 842) > 6) fail(`the PDF page is ${Math.round(w)}×${Math.round(h)} pt, not A4 portrait (595×842)`);
}
if (rotate && Number(rotate[1]) % 360 !== 0) fail(`the PDF page is rotated ${rotate[1]}° — that is the sideways timetable`);
if (pages > 2) fail(`the timetable spills over ${pages} pages`);

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
console.log(`✓ print sheet is clean — A4 portrait ${Math.round(w)}×${Math.round(h)} pt, rotation ${rotate ? rotate[1] : '0'}°, ${pages} page(s)`);
console.log('  timetable only · fits the printable width · no clipped cells · full borders · text ≥ 6 pt');
console.log(`  PNG export: ${exportMode.width} px sheet, ${exportMode.cells} cells, ${exportMode.clipped} clipped, ${exportMode.borderless} without borders`);
