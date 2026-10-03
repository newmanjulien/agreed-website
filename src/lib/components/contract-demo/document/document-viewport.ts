import { getContext, setContext } from 'svelte';

const VIEWPORT = Symbol('oceans-demo-viewport');

/** CSS-pixel scale of the virtual app stage, independent of document page scaling. */
export function stageScale(element: Element): number {
	const stage = element.closest<HTMLElement>('[data-demo-stage]');
	return stage?.offsetWidth ? stage.getBoundingClientRect().width / stage.offsetWidth : 1;
}

export function setDocumentViewport(element: () => HTMLElement | undefined) {
	const viewport = {
		get element() { return element(); },
		get scrollTop() { return element()?.scrollTop ?? 0; },
		toLocalPixels(distance: number) {
			const root = element();
			return root ? distance / stageScale(root) : distance;
		},
		metrics() {
			const root = element();
			if (!root) return { top: 0, bottom: 0, gap: 0 };
			const bounds = root.getBoundingClientRect();
			const gap = (parseFloat(getComputedStyle(root).getPropertyValue('--document-viewport-gap')) || 16) * stageScale(root);
			return { top: bounds.top + gap, bottom: bounds.bottom, gap };
		},
		scrollBy(distance: number) {
			element()?.scrollBy({ top: viewport.toLocalPixels(distance), behavior: 'instant' });
		}
	};
	return setContext(VIEWPORT, viewport);
}

export function getDocumentViewport(): ReturnType<typeof setDocumentViewport> {
	const viewport = getContext<ReturnType<typeof setDocumentViewport>>(VIEWPORT);
	if (!viewport) throw new Error('Embedded document viewport is required.');
	return viewport;
}
