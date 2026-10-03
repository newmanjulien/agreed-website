import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  window.contractLifecycle={writes:0,failNext:false,fontRequests:[]};
  const load=FontFaceSet.prototype.load;
  FontFaceSet.prototype.load=async function(font,text){window.contractLifecycle.fontRequests.push(font);await new Promise(r=>setTimeout(r,500));return load.call(this,font,text);};
  const rectangles=Range.prototype.getClientRects;
  Range.prototype.getClientRects=function(){
   const element=this.commonAncestorContainer.nodeType===Node.ELEMENT_NODE?this.commonAncestorContainer:this.commonAncestorContainer.parentElement;
   if(element?.closest('.layout-profile-surface')){
    window.contractLifecycle.writes++;
    if(window.contractLifecycle.failNext){window.contractLifecycle.failNext=false;throw new Error('Injected profile failure');}
   }
   return rectangles.call(this);
  };
 });
 const url=process.env.DEMO_URL??'http://127.0.0.1:5188/';
 await page.goto(url);
 await page.waitForTimeout(100);
 assert.equal(await page.locator('.demo-workspace .viewer-root').count(),0,'Do not publish before contract fonts are ready');
 await page.waitForSelector('.demo-workspace [data-highlights-ready]');
 const root=page.locator('.demo-workspace .viewer-root'),panel=page.locator('.demo-workspace .panel-rail');
 assert.ok((await page.evaluate(()=>window.contractLifecycle.fontRequests)).every(font=>font.includes('Arial')));
 const commit=await root.getAttribute('data-document-commit');
 await panel.getByRole('button',{name:/Preferred concession/}).evaluate(button=>button.click());
 await page.evaluate(()=>{window.contractLifecycle.failNext=true;});
 await panel.getByText('Apply concession',{exact:true}).evaluate(button=>button.click());
 await page.waitForSelector('[data-contract-feedback]');
 assert.equal(await root.getAttribute('data-document-commit'),commit,'Failed render retains last valid document');
 assert.equal(await page.locator('.layout-profile-surface').textContent(),'','Failed profile cleans up scratch DOM');
 await page.getByRole('button',{name:'Retry',exact:true}).click();
 await page.waitForFunction(commit=>document.querySelector('.demo-workspace .viewer-root')?.dataset.documentCommit!==commit,commit);
 await panel.getByText('Remove concession',{exact:true}).evaluate(button=>button.click());
 await page.waitForTimeout(150);
 results.push('Delayed contract font readiness and failure cleanup/Retry verified');
 const counts=[];
 for(let cycle=0;cycle<4;cycle++){
  await page.getByRole('link',{name:'Pricing',exact:true}).first().click();
  await page.waitForURL('**/pricing');
  assert.equal(await page.locator('.document-page').count(),0);
  assert.equal(await page.locator('.layout-profile-surface').count(),1,'Application measurement provider survives viewer unmount');
  assert.equal(await page.locator('.layout-profile-surface').textContent(),'','Shared scratch surface remains empty');
  await page.goBack();
  await page.waitForSelector('.demo-workspace [data-highlights-ready]');
  await page.locator('.summary-demo').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.summary-demo')?.dataset.ready==='true');
  counts.push(await page.evaluate(()=>({nodes:document.querySelectorAll('*').length,pages:document.querySelectorAll('.document-page').length,writes:window.contractLifecycle.writes})));
 }
 assert.ok(counts.every(count=>count.pages<=8));
 assert.ok(Math.max(...counts.map(c=>c.nodes))-Math.min(...counts.map(c=>c.nodes))<50);
 assert.equal(counts.at(-1).writes,counts[0].writes,'Baseline cache survives viewer unmount/remount');
 results.push('Four navigation mount/unmount cycles release pages and reuse baseline geometry');
 await writeFile('artifacts/renderer-performance/lifecycle.json',JSON.stringify({results,counts},null,2));console.log(results,counts);
} finally {await browser.close();}
