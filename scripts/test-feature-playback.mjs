import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compileModule } from 'svelte/compiler';
import ts from 'typescript';
import { summaryTour } from '../src/lib/components/features/summary/summary-tour.ts';

// Compile the actual rune module so this exercises the player used by the components.
const source = readFileSync(new URL('../src/lib/components/product-animation/tour-player.svelte.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
}).outputText;
const compiled = compileModule(javascript, { filename: 'tour-player.svelte.js' }).js.code
	.replace("'svelte/internal/client'", JSON.stringify(import.meta.resolve('svelte/internal/client')))
	.replace("'./tour-model.ts'", JSON.stringify(new URL('../src/lib/components/product-animation/tour-model.ts', import.meta.url).href));
const { createGuidedTour } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('feature playback pauses timers and visuals, resumes, and preserves the summary final state', (t) => {
	let now = 0;
	let nextTimer = 0;
	let reducedMotion = false;
	const timers = new Map();
	const observers = [];

	const document = new EventTarget();
	document.visibilityState = 'visible';
	class Element { getBoundingClientRect() { return { width: 400, height: 430 }; } }
	const window = new EventTarget();
	window.innerWidth = 1000; window.innerHeight = 1000;
	const preference = new EventTarget();
	Object.defineProperty(preference, 'matches', { get: () => reducedMotion });
	window.matchMedia = () => preference;
	const replacements = {
		document,
		window,
		HTMLElement: Element,
		IntersectionObserver: class {
			constructor(callback) { this.callback = callback; observers.push(this); }
			observe() {}
			disconnect() {}
			change(ratio) { this.callback([{ boundingClientRect: { width: 400, height: 430 }, intersectionRect: { width: 400, height: 430 * ratio }, rootBounds: { width: 1000, height: 1000 } }]); }
		},
		setTimeout: (callback, duration) => {
			const id = ++nextTimer;
			timers.set(id, { callback, at: now + duration });
			return id;
		},
		clearTimeout: (id) => timers.delete(id),
		requestAnimationFrame: (callback) => { const id = ++nextTimer; timers.set(id, { callback: () => callback(now), at: now + 1 }); return id; },
		cancelAnimationFrame: (id) => timers.delete(id)
	};
	for (const [key, value] of Object.entries(replacements)) {
		const previous = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
		t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key]);
	}
	t.mock.method(performance, 'now', () => now);
	function advance(duration) {
		const end = now + duration;
		while (true) {
			const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
			if (!next || next[1].at > end) break;
			now = next[1].at;
			timers.delete(next[0]);
			next[1].callback();
		}
		now = end;
	}

	const element = new Element();
	const player = createGuidedTour(summaryTour);
	const stop = player.start(element);
	observers.at(-1).change(1);
	advance(summaryTour[0].duration + summaryTour[1].duration);
	assert.equal(player.step.phase, 'approach');
	advance(100);
	observers.at(-1).change(0);
	const pausedAt = player.elapsed;
	advance(1000);
	assert.equal(player.step.phase, 'approach');
	assert.equal(player.elapsed, pausedAt);
	observers.at(-1).change(1);
	advance(50);
	assert.equal(player.elapsed, pausedAt + 50);
	document.visibilityState = 'hidden';
	document.dispatchEvent(new Event('visibilitychange'));
	advance(1000);
	assert.equal(player.elapsed, pausedAt + 50);
	assert.equal(player.step.phase, 'approach');
	document.visibilityState = 'visible';
	document.dispatchEvent(new Event('visibilitychange'));
	advance(10000);
	assert.equal(Boolean(player.step.state.box), true);
	assert.equal(player.step.cursor, null);
	observers.at(-1).change(0);
	observers.at(-1).change(1);
	assert.equal(player.step.phase, 'hold', 'The summary must not restart after completion.');
	stop();
	assert.equal(timers.size, 0);

	reducedMotion = true;
	const reduced = createGuidedTour(summaryTour);
	reduced.start(element)();
	assert.equal(Boolean(reduced.step.state.box), true);
	assert.equal(reduced.step.cursor, null);
	assert.equal(timers.size, 0);
});
