import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium, webkit } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
const browser = await engine.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const label = process.argv[2] ?? 'current';
const output = 'artifacts/renderer-performance';
await mkdir(output, { recursive: true });
const results = [];
try {
 for (const mode of ['hero', 'both', 'mounting']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ mode }) => {
   window.rendererAudit = { longTaskSupported: PerformanceObserver.supportedEntryTypes.includes('longtask'), ranges: 0, profileWrites: 0, longTasks: [], resizes: [] };
   const createRange = Document.prototype.createRange;
   Document.prototype.createRange = function () { window.rendererAudit.ranges++; return createRange.call(this); };
   if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    new PerformanceObserver(list => window.rendererAudit.longTasks.push(...list.getEntries().map(e => ({ at: e.startTime, ms: e.duration })))).observe({ type: 'longtask', buffered: true });
   }
   new MutationObserver(records => {
    for (const r of records) if (r.target instanceof Element && r.target.matches('.layout-profile-surface') && r.addedNodes.length) window.rendererAudit.profileWrites++;
   }).observe(document, { childList: true, subtree: true });
   addEventListener('resize', () => { const at = performance.now(); requestAnimationFrame(() => setTimeout(() => window.rendererAudit.resizes.push(performance.now() - at), 0)); });
   if (mode === 'hero') {
    const Observer = IntersectionObserver;
    window.IntersectionObserver = class extends Observer { observe(target) { if (!target.querySelector('.summary-demo')) super.observe(target); } };
   }
  }, { mode });
  await page.goto(process.env.DEMO_URL ?? 'http://127.0.0.1:5188/');
  await page.waitForFunction(() => document.querySelector('.demo-workspace .viewer-root') && document.querySelector('.demo-workspace [data-highlights-ready]'), undefined, { timeout: 90000 });
  if (mode === 'both') {
   await page.locator('.summary-demo').scrollIntoViewIfNeeded();
   await page.waitForFunction(() => document.querySelector('.summary-demo')?.dataset.ready === 'true', undefined, { timeout: 90000 });
  }
  await page.waitForTimeout(500);
  const initial = await page.evaluate(() => ({ ...window.rendererAudit, dom: document.querySelectorAll('*').length, pages: [...document.querySelectorAll('.viewer-root')].map(e => ({ logical: +e.dataset.pageCount, mounted: e.querySelectorAll('.document-page').length, text: e.textContent.length })), pagination: [...document.querySelectorAll('.demo-workspace .document-page')].map(e => ({ page: e.dataset.pageNumber, fragments: [...e.querySelectorAll('[data-source-fragment-key]')].map(e => e.dataset.sourceFragmentKey) })) }));
  await page.screenshot({ path: `${output}/${label}-${mode}.png` });
  const beforeCommits = await page.locator('.viewer-root').evaluateAll(elements => elements.map(element => element.dataset.documentCommit));
  await page.evaluate(() => { window.rendererAudit.resizes = []; window.rendererAudit.longTasks = []; });
  if (mode === 'mounting') await page.locator('.summary-demo').scrollIntoViewIfNeeded();
  for (const width of [639, 641, 1023, 1025, 1440, 640, 1024, 639, 1025, 641, 1440, 640, 1024, 639, 1025, 641, 1440, 640, 1024, 1440]) {
   await page.setViewportSize({ width, height: 1000 });
   await page.waitForTimeout(120);
  }
  const resized = await page.evaluate(() => ({ ...window.rendererAudit, dom: document.querySelectorAll('*').length, mountedPages: document.querySelectorAll('.document-page').length }));
  if (mode === 'mounting') await page.waitForFunction(() => document.querySelector('.summary-demo')?.dataset.ready === 'true');
  assert.equal(resized.profileWrites, initial.profileWrites, 'Scale-only resize and summary mounting must not profile');
  assert.equal(errors.length, 0, errors.join('\n'));
  const afterCommits = await page.locator('.viewer-root').evaluateAll(elements => elements.map(element => element.dataset.documentCommit));
  if (mode !== 'mounting') assert.deepEqual(afterCommits, beforeCommits, 'Scale-only resize must not repaginate');
  const sorted = [...resized.resizes].sort((a, b) => a - b);
  results.push({ mode, initial, resized, resizeP95: sorted[Math.ceil(sorted.length * .95) - 1], beforeCommits, afterCommits, errors });
  await writeFile(`${output}/${label}.json`, JSON.stringify(results, null, 2));
  console.log(`${label}: ${mode} completed, p95 ${results.at(-1).resizeP95}`);
  await page.close();
 }
 await writeFile(`${output}/${label}.json`, JSON.stringify(results, null, 2));
 console.log(JSON.stringify(results.map(({mode, initial, resized, resizeP95, errors}) => ({ mode, initial: { dom: initial.dom, pages: initial.pages, ranges: initial.ranges, profileWrites: initial.profileWrites, maxTask: Math.max(0, ...initial.longTasks.map(e => e.ms)) }, resized: { dom: resized.dom, ranges: resized.ranges, profileWrites: resized.profileWrites, maxTask: Math.max(0, ...resized.longTasks.map(e => e.ms)) }, resizeP95, errors })), null, 2));
} finally { await browser.close(); }
