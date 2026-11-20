#!/usr/bin/env node
/** Synthetic health and security-header check for the production static site. */
const site = new URL(process.env.SITE_URL || 'https://vitap-slots.vercel.app/');
if (site.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS.');
const problems = [];
const check = (condition, message) => { if (!condition) problems.push(message); };
const timeout = AbortSignal.timeout(20000);

try {
  const httpUrl = new URL(site);
  httpUrl.protocol = 'http:';
  const httpResponse = await fetch(httpUrl, { redirect: 'manual', signal: timeout });
  check([301, 302, 307, 308].includes(httpResponse.status), `HTTP should redirect to HTTPS (got ${httpResponse.status}).`);
  check((httpResponse.headers.get('location') || '').startsWith('https://'), 'HTTP redirect location must be HTTPS.');

  const response = await fetch(site, { redirect: 'follow', signal: timeout });
  check(response.ok, `Production returned HTTP ${response.status}.`);
  check(new URL(response.url).protocol === 'https:', 'Production did not finish on HTTPS.');
  const headers = response.headers;
  check(Boolean(headers.get('strict-transport-security')), 'Missing HSTS header.');
  check(headers.get('x-content-type-options') === 'nosniff', 'Missing or incorrect X-Content-Type-Options.');
  check(headers.get('x-frame-options') === 'DENY', 'Missing or incorrect X-Frame-Options.');
  check(headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Missing or incorrect Referrer-Policy.');
  const csp = headers.get('content-security-policy') || '';
  check(csp.includes("script-src 'self'"), 'CSP does not restrict scripts to same-origin.');
  check(csp.includes("frame-ancestors 'none'"), 'CSP does not deny framing.');
  check(!/\b(?:unsafe-inline|unsafe-eval)\b/.test(csp), 'CSP permits unsafe inline/eval execution.');

  const html = await response.text();
  check(/<title>VIT-AP Time Table Planner/.test(html), 'Expected page title is missing.');
  check(html.includes('application/ld+json'), 'Structured SEO data is missing.');
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"#]*)?)"/g)]
    .map(([, path]) => new URL(path, site))
    .filter(asset => asset.origin === site.origin);
  check(assetPaths.length >= 4, 'Expected local JS/CSS assets were not found.');
  const assetResults = await Promise.all(assetPaths.map(async asset => {
    const result = await fetch(asset, { signal: timeout });
    return { asset, result };
  }));
  for (const { asset, result } of assetResults) {
    check(result.ok, `${asset.pathname} returned HTTP ${result.status}.`);
    await result.body?.cancel();
  }
} catch (error) {
  problems.push(`Health probe failed: ${error.message}`);
}

if (problems.length) {
  console.error(`✗ ${problems.length} live-site issue(s):\n${problems.map(item => `  - ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${site.host} redirects HTTP to HTTPS, serves expected assets, and has baseline security headers`);
}
