import type { GuidedTourStep } from './tour-model';

const START_RATIO = 0.4;
const KEEP_RATIO = 0.2;
const STEAL_DELTA = 0.2;
const RATIO_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];

interface TourSession {
	getRatio: () => number;
	isReady: () => boolean;
	isFinished: () => boolean;
	setActive: (active: boolean) => void;
}

const sessions = new Set<TourSession>();
let elected: TourSession | undefined;

function elect() {
	const incumbent =
		elected &&
		sessions.has(elected) &&
		elected.isReady() &&
		!elected.isFinished() &&
		elected.getRatio() >= KEEP_RATIO
			? elected
			: undefined;

	let best: TourSession | undefined;
	let bestRatio = 0;
	for (const session of sessions) {
		if (!session.isReady() || session.isFinished()) continue;
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
	let ready = true;
	let stopPlayback: (() => void) | undefined;

	function reset() {
		stopPlayback?.();
		step = firstStep;
	}

	function setReady(next: boolean) {
		if (ready === next) return;
		ready = next;
		elect();
	}

	function start(element: HTMLElement): () => void {
		reset();

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			step = completedStep;
			return () => {};
		}

		let index = 0;
		let remaining = firstStep.duration;
		let startedAt = 0;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		let ratio = 0;
		let active = false;
		let finished = false;
		const pausedAnimations = new Set<Animation>();

		function pauseAnimations() {
			for (const animation of element.getAnimations({ subtree: true })) {
				if (animation.playState !== 'running') continue;
				animation.pause();
				pausedAnimations.add(animation);
			}
		}

		function resumeAnimations() {
			for (const animation of pausedAnimations) {
				if (animation.playState === 'paused') animation.play();
			}
			pausedAnimations.clear();
		}

		function isPlayable() {
			return ready && active && !finished && document.visibilityState === 'visible';
		}

		function pause() {
			if (!finished) pauseAnimations();
			if (timeout === undefined) return;
			clearTimeout(timeout);
			timeout = undefined;
			remaining = Math.max(0, remaining - (performance.now() - startedAt));
		}

		function schedule() {
			if (!isPlayable() || timeout !== undefined) return;
			resumeAnimations();
			startedAt = performance.now();
			timeout = setTimeout(() => {
				timeout = undefined;
				if (index >= lastIndex) {
					finished = true;
					elect();
					return;
				}
				index += 1;
				step = steps[index]!;
				remaining = step.duration;
				schedule();
			}, remaining);
		}

		function updatePlayback() {
			if (isPlayable()) schedule();
			else pause();
		}

		const session: TourSession = {
			getRatio: () => ratio,
			isReady: () => ready,
			isFinished: () => finished,
			setActive: (next) => {
				if (active === next) return;
				active = next;
				updatePlayback();
			}
		};

		function onIntersect(entries: IntersectionObserverEntry[]) {
			ratio = entries.at(-1)?.intersectionRatio ?? 0;
			elect();
		}

		sessions.add(session);

		const observer = new IntersectionObserver(onIntersect, { threshold: RATIO_THRESHOLDS });
		observer.observe(element);
		// CSS transitions can be created by a resize or DOM update while paused.
		const mutations = new MutationObserver(() => {
			if (!isPlayable() && !finished) pauseAnimations();
		});
		mutations.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
		document.addEventListener('visibilitychange', updatePlayback);

		stopPlayback = () => {
			sessions.delete(session);
			if (elected === session) elected = undefined;
			observer.disconnect();
			mutations.disconnect();
			document.removeEventListener('visibilitychange', updatePlayback);
			if (timeout !== undefined) clearTimeout(timeout);
			timeout = undefined;
			resumeAnimations();
			stopPlayback = undefined;
			elect();
		};

		return stopPlayback;
	}

	return {
		get step() {
			return step;
		},
		start,
		setReady,
		reset
	};
}
