import type { GuidedTourStep } from './tour-model';

export function createGuidedTour<Step extends GuidedTourStep>(steps: ReadonlyArray<Step>) {
	if (steps.length === 0) throw new Error('A guided tour requires at least one step.');
	const firstStep = steps[0]!;
	const completedStep = steps.at(-1)!;

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
		let onscreen = false;

		function isPlayable() {
			return onscreen && document.visibilityState === 'visible';
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

		function schedule() {
			if (!isPlayable() || timeout !== undefined) return;
			startedAt = performance.now();
			timeout = setTimeout(() => {
				timeout = undefined;
				stopProgress();
				index = (index + 1) % steps.length;
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

		const observer = new IntersectionObserver(
			(entries) => {
				onscreen = entries.at(-1)?.isIntersecting ?? false;
				updatePlayback();
			},
			{ threshold: 0 }
		);

		if (element) observer.observe(element);
		document.addEventListener('visibilitychange', updatePlayback);

		stopPlayback = () => {
			observer.disconnect();
			document.removeEventListener('visibilitychange', updatePlayback);
			if (timeout !== undefined) clearTimeout(timeout);
			stopProgress();
			timeout = undefined;
			stopPlayback = undefined;
		};

		return stopPlayback;
	}

	return {
		get step() { return step; },
		get progress() { return progress; },
		start
	};
}
