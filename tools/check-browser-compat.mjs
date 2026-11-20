#!/usr/bin/env node
/** Fast end-to-end smoke checks in Chromium, Firefox and WebKit. */
import { chromium, firefox, webkit } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:8080/';
const failures = [];

for (const engine of [chromium, firefox, webkit]) {
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto(`${baseUrl}#courses`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#course-grid .course-card', { timeout: 15000 });

    const initialCards = await page.locator('#course-grid .course-card').count();
    if (initialCards < 1) throw new Error('course catalogue did not render');

    await page.locator('.branch-chip[data-branch="CSE"]').click();
    if (await page.locator('.branch-chip[data-branch="CSE"]').getAttribute('aria-pressed') !== 'true') {
      throw new Error('filter state is not exposed to assistive technology');
    }
    if (await page.locator('#course-grid .course-card').count() < 1) throw new Error('branch filter returned no courses');
    await page.locator('.branch-chip[data-branch="all"]').click();

    const select = page.locator('#course-grid .btn-select').first();
    await select.click();
    await page.locator('#view-timetable').waitFor({ state: 'attached' });
    await page.locator('.nav-tab[data-view="timetable"]').click();
    await page.locator('.schedule-table').waitFor({ state: 'visible' });

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('winter26-planner-v4') || '{}'));
    const first = Object.values(saved)[0];
    if (!first) throw new Error('selection was not saved');
    const backup = {
      format: 'vitap-winter-planner', version: 1, semester: 'winter-2026-27',
      selections: [{ courseCode: first.courseCode, sectionCode: first.sectionCode, venue: first.venue, type: first.type }],
    };
    const download = page.waitForEvent('download');
    await page.locator('#tt-save-backup').click();
    const downloaded = await download;
    if (!downloaded.suggestedFilename().endsWith('.json')) throw new Error('backup export did not create JSON');

    await page.locator('#tt-backup-file').setInputFiles({
      name: 'planner-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await page.locator('#modal').waitFor({ state: 'visible' });
    await page.locator('#modal-ok').click();
    await page.locator('#modal').waitFor({ state: 'hidden' });
    const afterRestore = await page.evaluate(() => JSON.parse(localStorage.getItem('winter26-planner-v4') || '{}'));
    if (Object.keys(afterRestore).length !== 1) throw new Error('backup restore did not replace the selection set');

    const themeBefore = await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    const themeAfter = await page.locator('html').getAttribute('data-theme');
    if (themeBefore === themeAfter) throw new Error('theme toggle did not change the theme');
    if (pageErrors.length) throw new Error(`uncaught page error: ${pageErrors.join('; ')}`);

    console.log(`✓ ${engine.name()}: catalogue, filters, timetable, local persistence, backup/restore and theme toggle`);
  } catch (error) {
    failures.push(`${engine.name()}: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

if (failures.length) {
  console.error(failures.map(failure => `✗ ${failure}`).join('\n'));
  process.exitCode = 1;
}
