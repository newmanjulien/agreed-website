/** Coalesce camera observations; writing dimensions inside ResizeObserver can loop in WebKit. */
export function observeCameraSize(element: HTMLElement, publish: (width: number, height: number) => void) {
	let frame: number | undefined;
	const schedule = () => {
		if (frame !== undefined) return;
		frame = requestAnimationFrame(() => {
			frame = undefined;
			publish(element.clientWidth, element.clientHeight);
		});
	};
	const observer = new ResizeObserver(schedule);
	observer.observe(element);
	schedule();
	return { destroy() { observer.disconnect(); if (frame !== undefined) cancelAnimationFrame(frame); } };
}
