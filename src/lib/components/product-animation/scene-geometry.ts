import { tick } from 'svelte';
import { motionTiming, type AnimationState, type AnimationStep, type AnimationTarget, type PreparedContract } from './model';

const clamp = (value: number, maximum: number) => Math.max(0, Math.min(Math.max(0, maximum), value));
const progress = (elapsed: number, duration = 0) => duration ? Math.min(1, elapsed / duration) : 1;
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
// Match the existing CSS timing curves while sampling them from the tour clock.
function bezier(x1: number, y1: number, x2: number, y2: number) {
	const curve = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
	return (value: number) => {
		let low = 0, high = 1, t = value;
		for (let i = 0; i < 16; i++) {
			const x = curve(t, x1, x2);
			if (Math.abs(x - value) < .00001) break;
			if (x < value) low = t; else high = t;
			t = (low + high) / 2;
		}
		return curve(t, y1, y2);
	};
}
const ease = bezier(.25, .1, .25, 1);
const cssEaseOut = bezier(0, 0, .58, 1);
const easeInOut = bezier(.42, 0, .58, 1);
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
export interface CursorFrame { x: number; y: number; opacity: number; ringOpacity: number; ringScale: number; scale: number }
interface Elements { frame: HTMLElement; stage: HTMLElement; viewport: HTMLElement; column: HTMLElement; rail: HTMLElement }
interface Bounds { left: number; right: number; top: number; bottom: number }
interface SceneMeasurements {
	clauses: Map<string, Bounds>; revisions: Map<string, Bounds>; targets: Map<string, TargetPoint>;
	panelBounds: Map<string, Bounds>; panelScrollHeight: number; panelHeight: number; actions: Bounds;
}
interface TargetPoint { x: number; y: number; attachment: 'document' | 'panel' | 'panel-frame' | 'origin' }
interface MotionValues { scroll: number; panelScroll: number; paper: number; opacity: number }
interface Values extends MotionValues { cursor: CursorFrame }
const emptyCursor = (): CursorFrame => ({ x: 0, y: 0, opacity: 0, ringOpacity: 0, ringScale: .45, scale: 1 });

export function validateTour(tour: readonly AnimationStep[], contract: PreparedContract) {
	const panels = new Map(contract.panels.map((panel) => [panel.id, panel]));
	for (const beat of tour) {
		const fail = (message: string): never => { throw new Error(`Animation beat ${beat.phase}: ${message}`); };
		if (!contract.states[beat.state.contract]) fail('unknown contract state');
		if (!panels.has(beat.state.clause)) fail('unknown viewed clause');
		if (beat.state.box) {
			const panel = panels.get(beat.state.box.clause) ?? fail('unknown guidance box');
			if (beat.state.box.section && !panel.sections.some((section) => section.key === beat.state.box!.section)) fail('unknown open section');
		}
		const target = beat.cursor?.target;
		if (!target || target.kind === 'origin' || target.kind === 'approval') continue;
		const panel = panels.get(target.clause) ?? fail('unknown cursor clause');
		if (target.kind === 'clause') continue;
		if (target.clause !== beat.state.box?.clause) fail('cursor targets a closed guidance box');
		if (target.kind === 'section' && !panel.sections.some((section) => section.key === target.section)) fail('unknown cursor section');
		if (target.kind === 'concession' && !panel.sections.some((section) => section.key === beat.state.box?.section && section.concessions?.some((concession) => concession.id === target.concession))) fail('unknown or closed concession target');
	}
}

/** Sole owner of DOM measurement and geometry. Frame updates use cached coordinates. */
export function createSceneGeometry(elements: Elements, contract: PreparedContract, framing: 'hero' | 'feature', playback: {
	readonly step: AnimationStep; readonly resumeStep: AnimationStep; readonly elapsed: number; readonly reducedMotion: boolean;
	setReady(ready: boolean): void; setMotionEnd(end: number): void;
}, render: (mobile: boolean, cursor: CursorFrame) => void) {
	const { frame, stage, viewport, column, rail } = elements;
	let prepared: AnimationStep | undefined;
	let preparedReduced = false;
	let preparing: { step: AnimationStep; reduced: boolean } | undefined;
	let mobile = false;
	let scale = 1;
	let pixelRatio = 1;
	let height = 860;
	let width = 1440;
	let panelVisible = false;
	let target: TargetPoint | undefined;
	let values: Values = { scroll: 0, panelScroll: 0, paper: framing === 'hero' ? 232 : 0, opacity: 1, cursor: emptyCursor() };
	const capture = (): MotionValues => ({ scroll: values.scroll, panelScroll: values.panelScroll, paper: values.paper, opacity: values.opacity });
	let from = capture();
	let to = { scroll: 0, panelScroll: 0, paper: values.paper, opacity: 1 };
	let cursorFrom = { x: 0, y: 0 };
	let cursorOpacityFrom = 0;
	let panel: HTMLElement | null = null;
	let guidanceEntrance = false;
	let measurements: SceneMeasurements | undefined;
	let measurementKey = '';
	let cursorFromTarget: AnimationTarget | undefined;
	let fromScene: AnimationState | undefined;
	let version = 0;
	let destroyed = false;
	let queued = false;
	let saved: { step: AnimationStep; from: MotionValues; cursorFrom: { x: number; y: number }; cursorOpacityFrom: number; cursorFromTarget?: AnimationTarget; fromScene?: AnimationState } | undefined;

	function point(point: TargetPoint, offsets: MotionValues = values) {
		if (point.attachment === 'origin') return { x: mobile ? width * .65 : 650, y: mobile ? height * .75 : Math.min(height * .7, 600) };
		return { x: point.x + (point.attachment === 'document' ? offsets.paper : 0),
			y: point.y - offsets.scroll - (point.attachment === 'panel' ? offsets.panelScroll : 0) };
	}
	function apply(beat: AnimationStep, elapsed: number, reduced: boolean) {
		if (beat !== prepared || reduced !== preparedReduced) { playback.setReady(false); return; }
		const at = reduced ? beat.duration : elapsed;
		const cues = reduced ? {} : beat.motion ?? {};
		values.scroll = Math.round(mix(from.scroll, to.scroll, smooth(progress(at, cues.document))) * pixelRatio) / pixelRatio;
		values.panelScroll = Math.round(mix(from.panelScroll, to.panelScroll, easeOut(progress(at, cues.panel))) * pixelRatio) / pixelRatio;
		values.paper = mobile ? 0 : mix(from.paper, to.paper, easeInOut(progress(at, cues.paper)));
		values.opacity = mix(from.opacity, to.opacity, ease(progress(at, cues.opacity)));
		const entrance = guidanceEntrance ? cssEaseOut(progress(at, cues.guidance)) : 1;
		const entranceOffset = 4 * (1 - entrance);
		viewport.scrollTop = values.scroll;
		if (panel) panel.scrollTop = values.panelScroll;
		column.style.transform = `translateX(${values.paper}px)`;
		stage.style.opacity = String(values.opacity);
		rail.style.visibility = panelVisible ? 'visible' : 'hidden';
		rail.style.opacity = String(panelVisible ? entrance : 0);
		rail.style.transform = `translateY(${entranceOffset}px)`;
		if (target && beat.cursor && !reduced) {
			const destination = point(target);
			if (target.attachment === 'panel' || target.attachment === 'panel-frame') destination.y += entranceOffset;
			const travel = easeOut(progress(at, beat.cursor.move));
			const click = progress(at, beat.cursor.mode === 'clicking' ? motionTiming.click : 0);
			values.cursor = {
				x: mix(cursorFrom.x, destination.x, travel), y: mix(cursorFrom.y, destination.y, travel),
				opacity: mix(cursorOpacityFrom, 1, ease(progress(at, beat.cursor.fade))),
				ringOpacity: beat.cursor.mode === 'clicking' ? click < .28 ? cssEaseOut(click / .28) : 1 - cssEaseOut((click - .28) / .72) : 0,
				ringScale: mix(.45, 1.25, cssEaseOut(click)), scale
			};
		} else values.cursor = { ...values.cursor, opacity: reduced ? 0 : mix(cursorOpacityFrom, 0, ease(progress(at, cues.cursorOpacity))), ringOpacity: 0, scale };
		render(mobile, values.cursor);
	}

	function measureScene(): SceneMeasurements {
		const stageBounds = stage.getBoundingClientRect();
		const scroll = viewport.scrollTop;
		const local = (element: Element, firstLine = false): Bounds => {
			const bounds = firstLine ? element.getClientRects()[0] ?? element.getBoundingClientRect() : element.getBoundingClientRect();
			return { left: (bounds.left - stageBounds.left) / scale, right: (bounds.right - stageBounds.left) / scale,
				top: (bounds.top - stageBounds.top) / scale, bottom: (bounds.bottom - stageBounds.top) / scale };
		};
		const documentBounds = (node: Element, firstLine = false) => {
			const bounds = local(node, firstLine);
			return { left: bounds.left - values.paper, right: bounds.right - values.paper, top: bounds.top + scroll, bottom: bounds.bottom + scroll };
		};
		const center = (bounds: Bounds, attachment: TargetPoint['attachment']): TargetPoint => ({ x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2, attachment });
		const highlights = new Map<string, HTMLElement>(), revisionNodes = new Map<string, HTMLElement>();
		for (const node of stage.querySelectorAll<HTMLElement>('[data-highlight]')) {
			const id = node.dataset.highlight!;
			if (!highlights.has(id)) highlights.set(id, node);
			if (!revisionNodes.has(id) && (node.classList.contains('added') || node.classList.contains('removed'))) revisionNodes.set(id, node);
		}
		const clauses = new Map<string, Bounds>(), revisions = new Map<string, Bounds>();
		const targets = new Map<string, TargetPoint>(), panelBounds = new Map<string, Bounds>();
		for (const entry of contract.panels) {
			const node = highlights.get(entry.triggerId);
			if (node) { clauses.set(entry.id, documentBounds(node)); targets.set(`clause:${entry.id}`, center(documentBounds(node, true), 'document')); }
			const revision = revisionNodes.get(entry.triggerId);
			if (revision) revisions.set(entry.id, documentBounds(revision));
		}
		const actions = documentBounds(stage.querySelector('[data-contract-actions]')!);
		targets.set('approval', center(documentBounds(stage.querySelector('[data-animation-target="approval"]')!, true), 'document'));
		panel = stage.querySelector<HTMLElement>('[data-guidance-panel]');
		if (panel) {
			const bounds = local(panel), scroll = panel.scrollTop;
			const contentBounds = (node: Element, firstLine = false): Bounds => {
				const box = local(node, firstLine);
				return { left: box.left - bounds.left, right: box.right - bounds.left, top: box.top - bounds.top + scroll, bottom: box.bottom - bounds.top + scroll };
			};
			const add = (key: string, node: Element) => {
				panelBounds.set(key, contentBounds(node));
				const position = center(contentBounds(node, true), 'panel');
				targets.set(key, { ...position, x: position.x + (mobile ? 24 : 920) });
			};
			for (const node of panel.querySelectorAll<HTMLElement>('[data-section], [data-concession-id]')) add(node.dataset.section ? `section:${node.dataset.section}` : `concession:${node.dataset.concessionId}`, node);
			for (const node of panel.querySelectorAll<HTMLElement>('[data-section-body]')) panelBounds.set(`body:${node.dataset.sectionBody}`, contentBounds(node));
			return { clauses, revisions, targets, panelBounds, actions, panelScrollHeight: panel.scrollHeight, panelHeight: Math.max(panel.scrollHeight + 2, bounds.bottom - bounds.top) };
		}
		return { clauses, revisions, targets, panelBounds, actions, panelScrollHeight: 0, panelHeight: 0 };
	}

	async function prepare(beat: AnimationStep, reduced: boolean, resize = false) {
		const revision = ++version;
		playback.setReady(false);
		const changed = beat !== preparing?.step || reduced !== preparing?.reduced;
		const restoring = !reduced && Boolean(preparing?.reduced) && saved?.step === beat;
		if (changed) {
			if (reduced && !preparing?.reduced && prepared) {
				const normal = playback.resumeStep;
				const current = preparing?.step === normal;
				saved = { step: normal, from: current ? from : capture(), cursorFrom: current ? cursorFrom : { x: values.cursor.x, y: values.cursor.y },
					cursorOpacityFrom: current ? cursorOpacityFrom : values.cursor.opacity,
					cursorFromTarget: current ? cursorFromTarget : prepared.cursor?.target, fromScene: current ? fromScene : prepared.state };
			}
			if (restoring && saved) {
				from = saved.from; cursorFrom = saved.cursorFrom; cursorOpacityFrom = saved.cursorOpacityFrom;
				cursorFromTarget = saved.cursorFromTarget; fromScene = saved.fromScene;
			} else {
				from = capture();
				cursorFrom = { x: values.cursor.x, y: values.cursor.y };
				cursorOpacityFrom = values.cursor.opacity;
				cursorFromTarget = prepared?.cursor?.target;
				fromScene = prepared?.state;
			}
			preparing = { step: beat, reduced };
		}
		await tick();
		if (destroyed || revision !== version) return;
		mobile = window.matchMedia('(max-width: 639px)').matches;
		pixelRatio = window.devicePixelRatio || 1;
		const frameWidth = frame.clientWidth, frameHeight = frame.clientHeight;
		if (!frameWidth || !frameHeight) return;
		stage.style.width = `${mobile ? frameWidth : 1440}px`;
		render(mobile, values.cursor);
		await tick(); // Apply mobile paper widths before collecting any geometry.
		if (destroyed || revision !== version) return;
		const key = `${beat.state.contract}:${beat.state.box?.clause ?? beat.state.clause}:${beat.state.box?.section ?? ''}:${frameWidth}:${frameHeight}:${mobile}`;
		if (!measurements || resize || key !== measurementKey) {
			measurements = measureScene();
			measurementKey = key;
		}
		const { clauses, revisions, actions: actionBounds } = measurements;
		const viewedBounds = (beat.state.viewport === 'revision' ? revisions.get(beat.state.clause) : undefined) ?? clauses.get(beat.state.clause);
		const nextPanelTop = beat.state.box ? Math.max(0, clauses.get(beat.state.box.clause)?.top ?? 24) : 24;
		const resolve = (wanted: AnimationTarget): TargetPoint | undefined => {
			if (wanted.kind === 'origin') return { attachment: 'origin', x: 0, y: 0 };
			if (wanted.kind === 'panel') return { attachment: 'panel-frame', x: mobile ? frameWidth / 2 : 1140,
				y: nextPanelTop + (mobile ? 80 : 0) + Math.min(measurements!.panelHeight, height - (mobile ? 140 : 48)) / 2 };
			const key = wanted.kind === 'section' ? `section:${wanted.section}` : wanted.kind === 'concession' ? `concession:${wanted.concession}` : wanted.kind === 'clause' ? `clause:${wanted.clause}` : wanted.kind;
			const destination = measurements!.targets.get(key);
			return destination?.attachment === 'panel' ? { ...destination, y: destination.y + nextPanelTop + (mobile ? 80 : 0) } : destination;
		};
		const cursorTarget = beat.cursor?.target;
		let cropX = 0, cropWidth = mobile ? frameWidth : 1440;
		if (!mobile && framing === 'feature') {
			if (beat.state.viewport === 'actions') { cropWidth = (actionBounds.right - actionBounds.left + 48) / .729; cropX = (actionBounds.left + actionBounds.right - cropWidth) / 2; }
			else if (viewedBounds) { cropX = Math.min(viewedBounds.left, 920) - 24; cropWidth = Math.max(viewedBounds.right, 1360) - cropX + 24; }
		}
		width = frameWidth;
		scale = mobile ? 1 : frameWidth / cropWidth;
		height = frameHeight / scale;
		target = cursorTarget ? resolve(cursorTarget) : undefined;
		panelVisible = Boolean(beat.state.box) && !(mobile && beat.state.viewport === 'revision');
		guidanceEntrance = Boolean(beat.motion?.guidance);
		let panelScroll = values.panelScroll;
		if (panel && beat.state.box) {
			const section = beat.state.box.section;
			const body = measurements.panelBounds.get(`body:${section}`);
			const boxHeight = Math.min(measurements.panelHeight, height - (mobile ? 140 : 48));
			if (!section) panelScroll = 0;
			else if (body && beat.state.box.scroll === 'end' && cursorTarget?.kind === 'panel') panelScroll = body.bottom - boxHeight + 16;
			else if (body && cursorTarget?.kind === 'section' && cursorTarget.section === section && body.bottom - values.panelScroll > boxHeight - 16) panelScroll = measurements.panelBounds.get(`section:${section}`)!.top - 12;
			else if (cursorTarget) {
				const bounds = measurements.panelBounds.get(cursorTarget.kind === 'section' ? `section:${cursorTarget.section}` : cursorTarget.kind === 'concession' ? `concession:${cursorTarget.concession}` : cursorTarget.kind);
				if (bounds) {
					if (bounds.top - panelScroll < 14) panelScroll = bounds.top - 14;
					else if (bounds.bottom - panelScroll > boxHeight - 14) panelScroll = bounds.bottom - boxHeight + 14;
				}
			}
			panelScroll = clamp(panelScroll, measurements.panelScrollHeight - (boxHeight - 2));
		}
		const sceneScroll = (scene: AnimationState) => {
			const bounds = (scene.viewport === 'revision' ? revisions.get(scene.clause) : undefined) ?? clauses.get(scene.clause);
			return scene.viewport === 'top' ? 0 : scene.viewport === 'actions' ? actionBounds.bottom - height + 24 : bounds ? bounds.top - 24 : values.scroll;
		};
		if ((resize || restoring) && fromScene) {
			from.scroll = beat.motion?.document ? sceneScroll(fromScene) : sceneScroll(beat.state);
			if (beat.motion?.paper) from.paper = framing === 'hero' && !mobile && !fromScene.box ? 232 : 0;
		}
		to = {
			scroll: sceneScroll(beat.state),
			panelScroll, paper: framing === 'hero' && !mobile && !panelVisible ? 232 : 0, opacity: beat.state.opacity ?? 1
		};
		// Every read above precedes these layout writes; frames below perform no DOM reads.
		stage.style.width = `${mobile ? frameWidth : 1440}px`;
		stage.style.height = `${height}px`;
		stage.style.setProperty('--stage-height', `${height}px`);
		stage.style.transform = `translateX(${-cropX * scale}px) scale(${scale})`;
		rail.style.top = `${nextPanelTop + (mobile ? 80 : 0)}px`;
		await tick();
		if (destroyed || revision !== version) return;
		const maxScroll = viewport.scrollHeight - viewport.clientHeight;
		to.scroll = clamp(to.scroll, maxScroll);
		to.panelScroll = clamp(to.panelScroll, panel ? panel.scrollHeight - panel.clientHeight : 0);
		from.scroll = clamp(from.scroll, maxScroll);
		if ((resize || restoring) && cursorFromTarget) { const start = resolve(cursorFromTarget); if (start) cursorFrom = point(start, from); }
		if (!prepared || reduced) { from = { ...to }; cursorOpacityFrom = 0; }
		if (cursorTarget?.kind === 'origin' && (!prepared?.cursor || !values.cursor.opacity)) cursorFrom = point(target!);
		const cues = beat.motion ?? {};
		const moving = (start: number, end: number, duration = 0) => Math.abs(start - end) > .01 ? duration : 0;
		const destination = target ? point(target) : undefined;
		playback.setMotionEnd(reduced ? 0 : Math.max(
			moving(from.scroll, to.scroll, cues.document), moving(from.panelScroll, to.panelScroll, cues.panel),
			!mobile ? moving(from.paper, to.paper, cues.paper) : 0, moving(from.opacity, to.opacity, cues.opacity),
			panelVisible && guidanceEntrance ? cues.guidance ?? 0 : 0,
			destination && beat.cursor ? moving(0, Math.hypot(cursorFrom.x - destination.x, cursorFrom.y - destination.y), beat.cursor.move) : 0,
			moving(cursorOpacityFrom, beat.cursor ? 1 : 0, beat.cursor?.fade ?? cues.cursorOpacity),
			beat.cursor?.mode === 'clicking' ? motionTiming.click : 0
		));
		prepared = beat;
		preparedReduced = reduced;
		apply(beat, playback.elapsed, reduced);
		playback.setReady(true);
	}
	function remeasure() {
		if (queued || destroyed) return;
		queued = true;
		playback.setReady(false);
		void tick().then(() => { queued = false; if (!destroyed) void prepare(playback.step, playback.reducedMotion, true); });
	}
	const observer = new ResizeObserver(remeasure);
	observer.observe(frame);
	window.addEventListener('resize', remeasure);
	document.fonts?.addEventListener('loadingdone', remeasure);
	return { prepare, apply, destroy() {
		destroyed = true; version++;
		observer.disconnect();
		window.removeEventListener('resize', remeasure);
		document.fonts?.removeEventListener('loadingdone', remeasure);
	} };
}
