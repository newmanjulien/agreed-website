import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compileModule } from 'svelte/compiler';
import ts from 'typescript';
import { summaryTour } from '../src/lib/components/features/summary/summary-tour.ts';

// Compile the actual rune module so this exercises the player used by the components.
const source = readFileSync(new URL('../src/lib/components/features/demo/tour-player.svelte.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
}).outputText;
const compiled = compileModule(javascript, { filename: 'tour-player.svelte.js' }).js.code
	.replace("'svelte/internal/client'", JSON.stringify(import.meta.resolve('svelte/internal/client')));
const { createGuidedTour } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('feature playback pauses timers and visuals, resumes, and preserves the summary final state', (t) => {
	let now = 0;
	let nextTimer = 0;
	let reducedMotion = false;
	const timers = new Map();
	const observers = [];
	const mutations = [];
	const document = new EventTarget();
	document.visibilityState = 'visible';
	class Element {
		animations = [];
		getAnimations() { return this.animations; }
	}
	class Animation {
		playState = 'running';
		elapsed = 0;
		started = now;
		get currentTime() { return this.elapsed + (this.playState === 'running' ? now - this.started : 0); }
		pause() { this.elapsed = this.currentTime; this.playState = 'paused'; }
		play() { this.started = now; this.playState = 'running'; }
		cancel() { this.playState = 'idle'; }
	}
	const replacements = {
		document,
		window: { matchMedia: () => ({ matches: reducedMotion }) },
		HTMLElement: Element,
		IntersectionObserver: class {
			constructor(callback) { this.callback = callback; observers.push(this); }
			observe() {}
			disconnect() {}
			change(ratio) { this.callback([{ intersectionRatio: ratio }]); }
		},
		MutationObserver: class {
			constructor(callback) { this.callback = callback; mutations.push(this); }
			observe() {}
			disconnect() {}
		},
		setTimeout: (callback, duration) => {
			const id = ++nextTimer;
			timers.set(id, { callback, at: now + duration });
			return id;
		},
		clearTimeout: (id) => timers.delete(id)
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
	const movement = new Animation();
	element.animations.push(movement);
	advance(100);
	observers.at(-1).change(0);
	const pausedAt = movement.currentTime;
	advance(1000);
	assert.equal(player.step.phase, 'approach');
	assert.equal(movement.currentTime, pausedAt);
	const resized = new Animation();
	element.animations.push(resized);
	mutations.at(-1).callback();
	assert.equal(resized.playState, 'paused', 'New transitions must also pause while offscreen.');
	observers.at(-1).change(1);
	advance(50);
	assert.equal(movement.currentTime, pausedAt + 50);
	document.visibilityState = 'hidden';
	document.dispatchEvent(new Event('visibilitychange'));
	advance(1000);
	assert.equal(movement.currentTime, pausedAt + 50);
	assert.equal(player.step.phase, 'approach');
	document.visibilityState = 'visible';
	document.dispatchEvent(new Event('visibilitychange'));
	advance(10000);
	assert.equal(player.step.state.panelOpen, true);
	assert.equal(player.step.cursor, null);
	observers.at(-1).change(0);
	observers.at(-1).change(1);
	assert.equal(player.step.phase, 'hold', 'The summary must not restart after completion.');
	stop();
	assert.equal(timers.size, 0);

	reducedMotion = true;
	const reduced = createGuidedTour(summaryTour);
	reduced.start(element)();
	assert.equal(reduced.step.state.panelOpen, true);
	assert.equal(reduced.step.cursor, null);
	assert.equal(timers.size, 0);
});
