import type { GuidedTourStep } from './tour-model';

const START_RATIO = 0.4;
const KEEP_RATIO = 0.2;
const STEAL_DELTA = 0.2;
const RATIO_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];

interface TourSession {
	getRatio: () => number;
	isFinished: () => boolean;
	setActive: (active: boolean) => void;
}

const sessions = new Set<TourSession>();
let elected: TourSession | undefined;

function elect() {
	const incumbent =
		elected &&
		sessions.has(elected) &&
		!elected.isFinished() &&
		elected.getRatio() >= KEEP_RATIO
			? elected
			: undefined;

	let best: TourSession | undefined;
	let bestRatio = 0;
	for (const session of sessions) {
		if (session.isFinished()) continue;
		const ratio = session.getRatio();
		if (ratio >= START_RATIO && ratio > bestRatio) {
			best = session;
			bestRatio = ratio;
		}
	}

	let next = incumbent;
	if (!incumbent) {
		next = best;
	} else if (best && best !== incumbent && bestRatio >= incumbent.getRatio() + STEAL_DELTA) {
		next = best;
	}

	elected = next;
	for (const session of sessions) session.setActive(session === elected);
}

export function createGuidedTour<Step extends GuidedTourStep>(steps: ReadonlyArray<Step>) {
	if (steps.length === 0) throw new Error('A guided tour requires at least one step.');
	const firstStep = steps[0]!;
	const completedStep = steps.at(-1)!;
	const lastIndex = steps.length - 1;

	let step = $state<Step>(firstStep);
	let progress = $state(0);
	let stopPlayback: (() => void) | undefined;

	function start(element: Element | undefined): () => void {
		stopPlayback?.();
		step = firstStep;
		progress = 0;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			step = completedStep;
			progress = 1;
			return () => {};
		}

		let index = 0;
		let remaining = firstStep.duration;
		let startedAt = 0;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		let progressFrame: number | undefined;
		let ratio = 0;
		let active = false;
		let finished = false;

		function isPlayable() {
			return active && !finished && document.visibilityState === 'visible';
		}

		function stopProgress() {
			if (progressFrame !== undefined) cancelAnimationFrame(progressFrame);
			progressFrame = undefined;
		}

		function updateProgress() {
			const activeStep = steps[index];
			if (!activeStep?.trackProgress || timeout === undefined) return;
			const elapsed = activeStep.duration - remaining + performance.now() - startedAt;
			progress = Math.min(1, elapsed / activeStep.duration);
			progressFrame = requestAnimationFrame(updateProgress);
		}

		function pause() {
			if (timeout === undefined) return;
			clearTimeout(timeout);
			timeout = undefined;
			remaining = Math.max(0, remaining - (performance.now() - startedAt));
			stopProgress();
			const activeStep = steps[index];
			if (activeStep?.trackProgress) progress = 1 - remaining / activeStep.duration;
		}

		function rewind() {
			pause();
			finished = false;
			index = 0;
			step = firstStep;
			progress = 0;
			remaining = firstStep.duration;
		}

		function schedule() {
			if (!isPlayable() || timeout !== undefined) return;
			startedAt = performance.now();
			timeout = setTimeout(() => {
				timeout = undefined;
				stopProgress();
				if (index >= lastIndex) {
					finished = true;
					if (step.trackProgress) progress = 1;
					elect();
					return;
				}
				index += 1;
				step = steps[index]!;
				progress = 0;
				remaining = step.duration;
				schedule();
			}, remaining);
			if (step.trackProgress) progressFrame = requestAnimationFrame(updateProgress);
		}

		function updatePlayback() {
			if (isPlayable()) schedule();
			else pause();
		}

		const session: TourSession = {
			getRatio: () => ratio,
			isFinished: () => finished,
			setActive: (next) => {
				if (active === next) return;
				active = next;
				updatePlayback();
			}
		};

		function onIntersect(entries: IntersectionObserverEntry[]) {
			ratio = entries.at(-1)?.intersectionRatio ?? 0;
			if (ratio === 0) rewind();
			elect();
		}

		sessions.add(session);

		const observer = new IntersectionObserver(onIntersect, { threshold: RATIO_THRESHOLDS });
		if (element) observer.observe(element);
		document.addEventListener('visibilitychange', updatePlayback);

		stopPlayback = () => {
			sessions.delete(session);
			if (elected === session) elected = undefined;
			observer.disconnect();
			document.removeEventListener('visibilitychange', updatePlayback);
			if (timeout !== undefined) clearTimeout(timeout);
			stopProgress();
			timeout = undefined;
			stopPlayback = undefined;
			elect();
		};

		return stopPlayback;
	}

	return {
		get step() {
			return step;
		},
		get progress() {
			return progress;
		},
		start
	};
}
