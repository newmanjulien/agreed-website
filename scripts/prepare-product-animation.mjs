import { readFile, writeFile } from 'node:fs/promises';
import { createContractComposer } from './product-animation/contract/compose.ts';
import { toDocumentOverlay } from './product-animation/playbook/document-overlay.ts';
import { instructionsFields } from './product-animation/playbook/instructions-fields.ts';

// This deterministic preparation stays entirely outside the website bundle.
const blocks = JSON.parse(await readFile(new URL('./product-animation/data/contract-blocks.json', import.meta.url), 'utf8'));
const items = JSON.parse(await readFile(new URL('./product-animation/data/playbook-items.json', import.meta.url), 'utf8'));
const overlays = items.map(toDocumentOverlay);
const compose = createContractComposer(blocks, overlays);
const selections = {
	baseline: {},
	resale: { 'demo:resale': 'resale-ordinary-course-billing' },
	fees: { 'demo:resale': 'resale-ordinary-course-billing', 'demo:annual-fee-increase-main': 'annual-fee-increase-five-percent' },
	complete: { 'demo:resale': 'resale-ordinary-course-billing', 'demo:annual-fee-increase-main': 'annual-fee-increase-five-percent', 'demo:attorneys-fees': 'attorneys-fees-mutual' },
	approval: { 'demo:attorneys-fees': 'attorneys-fees-mutual' }
};
function prepare(block) {
	if (block.kind === 'table') {
		return { kind: block.kind, rows: block.rows, headerRowCount: block.headerRowCount, ...(block.variant ? { variant: block.variant } : {}) };
	}
	const runs = [];
	for (const run of block.content) {
		if (run.generated === 'empty-hit-target') continue;
		const annotation = run.annotations?.find((a) => a.kind === 'trigger');
		const target = annotation?.triggerId;
		const next = { text: run.text, ...(run.revision ? { revision: run.revision } : {}), ...(target ? { target } : {}) };
		const previous = runs.at(-1);
		if (previous && previous.target === next.target && previous.revision === next.revision) previous.text += next.text;
		else if (next.text) runs.push(next);
	}
	return { kind: block.kind, ...(block.kind === 'heading' ? { level: block.level } : {}), runs };
}
const baseline = Object.fromEntries(compose({}).map((block) => [block.blockKey, prepare(block)]));
const states = {};
for (const [id, concessions] of Object.entries(selections)) {
	let prepared;
	try { prepared = id === 'baseline' ? baseline : Object.fromEntries(compose(concessions).map((block) => [block.blockKey, prepare(block)])); }
	catch (error) { throw new Error(`Animation state ${id}, selection ${JSON.stringify(concessions)}`, { cause: error }); }
	states[id] = {
		patches: Object.fromEntries(Object.entries(prepared).filter(([key, block]) => JSON.stringify(block) !== JSON.stringify(baseline[key]))),
		concessions,
		approvalCount: items.filter((item) => item.concessions.some((c) => c.id === concessions[item._id] && c.requiresApproval)).length
	};
}
// Authored page endings leave space for every redline state. Pages can grow
// on narrow screens; the presentation never clips or repaginates the text.
const pageEndings = [8, 10, 12, 17, 19, 24, 26, 30, 35, 42, 51, 59, 64, 65, 73, 83, 92, 93, 96, 101, 112];
let start = 0;
const pages = pageEndings.map((end) => {
	const page = blocks.slice(start, end + 1).map((b) => b.blockKey);
	start = end + 1;
	return page;
});
if (pages.flat().length !== blocks.length) throw new Error('Prepared pages must contain the full contract.');
const panelIds = ['demo:resale', 'demo:amendments-statement-of-work', 'demo:annual-fee-increase-main', 'demo:attorneys-fees', 'demo:assignment'];
const panels = panelIds.map((id) => {
	const item = items.find((item) => item._id === id);
	if (!item) throw new Error(`Missing animation box: ${id}`);
	const sections = instructionsFields.slice(1).filter((f) => item.instructions?.[f.key]?.trim()).map((f) => ({ key: f.key, label: f.label, text: item.instructions[f.key] }));
	for (const tier of ['preferred', 'rare']) {
		const concessions = item.concessions.filter((c) => c.tier === tier).map(({ id, description }) => ({ id, description }));
		if (concessions.length) sections.push({ key: tier, label: `${tier === 'preferred' ? 'Preferred' : 'Rare'} ${concessions.length === 1 ? 'concession' : 'concessions'}`, concessions });
	}
	return { id, triggerId: item.triggers[0].id, summary: item.instructions?.summary ?? '', important: item.importantToNegotiate, sections };
});
await writeFile(new URL('../src/lib/components/product-animation/data/contract.json', import.meta.url), JSON.stringify({ blocks: baseline, pages, states, panels }) + '\n');
console.log(`Prepared ${pages.length} contract pages and ${Object.keys(states).length} animation states.`);
