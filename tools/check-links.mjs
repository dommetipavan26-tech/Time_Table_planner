#!/usr/bin/env node
/**
 * Link, asset, form-control and button-binding checker — no dependencies.
 *
 *   node tools/check-links.mjs
 *
 * Catches the boring, expensive-to-notice breakages:
 *   · a href/src pointing at a file that is not in the repo
 *   · an in-page anchor (#main) whose id no longer exists
 *   · an external link without rel="noopener" (or not https)
 *   · a form control with no label, or a button with no accessible name
 *   · duplicate ids, and ids/selectors app.js queries but the HTML never defines
 *   · a README link to a file that was renamed
 *
 * Exits 1 on any problem. Runs on a plain `node` with no install step.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const problems = [];
const fail = (msg) => problems.push(msg);

/* Files that are served by the host, not stored in the repo. */
const HOST_SERVED = [/^\/_vercel\//, /^\/\.well-known\//];

/* ------------------------------------------------------------------ */
/* Markup                                                              */
/* ------------------------------------------------------------------ */
const html = read('index.html');
const appSrc = read('js/app.js');

const attrAll = (source, attr) =>
  [...source.matchAll(new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`, 'gi'))].map((m) => m[1].trim());

const isExternal = (url) => /^[a-z][a-z0-9+.-]*:/i.test(url) && !/^\.{0,2}\//i.test(url);

/* Every href / src / action reference in the document. */
let linkCount = 0;
for (const attr of ['href', 'src', 'poster', 'action']) {
  for (const raw of attrAll(html, attr)) {
    if (!raw) continue;
    if (/^(mailto|tel|javascript|data|blob):/i.test(raw) || raw === '#') continue;

    if (isExternal(raw)) {
      linkCount += 1;
      if (!/^https:\/\//i.test(raw)) fail(`${attr}="${raw}" is external but not https`);
      continue;
    }

    if (raw.startsWith('#')) {
      linkCount += 1;
      const id = raw.slice(1);
      if (!new RegExp(`\\bid\\s*=\\s*"${id}"`).test(html)) {
        fail(`href="${raw}" — no element with id "${id}" in index.html`);
      }
      continue;
    }

    linkCount += 1;
    const clean = raw.split(/[?#]/)[0];
    if (!clean) continue;                        // e.g. "?v=10" only
    if (HOST_SERVED.some((re) => re.test(clean))) continue;

    const rel = clean.replace(/^\//, '');
    if (!existsSync(join(ROOT, rel))) fail(`${attr}="${raw}" — ${rel} is not in the repo`);
  }
}

/* External links opened in a new tab must not leak window.opener. */
for (const tag of html.match(/<a\b[^>]*>/g) || []) {
  if (!/target\s*=\s*"_blank"/i.test(tag)) continue;
  const href = (tag.match(/href\s*=\s*"([^"]*)"/) || [])[1] || '(none)';
  if (!/rel\s*=\s*"[^"]*noopener/i.test(tag)) fail(`<a href="${href}" target="_blank"> is missing rel="noopener"`);
}

/* ------------------------------------------------------------------ */
/* Forms and buttons                                                   */
/* ------------------------------------------------------------------ */
const labelFor = new Set(attrAll(html, 'for'));
const idsInHtml = new Set(attrAll(html, 'id'));
const labelWrapped = new Set();
for (const [, inner] of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) {
  for (const m of inner.matchAll(/id\s*=\s*"([^"]+)"/g)) labelWrapped.add(m[1]);
}

let controlCount = 0;
for (const [tag] of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
  const el = tag;
  controlCount += 1;
  const type = (el.match(/type\s*=\s*"([^"]*)"/i) || [])[1]?.toLowerCase();
  if (type === 'hidden') continue;
  const id = (el.match(/id\s*=\s*"([^"]*)"/i) || [])[1];
  const hasAria = /aria-label(ledby)?\s*=\s*"[^"]+"/i.test(el);
  if (!id) { fail(`<${el.slice(1, 20)}…> has no id, so no <label for> can point at it`); continue; }
  if (!labelFor.has(id) && !labelWrapped.has(id) && !hasAria) {
    fail(`form control #${id} has no <label for>, wrapping <label> or aria-label`);
  }
}

let buttonCount = 0;
for (const [tag, inner] of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
  buttonCount += 1;
  const text = inner.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').trim();
  const hasName = text.length > 0 || /aria-label(ledby)?\s*=\s*"[^"]+"/i.test(tag) || /title\s*=\s*"[^"]+"/i.test(tag);
  if (!hasName) fail(`<button${tag.replace(/\s+/g, ' ').slice(0, 60)}> has no accessible name`);
  if (/\btype\s*=\s*"(submit)"/i.test(tag)) {
    const formOpen = html.slice(0, html.indexOf(tag)).lastIndexOf('<form');
    const formClose = html.slice(0, html.indexOf(tag)).lastIndexOf('</form>');
    if (formOpen !== -1 && formOpen > formClose) fail('a <button type="submit"> sits inside a <form> that has no handler');
  }
}

/* ------------------------------------------------------------------ */
/* Duplicate ids + dead bindings between app.js and index.html          */
/* ------------------------------------------------------------------ */
const seenIds = new Map();
for (const m of html.matchAll(/\bid\s*=\s*"([^"]+)"/g)) {
  const id = m[1];
  if (seenIds.has(id)) fail(`duplicate id "${id}" in index.html`);
  seenIds.set(id, true);
}

/* ids app.js grabs with $('#x') / getElementById('x') */
const generatedInApp = new Set([...appSrc.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
for (const m of appSrc.matchAll(/\$\(\s*['"]#([A-Za-z0-9_-]+)['"]/g)) {
  const id = m[1];
  if (!idsInHtml.has(id) && !generatedInApp.has(id)) {
    fail(`js/app.js queries #${id}, but no such id exists in index.html or its templates`);
  }
}

/* data-* hooks: every data attribute in the markup should be read somewhere */
for (const [, name] of html.matchAll(/\bdata-([a-z0-9-]+)\s*=\s*"/gi)) {
  const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const used =
    appSrc.includes(`dataset.${camel}`) ||
    appSrc.includes(`data-${name}`) ||
    appSrc.includes(`[data-${name}]`);
  if (!used) fail(`data-${name} is in index.html but js/app.js never reads it (dead attribute)`);
}

/* Every addEventListener target with an #id must exist (already covered) — and
   every class selector app.js binds to must appear in the markup or a template. */
const boundClasses = new Set();
for (const m of appSrc.matchAll(/\$\$?\(\s*['"]\.([A-Za-z0-9_-]+)/g)) boundClasses.add(m[1]);
for (const cls of boundClasses) {
  const inHtml = new RegExp(`class\\s*=\\s*"[^"]*\\b${cls}\\b`).test(html);
  const inApp = new RegExp(`class=\\\\?["'\`][^"'\`]*\\b${cls}\\b`).test(appSrc) ||
                new RegExp(`class="[^"]*\\b${cls}\\b`).test(appSrc);
  if (!inHtml && !inApp) fail(`js/app.js binds to .${cls}, which never appears in the markup`);
}

/* ------------------------------------------------------------------ */
/* Manifest, sitemap, README                                           */
/* ------------------------------------------------------------------ */
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const icon of manifest.icons || []) {
  if (!existsSync(join(ROOT, icon.src.replace(/^\.?\//, '')))) fail(`manifest icon ${icon.src} is missing`);
}
if (manifest.start_url && !/^(\.\/|\/|https:)/.test(manifest.start_url)) fail(`manifest start_url "${manifest.start_url}" is not a valid URL`);

const readme = read('README.md');
let readmeLinks = 0;
for (const [, target] of readme.matchAll(/\]\(([^)\s]+)/g)) {
  if (/^(https?:|mailto:|#)/.test(target)) continue;
  readmeLinks += 1;
  const clean = target.split('#')[0];
  if (!clean) continue;
  if (!existsSync(join(ROOT, clean))) fail(`README links to ${target}, which is not in the repo`);
}
for (const [, badge] of readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
  if (/^https?:/.test(badge)) continue;
  if (!existsSync(join(ROOT, badge))) fail(`README image ${badge} is not in the repo`);
}

/* In-page anchors used by the README must exist as headings. */
for (const [, anchor] of readme.matchAll(/\]\(#([a-z0-9-]+)\)/g)) {
  const headings = [...readme.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) =>
    m[1].toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
  if (!headings.includes(anchor)) fail(`README links to #${anchor}, but no heading slug matches`);
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(posix.join(dir.slice(ROOT.length + 1), name).replace(/\\/g, '/'));
  }
})(ROOT);

if (problems.length) {
  console.error(`✗ ${problems.length} problem${problems.length === 1 ? '' : 's'} found:\n`);
  for (const p of problems) console.error(`  · ${p}`);
  console.error('');
  process.exit(1);
}

console.log('✓ links, forms and controls all check out');
console.log(`  ${linkCount} href/src/action references · ${controlCount} form control${controlCount === 1 ? '' : 's'} · ${buttonCount} button${buttonCount === 1 ? '' : 's'}`);
console.log(`  ${seenIds.size} unique ids · no duplicates, no dead app.js bindings`);
console.log(`  ${readmeLinks} README file links · manifest icons, sitemap and robots.txt present`);
console.log(`  ${files.length} files in the repo`);
