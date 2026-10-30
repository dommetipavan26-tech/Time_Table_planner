#!/usr/bin/env node
/**
 * WCAG contrast audit for both themes — real Chrome via puppeteer.
 *
 *   npm i --no-save puppeteer
 *   npx http-server . -p 8080 &
 *   node tools/check-contrast.mjs http://127.0.0.1:8080/
 *
 * Walks every element that renders text, works out the colour it is painted on
 * (compositing semi-transparent layers up to the first opaque background) and
 * checks the pair against WCAG AA:
 *
 *   normal text  ≥ 4.5:1
 *   large text   ≥ 3.0:1   (≥ 24px, or ≥ 18.66px bold)
 *
 * Runs the whole page twice: light, then dark (the theme the header toggle sets).
 * Elements painted on a gradient or an image are counted but not judged, since
 * "the background colour" is not a single value there.
 *
 * Exits 1 when anything fails.
 */
import puppeteer from 'puppeteer';

const URL_ARG = process.argv[2] || 'http://127.0.0.1:8080/';
const THEMES = ['light', 'dark'];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const failures = [];
for (const theme of THEMES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 1 });
  if (theme === 'dark') {
    await page.evaluateOnNewDocument(() => localStorage.setItem('winterPlannerTheme', 'dark'));
  }
  await page.goto(URL_ARG, { waitUntil: 'networkidle2', timeout: 60000 });
  // make sure the dense states exist: one expanded card and a filled plan
  await page.evaluate(() => {
    const more = document.querySelector('.btn-more');
    if (more) more.click();
    const picks = [...document.querySelectorAll('.btn-select')].slice(0, 4);
    picks.forEach((b) => b.click());
  });
  await new Promise((r) => setTimeout(r, 250));

  const measure = () => page.evaluate(() => {
    const parse = (c) => {
      const m = String(c).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((n) => parseFloat(n));
      return { r, g, b, a };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    });
    const ratio = (a, b) => {
      const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.15) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    /** Effective background behind `el`, or null when a gradient/image is in the way. */
    const backdrop = (el) => {
      const layers = [];
      for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
        const s = getComputedStyle(node);
        if (s.backgroundImage && s.backgroundImage !== 'none') return null;   // gradient / image
        const bg = parse(s.backgroundColor);
        if (bg && bg.a > 0) {
          layers.push(bg);
          if (bg.a >= 0.999) break;
        }
      }
      let base = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i -= 1) base = over(layers[i], base);
      return base;
    };
    const label = (el) => {
      const cls = typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      const id = el.id ? `#${el.id}` : '';
      return el.tagName.toLowerCase() + id + cls;
    };

    const out = { checked: 0, skipped: 0, fails: [] };
    for (const el of document.querySelectorAll('body *')) {
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText || !visible(el)) continue;
      const bg = backdrop(el);
      if (!bg) { out.skipped += 1; continue; }
      const s = getComputedStyle(el);
      const fg = parse(s.color);
      if (!fg) { out.skipped += 1; continue; }
      const flat = fg.a < 1 ? over(fg, bg) : fg;
      const size = parseFloat(s.fontSize);
      const weight = parseInt(s.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const got = ratio(flat, bg);
      out.checked += 1;
      if (got + 0.01 < need) {
        out.fails.push({
          el: label(el),
          text: el.textContent.trim().slice(0, 40),
          ratio: Math.round(got * 100) / 100,
          need,
          fg: `rgb(${Math.round(flat.r)}, ${Math.round(flat.g)}, ${Math.round(flat.b)})`,
          bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
          size: `${size}px/${weight}`,
        });
      }
    }
    return out;
  });

  // Both views: the course cards (badges, section rows, credit blocks) and the
  // timetable matrix are never on screen at the same time, so each is measured
  // separately — a tab switch hides the other one from the walker.
  const coursesView = await measure();
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.nav-tab')].find((t) => t.dataset.view === 'timetable');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  const timetableView = await measure();

  let total = 0;
  for (const [view, report] of [['courses', coursesView], ['timetable', timetableView]]) {
    total += report.checked;
    const label = `${theme} / ${view}`;
    if (report.fails.length) {
      console.log(`  ${label}: ${report.fails.length} below AA`);
      for (const f of report.fails.sort((a, b) => a.ratio - b.ratio).slice(0, 20)) {
        console.log(`    ✗ ${f.ratio}:1 (needs ${f.need}) ${f.el} ${f.size} — "${f.text}" ${f.fg} on ${f.bg}`);
      }
      failures.push(...report.fails.map((f) => `${label}: ${f.el} ${f.ratio}:1`));
    }
  }
  console.log(`\n=== ${theme} theme — ${total} text colours checked` +
    ` (courses ${coursesView.checked} + timetable ${timetableView.checked}),` +
    ` ${coursesView.skipped + timetableView.skipped} unmeasurable (gradient/image backdrop) ===`);
  if (!coursesView.fails.length && !timetableView.fails.length) console.log('  ✓ every measured pair meets WCAG AA');
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`\n✗ ${failures.length} contrast failure${failures.length === 1 ? '' : 's'} across both themes`);
  process.exit(1);
}
console.log('\n✓ contrast clean in light and dark');
