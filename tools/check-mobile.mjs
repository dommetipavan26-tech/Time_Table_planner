#!/usr/bin/env node
/**
 * Mobile-layout audit — real Chrome via puppeteer, no magic numbers.
 *
 *   npm i --no-save puppeteer
 *   npx http-server . -p 8080 &
 *   node tools/check-mobile.mjs http://127.0.0.1:8080/
 *
 * Loads the planner at several phone/tablet widths, on both views, and fails if
 *   · the document scrolls sideways (horizontal overflow) — the one layout bug
 *     that is invisible on a desktop monitor and obvious on a phone,
 *   · any element sticks out past the viewport,
 *   · a button is smaller than the 24×24 CSS-px minimum tap target,
 *   · text is set below 11px (hard to read on a phone),
 *   · the page logs a console error or a failed request.
 *
 * Set CHROME_PATH to use a specific Chromium build.
 */
import puppeteer from 'puppeteer';

const URL_ARG = process.argv[2] || 'http://127.0.0.1:8080/';
const WIDTHS = [320, 360, 390, 414, 768, 1024];
const VIEWS = [
  { name: 'courses', tab: 'courses' },
  { name: 'timetable', tab: 'timetable' },
];

const problems = [];
const fail = (m) => problems.push(m);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 844, deviceScaleFactor: 2, isMobile: width < 700, hasTouch: width < 700 });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/googleapis|gstatic|cdnjs|_vercel/.test(u)) return;     // third-party/CDN, not ours to fix here
    consoleErrors.push(`request failed: ${u}`);
  });

  await page.goto(URL_ARG, { waitUntil: 'networkidle2', timeout: 60000 });

  for (const view of VIEWS) {
    await page.evaluate((v) => {
      const tab = [...document.querySelectorAll('.nav-tab')].find((t) => t.dataset.view === v);
      if (tab) tab.click();
    }, view.tab);
    await new Promise((r) => setTimeout(r, 120));

    const report = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const out = {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        wide: [],
        tiny: [],
        smallText: [],
      };
      const label = (el) => {
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') continue;
        // ignore things intentionally clipped by a scroll container
        const scroller = el.closest('.sections.expanded, .tt-scroll, .table-wrap, .sel-list, .matrix-scroll');
        if (!scroller && r.right > vw + 1 && style.position !== 'fixed') out.wide.push(`${label(el)} right=${Math.round(r.right)}`);
        if (!scroller && r.left < -1 && style.position !== 'fixed') out.wide.push(`${label(el)} left=${Math.round(r.left)}`);
        if (el.matches('button, a, [role="button"], select, input[type="checkbox"]')) {
          if (r.width > 0 && (r.width < 24 || r.height < 24)) out.tiny.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        const fs = parseFloat(style.fontSize);
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (hasText && fs < 11) out.smallText.push(`${label(el)} ${fs}px`);
      }
      return out;
    }, width);

    if (report.scrollWidth > report.clientWidth + 1) {
      fail(`${width}px ${view.name}: document scrolls sideways (${report.scrollWidth} > ${report.clientWidth})`);
    }
    if (report.wide.length) fail(`${width}px ${view.name}: ${report.wide.length} element(s) past the viewport — ${report.wide.slice(0, 4).join(', ')}`);
    if (report.tiny.length) fail(`${width}px ${view.name}: ${report.tiny.length} tap target(s) under 24px — ${report.tiny.slice(0, 4).join(', ')}`);
    if (report.smallText.length) fail(`${width}px ${view.name}: ${report.smallText.length} text node(s) under 11px — ${report.smallText.slice(0, 4).join(', ')}`);
  }

  // one expanded card + a filled timetable, the two states with the densest layout
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.nav-tab')].find((t) => t.dataset.view === 'courses');
    if (tab) tab.click();
    const more = document.querySelector('.btn-more');
    if (more) more.click();
    const pick = [...document.querySelectorAll('.btn-select')].slice(0, 6);
    pick.forEach((b) => b.click());
  });
  await new Promise((r) => setTimeout(r, 200));
  const afterPick = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (afterPick.sw > afterPick.cw + 1) fail(`${width}px: sideways scroll after expanding sections and filling the plan (${afterPick.sw} > ${afterPick.cw})`);

  for (const e of [...new Set(consoleErrors)]) fail(`${width}px: console — ${e}`);
  await page.close();
}

await browser.close();

if (problems.length) {
  console.error(`✗ ${problems.length} mobile layout problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.error('  · ' + p);
  process.exit(1);
}
console.log(`✓ mobile layout clean at ${WIDTHS.join(', ')} px, both views, expanded cards and a filled plan`);
console.log('  no sideways scroll · no element past the viewport · tap targets ≥24px · text ≥11px · no console errors');
