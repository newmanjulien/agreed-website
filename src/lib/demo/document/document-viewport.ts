const DEFAULT_VIEWPORT_GAP = 16;

function cssPixelValue(styles: CSSStyleDeclaration, property: string, fallback: number) {
	const value = Number.parseFloat(styles.getPropertyValue(property));
	return Number.isFinite(value) ? value : fallback;
}

export function getDocumentViewportMetrics(viewport: HTMLElement) {
	const styles = getComputedStyle(viewport);
	const bounds = viewport.getBoundingClientRect();
	const gap = cssPixelValue(styles, '--document-viewport-gap', DEFAULT_VIEWPORT_GAP);
	return {
		top: bounds.top + gap,
		bottom: bounds.bottom - gap,
		gap
	};
}
