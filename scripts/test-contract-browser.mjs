import assert from 'node:assert/strict';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
const browser = await engine.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const results = [];
const pagination = [];
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
 await page.goto(process.env.DEMO_URL ?? 'http://127.0.0.1:5188/');
 await page.waitForSelector('.demo-workspace [data-highlights-ready]');
 const root = page.locator('.demo-workspace .viewer-root');
 const viewport = page.locator('[data-demo-viewport]');
 const logical = +(await root.getAttribute('data-page-count'));
 assert.equal(logical, 18);
 assert.ok(await root.locator('.document-page').count() <= 5);
 for (let number = 1; number <= logical; number++) {
  await viewport.evaluate((element, number) => { element.scrollTop = (number - 1) * 1072; }, number);
  await page.waitForTimeout(50);
  await page.waitForSelector(`.demo-workspace .document-page[data-page-number="${number}"]`);
  assert.ok(await root.locator('.document-page').count() <= 6);
  pagination.push(await root.locator(`.document-page[data-page-number="${number}"]`).evaluate(element => ({page:element.dataset.pageNumber,fragments:[...element.querySelectorAll('[data-source-fragment-key]')].map(e=>e.dataset.sourceFragmentKey)})));
  console.log(`Scrolled page ${number}`);
 }
 if (process.env.BROWSER !== 'webkit') {
  const baseline = JSON.parse(await readFile('artifacts/renderer-performance/baseline-recovered.json','utf8'))[0].initial.pagination;
  // Historical table fragments used row intervals; static tables now use whole-block keys.
  const expected = baseline.map(page => ({
   ...page,
   fragments: page.fragments.map(key => key.replace(/^(table-[^:]+):0:\d+$/, '$1:0:whole'))
  }));
  assert.deepEqual(pagination, expected);
 }
 results.push('Full document scrolls first to last with bounded page DOM');
 await viewport.evaluate(element => { element.scrollTop = 0; });
 await page.waitForTimeout(100);
 await root.locator('.playbook-trigger[tabindex="0"]').first().focus();
 let maxFocusedPage = 0;
 for (let i = 0; i < 55; i++) {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => Number(document.activeElement?.closest('.document-page')?.dataset.pageNumber ?? 0));
  maxFocusedPage = Math.max(maxFocusedPage, focused);
  if (focused > 5) break;
 }
 assert.ok(maxFocusedPage > 3, `Keyboard focus reached only page ${maxFocusedPage}`);
 results.push('Keyboard Tab crosses virtual page boundaries');
 await viewport.evaluate(element => { element.scrollTop = 0; });
 await page.waitForTimeout(100);
 await root.locator('.playbook-trigger[tabindex="0"]').filter({ hasText: 'Resale.' }).first().press('Enter');
 const panel = page.locator('.demo-workspace .panel-rail');

 await page.screenshot({path:'artifacts/renderer-performance/hero-guidance.png'});
 const preferred = panel.getByRole('button', { name: /Preferred concession/ });
 if (await preferred.count()) await preferred.click();
 const apply = panel.getByText('Apply concession', {exact:true}).first();
 if (await apply.count()) {
  const before = await root.getAttribute('data-document-commit');
  await apply.click();
  await page.waitForFunction(before => document.querySelector('.demo-workspace .viewer-root')?.dataset.documentCommit !== before, before);
  assert.ok(await root.locator('.contract-revision-added').count() > 0);
  await panel.getByText('Remove concession', {exact:true}).first().click();
  await page.waitForTimeout(200);
  results.push('Hero Apply/Remove updates redlines and restores baseline');
 }
 const items = JSON.parse(await readFile('src/lib/components/contract-demo/data/playbook-items.json','utf8'));
 let concessionsTested = 0;
 for (const item of items.filter(item => item.concessions.length)) {
  console.log(`Testing ${item._id}`);
  let owner;
  for (let number = 1; number <= logical; number++) {
   await viewport.evaluate((element, number) => { element.scrollTop = (number - 1) * 1072; }, number);
   await page.waitForTimeout(40);
   const candidate = root.locator(`[data-item-id="${item._id}"][tabindex="0"]`).first();
   if (await candidate.count()) { owner = candidate; break; }
  }
  assert.ok(owner, `Missing annotation ${item._id}`);
  await owner.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  for (const tier of ['preferred','rare']) {
   const concessions = item.concessions.filter(concession=>concession.tier===tier);
   if (!concessions.length) continue;
   await panel.getByRole('button',{name:new RegExp(`^${tier==='preferred'?'Preferred':'Rare'} concession`)}).evaluate(button=>button.click());
   for (let index=0;index<concessions.length;index++) {
    const before = await root.getAttribute('data-document-commit');
    const anchor = await viewport.evaluate(element => {
     const top=element.getBoundingClientRect().top, bottom=element.getBoundingClientRect().bottom;
     const token=[...element.querySelectorAll('[data-source-start-key]:not([data-generated])')].find(token=>token.getBoundingClientRect().top>=top && token.getBoundingClientRect().top<bottom && !token.dataset.revision);
     return token ? {key:token.dataset.sourceStartKey,offset:token.dataset.sourceStartOffset,top:token.getBoundingClientRect().top} : null;
    });
    console.log(`Applying ${concessions[index].id}`);
    await panel.getByText('Apply concession',{exact:true}).nth(index).evaluate(button => button.click());
    await page.waitForFunction(before=>document.querySelector('.demo-workspace .viewer-root')?.dataset.documentCommit!==before || document.querySelector('[data-contract-feedback]'),before);
    assert.equal(await page.locator('[data-contract-feedback]').count(),0,`Failed render ${item._id}: ${concessions[index].id}`);
    await page.waitForTimeout(80);
    assert.equal(await page.locator('[data-contract-feedback]').count(),0,`Failed ${item._id}: ${concessions[index].id}`);
    await panel.getByText('Remove concession',{exact:true}).evaluate(button => button.click());
    await page.waitForTimeout(80);
    if(anchor){
     const after=await viewport.evaluate((element,anchor)=>[...element.querySelectorAll('[data-source-start-key]')].find(token=>token.dataset.sourceStartKey===anchor.key && token.dataset.sourceStartOffset===anchor.offset)?.getBoundingClientRect().top,anchor);
     if(after!==undefined) assert.ok(Math.abs(after-anchor.top)<3,`Scroll anchor moved for ${concessions[index].id}: ${after-anchor.top}`);
    }
    concessionsTested++;
   }
  }
 }
 assert.equal(concessionsTested, items.reduce((sum,item)=>sum+item.concessions.length,0));
 results.push(`All ${concessionsTested} saved concessions Apply/Remove successfully`);
 await page.locator('.summary-demo').scrollIntoViewIfNeeded();
 await page.waitForFunction(() => document.querySelector('.summary-demo')?.dataset.ready === 'true');
 await page.waitForTimeout(1000);
 assert.equal(+(await page.locator('.summary-demo .viewer-root').getAttribute('data-page-count')),18);
 assert.ok(await page.locator('.summary-demo .document-page').count() <= 5);
 await page.screenshot({path:'artifacts/renderer-performance/summary-reveal.png'});
 results.push('Summary reuses complete baseline and mounts its target');
 const summaryText = await page.locator('.summary-demo .viewer-root').textContent();
 await page.locator('.demo-workspace').scrollIntoViewIfNeeded();
 await viewport.evaluate(element => { element.scrollTop = 0; });
 await page.waitForTimeout(100);
 const dragTarget = root.locator('[data-item-id="demo:resale"]').first();
 await dragTarget.evaluate(element => {
  const bounds=element.getBoundingClientRect(), x=bounds.left+4, y=bounds.top+4;
  element.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerType:'touch',pointerId:7,clientX:x,clientY:y,button:0}));
  element.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerType:'touch',pointerId:7,clientX:x,clientY:y+60,button:0}));
  element.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerType:'touch',pointerId:7,clientX:x,clientY:y+60,button:0}));
  element.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
 });
 assert.equal(await dragTarget.getAttribute('aria-pressed'),'false','Touch dragging must not open another clause');
 await dragTarget.press('Enter');
 await panel.getByRole('button',{name:/Preferred concession/}).evaluate(button=>button.click());
 await panel.getByText('Apply concession',{exact:true}).evaluate(button=>button.click());
 await page.waitForTimeout(200);
 assert.equal(await page.locator('.summary-demo .viewer-root').textContent(),summaryText,'Hero edits must not mutate summary baseline');
 await panel.getByText('Remove concession',{exact:true}).evaluate(button=>button.click());
 results.push('Touch drag suppression and summary independence verified');
 assert.deepEqual(errors, []);
 await mkdir('artifacts/renderer-performance',{recursive:true});
 await writeFile(`artifacts/renderer-performance/browser-${process.env.BROWSER ?? 'chromium'}.json`, JSON.stringify({results,errors,pagination},null,2));
 console.log(results);
} finally { await browser.close(); }
