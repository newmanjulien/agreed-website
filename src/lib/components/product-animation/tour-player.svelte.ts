import { motionDuration, type GuidedTourStep } from './tour-model.ts';

const START_RATIO = 0.4;
const KEEP_RATIO = 0.2;
const STEAL_DELTA = 0.2;
const RATIO_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];
interface TourSession {
	getRatio(): number;
	isReady(): boolean;
	isFinished(): boolean;
	setActive(active: boolean): void;
}
const sessions = new Set<TourSession>();
let elected: TourSession | undefined;
function elect() {
	const incumbent = elected && sessions.has(elected) && elected.isReady() && !elected.isFinished() && elected.getRatio() >= KEEP_RATIO ? elected : undefined;
	let best: TourSession | undefined;
	for (const session of sessions) {
		if (session.isReady() && !session.isFinished() && session.getRatio() >= START_RATIO &&
			(!best || session.getRatio() > best.getRatio())) best = session;
	}
	elected = !incumbent ? best : best && best !== incumbent && best.getRatio() >= incumbent.getRatio() + STEAL_DELTA ? best : incumbent;
	for (const session of sessions) session.setActive(session === elected);
}

/** One logical clock drives both scene changes and every visual cue. */
export function createGuidedTour<Step extends GuidedTourStep>(steps: readonly Step[], options: { loop?: boolean; completedStep?: Step } = {}) {
	if (!steps.length) throw new Error('A guided tour requires at least one step.');
	const completed = options.completedStep ?? steps.at(-1)!;
	let step = $state.raw<Step>(steps[0]!);
	let elapsed = $state(0);
	let running = $state(false);
	let reducedMotion = $state(false);
	let ready = true;
	let hasPrepared = false;
	let index = 0;
	let finished = false;
	let measuredMotionEnd: number | undefined;
	let stopPlayback: (() => void) | undefined;
	let updatePlayback = () => {};
	const listeners = new Set<(step: Step, elapsed: number, reduced: boolean) => void>();
	const publish = () => { for (const listener of listeners) listener(step, elapsed, reducedMotion); };
	function setReady(next: boolean) {
		if (ready === next) return;
		ready = next;
		if (next) hasPrepared = true;
		updatePlayback();
		elect();
	}
	function reset() {
		stopPlayback?.();
		index = 0;
		hasPrepared = ready;
		measuredMotionEnd = undefined;
		finished = false;
		elapsed = 0;
		reducedMotion = false;
		step = steps[0]!;
		publish();
	}
	function start(element: HTMLElement) {
		reset();
		let active = false;
		let ratio = 0;
		let startedAt = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let frame: number | undefined;
		let observer: IntersectionObserver | undefined;
		let savedElapsed = 0;
		const fallbackVisibility = typeof IntersectionObserver === 'undefined';
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		function cancel() {
			if (timer !== undefined) clearTimeout(timer);
			if (frame !== undefined) cancelAnimationFrame(frame);
			timer = undefined;
			frame = undefined;
		}
		function pause() {
			if (running) elapsed = Math.min(step.duration, elapsed + performance.now() - startedAt);
			running = false;
			cancel();
			publish();
		}
		function playable() { return ready && active && !finished && !reducedMotion && document.visibilityState === 'visible'; }
		function schedule() {
			if (!playable() || timer !== undefined || frame !== undefined) return;
			if (!running) { running = true; startedAt = performance.now(); }
			const motionEnd = Math.min(step.duration, measuredMotionEnd ?? motionDuration(step));
			const moving = elapsed < motionEnd;
			if (moving) frame = requestAnimationFrame(advance);
			timer = setTimeout(advance, Math.max(0, (moving ? motionEnd : step.duration) - elapsed));
		}
		function advance() {
			const now = performance.now();
			cancel();
			elapsed = Math.min(step.duration, elapsed + now - startedAt);
			startedAt = now;
			publish(); // Settle the outgoing scene, including motions shorter than a frame.
			if (!playable()) { running = false; return; }
			if (elapsed >= step.duration) {
				if (index === steps.length - 1 && !options.loop) {
					finished = true;
					running = false;
					elect();
					return;
				}
				measuredMotionEnd = undefined;
				index = (index + 1) % steps.length;
				elapsed = 0;
				step = steps[index]!;
				publish();
			}
			schedule();
		}
		updatePlayback = () => { if (playable()) schedule(); else pause(); };
		const session: TourSession = {
			getRatio: () => ratio,
			isReady: () => (ready || hasPrepared) && !reducedMotion,
			isFinished: () => finished,
			setActive(next) { if (active !== next) { active = next; updatePlayback(); } }
		};
		function updatePreference() {
			if (reducedMotion === preference.matches) return;
			pause();
			reducedMotion = preference.matches;
			if (reducedMotion) { savedElapsed = elapsed; step = completed; elapsed = completed.duration; }
			else { step = steps[index]!; elapsed = savedElapsed; }
			publish();
			elect();
			updatePlayback();
		}
		function attainableFraction() {
			const bounds = element.getBoundingClientRect();
			const width = window.innerWidth, height = window.innerHeight;
			return bounds.width && bounds.height ? Math.min(bounds.width, width) * Math.min(bounds.height, height) / (bounds.width * bounds.height) : 1;
		}
		function intersect(entries: IntersectionObserverEntry[]) {
			const entry = entries.at(-1);
			if (!entry) return;
			const bounds = entry.boundingClientRect;
			const intersection = entry.intersectionRect;
			const root = entry.rootBounds;
			const attainable = Math.min(bounds.width, root?.width ?? window.innerWidth) * Math.min(bounds.height, root?.height ?? window.innerHeight);
			ratio = attainable > 0 ? Math.min(1, intersection.width * intersection.height / attainable) : 0;
			elect();
		}
		function measureVisibility() {
			const bounds = element.getBoundingClientRect();
			const width = window.innerWidth, height = window.innerHeight;
			const visibleWidth = Math.max(0, Math.min(bounds.right, width) - Math.max(0, bounds.left));
			const visibleHeight = Math.max(0, Math.min(bounds.bottom, height) - Math.max(0, bounds.top));
			const attainable = Math.min(bounds.width, width) * Math.min(bounds.height, height);
			ratio = attainable > 0 ? Math.min(1, visibleWidth * visibleHeight / attainable) : 0;
			elect();
		}
		function observe() {
			observer?.disconnect();
			if (fallbackVisibility) { measureVisibility(); return; }
			const attainable = attainableFraction();
			observer = new IntersectionObserver(intersect, { threshold: [...new Set([...RATIO_THRESHOLDS.map((value) => value * attainable), 1])] });
			observer.observe(element);
		}
		sessions.add(session);
		updatePreference();
		preference.addEventListener('change', updatePreference);
		document.addEventListener('visibilitychange', updatePlayback);
		window.addEventListener('resize', observe);
		if (fallbackVisibility) window.addEventListener('scroll', measureVisibility, { passive: true });
		const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(observe);
		resize?.observe(element);
		observe();
		stopPlayback = () => {
			pause();
			sessions.delete(session);
			if (elected === session) elected = undefined;
			observer?.disconnect();
			resize?.disconnect();
			preference.removeEventListener('change', updatePreference);
			document.removeEventListener('visibilitychange', updatePlayback);
			window.removeEventListener('resize', observe);
			if (fallbackVisibility) window.removeEventListener('scroll', measureVisibility);
			stopPlayback = undefined;
			updatePlayback = () => {};
			elect();
		};
		return stopPlayback;
	}
	return {
		get step() { return step; },
		get elapsed() { return elapsed; },
		get resumeStep() { return steps[index]!; },
		get running() { return running; },
		get reducedMotion() { return reducedMotion; },
		start, reset, setReady,
		setMotionEnd(end: number) { measuredMotionEnd = end; },
		onFrame(listener: (step: Step, elapsed: number, reduced: boolean) => void) {
			listeners.add(listener);
			listener(step, elapsed, reducedMotion);
			return () => { listeners.delete(listener); };
		}
	};
}
