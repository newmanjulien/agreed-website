import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { compileModule } from 'svelte/compiler';
// Transpile pure renderer modules with an explicit alias resolver; use the production code.
const root = new URL('../src/lib/components/contract-demo/', import.meta.url);
const modules = new Map();
async function moduleAt(path) {
 if (modules.has(path)) return modules.get(path);
 const work = (async () => {
  const source = readFileSync(new URL(path,root),'utf8');
  let javascript = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext}}).outputText;
  if (path.endsWith('.svelte.ts')) javascript = compileModule(javascript,{filename:path.replace(/\.ts$/,'.js')}).js.code.replace("'svelte/internal/client'",JSON.stringify(import.meta.resolve('svelte/internal/client')));
  javascript = javascript.replace(/from ['"]svelte['"]/g, `from ${JSON.stringify(import.meta.resolve('svelte'))}`);
  javascript = javascript.replace("from '$app/environment'", "from 'data:text/javascript,export const dev=false'");
  const imports = [...javascript.matchAll(/from ['"]([^'"]+)['"]/g)];
  for (const match of imports) {
   if (!match[1].startsWith('.') && !match[1].startsWith('$lib/')) continue;
   const relative = match[1].startsWith('$lib/') ? match[1].replace('$lib/components/contract-demo/','') : new URL(match[1],new URL(path,root)).href.slice(root.href.length);
   const dependency = await moduleAt(relative.endsWith('.ts')?relative:`${relative}.ts`);
   javascript = javascript.replace(match[0],`from '${dependency.url}'`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`;
  return {url,exports:await import(url)};
 })();
 modules.set(path,work);return work;
}
const { LayoutProfileCache } = (await moduleAt('document/pagination/profile-cache.ts')).exports;
const { LayoutProfiler, StaleLayoutProfileError } = (await moduleAt('document/pagination/profiler.ts')).exports;
const { ContractRenderController } = (await moduleAt('document/runtime/renderer.svelte.ts')).exports;
const { createContractSource } = (await moduleAt('document/runtime/source.ts')).exports;
const { visiblePageNumbers, sourcePage, annotationPage } = (await moduleAt('document/runtime/page-index.ts')).exports;
const heading = {kind:'heading',outerHeight:30};
test('profile ownership retains all viewers and bounds unreferenced LRU',()=>{
 const cache = new LayoutProfileCache(256), hero={}, summary={};
 cache.useEpoch('fonts');
 const baseline=new Map(Array.from({length:300},(_,i)=>[`baseline${i}`,heading]));
 cache.setBatch('fonts',baseline);cache.retain('fonts',baseline,summary);
 cache.retain('fonts',new Map([['edit',heading]]),hero);
 assert.equal(cache.stats.active,301);
 assert.ok(cache.get('fonts','baseline0'));
 cache.release(summary);
 assert.equal(cache.stats.active,1);assert.equal(cache.stats.unreferenced,256);
 cache.release(hero);assert.equal(cache.stats.owners,0);assert.equal(cache.stats.unreferenced,256);
 cache.useEpoch('new-fonts');assert.deepEqual(cache.stats,{active:0,unreferenced:0,owners:0});
});
const block={geometryFingerprint:'same',fragment:{type:'heading',tokens:[],level:1,anchor:'a',blockKey:'a'}};
test('shared profiler deduplicates concurrent geometry and never publishes stale batches',async()=>{
 let epoch='ready', calls=0;
 const surface={get epoch(){return epoch;},async profile(blocks,expected,check){calls++;await new Promise(resolve=>setTimeout(resolve,5));check?.();return {epoch:expected,profiles:blocks.map(()=>heading)};}};
 const profiler=new LayoutProfiler(surface);
 const [a,b]=await Promise.all([profiler.resolve([block],undefined,{}),profiler.resolve([block],undefined,{})]);
 assert.equal(calls,1);assert.equal(a.get(block).outerHeight,b.get(block).outerHeight);
 const stale=profiler.resolve([{...block,geometryFingerprint:'new'}]);
 setTimeout(()=>{epoch='changed';},1);
 await assert.rejects(stale,StaleLayoutProfileError);
 assert.equal(profiler.cache.get('ready','new'),undefined);
 await profiler.resolve([block]);assert.equal(calls,3,'A cancelled queue must recover');
});
test('cancelled token/profile work does not poison the shared queue',async()=>{
 let cancelled=true;
 const profiler=new LayoutProfiler({epoch:'ready',async profile(blocks,epoch,check){check?.();return{epoch,profiles:blocks.map(()=>heading)};}});
 await assert.rejects(profiler.resolve([block],()=>{if(cancelled)throw new Error('cancelled');}),/cancelled/);
 cancelled=false;await profiler.resolve([block]);assert.ok(profiler.cache.get('ready','same'));
});
test('page windows are bounded and source destinations resolve before DOM mounting',()=>{
 assert.deepEqual(visiblePageNumbers(18,0,800,1072),[1,2]);
 assert.deepEqual(visiblePageNumbers(18,1072*9,1072*10+100,1072),[9,10,11,12]);
 assert.deepEqual(visiblePageNumbers(18,1072*17,1072*18,1072),[17,18]);
 const token={value:'word',source:{start:{sourceKey:'source',offset:20},end:{sourceKey:'source',offset:24}},annotations:[{id:'target',itemId:'item',kind:'trigger'}]};
 const snapshot={pages:[{number:18,placements:[{fragment:{type:'paragraph',tokens:[token]}}]}]};
 assert.equal(sourcePage(snapshot,{sourceKey:'source',offset:22}),18);
 assert.equal(annotationPage(snapshot,'target'),18);
});

const fixture = { blocks: JSON.parse(readFileSync(new URL('data/contract-blocks.json',root))), items: JSON.parse(readFileSync(new URL('data/playbook-items.json',root))) };
test('baseline and source preparation are shared while edit cancellation keeps the last snapshot',async()=>{
 const firstSource=createContractSource(fixture), secondSource=createContractSource(fixture);
 assert.equal(firstSource,secondSource);
 const profiler=new LayoutProfiler({epoch:'test',async profile(blocks,epoch,check){
  await new Promise(resolve=>setTimeout(resolve,5));check?.();
  return {epoch,profiles:blocks.map(({fragment})=>fragment.type==='heading'?{kind:'heading',outerHeight:30}:fragment.type==='paragraph'?{
   kind:'paragraph',tokenCount:fragment.tokens.length,marginBlockStart:0,marginBlockEnd:20,contentHeight:20,
   lines:[{startToken:0,endToken:fragment.tokens.length,top:0,bottom:20}]
  }:{kind:'table',outerHeight:fragment.rows.length*44+36})};
 }});
 const hero=new ContractRenderController(), summary=new ContractRenderController();
 const input={source:firstSource.renderSource,concessions:{},profiler};
 const settled=async controller=>{for(let i=0;i<200 && controller.pending!==null;i++) await new Promise(resolve=>setTimeout(resolve,5));assert.equal(controller.pending,null);assert.equal(controller.error,null);};
 hero.request(input);summary.request(input);await Promise.all([settled(hero),settled(summary)]);
 assert.equal(hero.snapshot.pages,summary.snapshot.pages);
 const baseline=hero.snapshot;
 const chosen={'demo:resale':'resale-ordinary-course-billing'};
 hero.request({...input,concessions:chosen});hero.request(input);await settled(hero);
 assert.equal(hero.snapshot.pages,baseline.pages);
 assert.deepEqual(summary.snapshot.concessions,{});
 assert.equal(profiler.cache.stats.owners,1,'Only shared baseline retains profiles after cancellation');
 hero.destroy();summary.destroy();
});
