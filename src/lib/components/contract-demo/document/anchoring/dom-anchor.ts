import type { SourcePoint } from '../../contract/source-model';

/** Locate a source point again after panel layout or pagination changes. */
export function sourcePointBounds(
	root: HTMLElement,
	point: SourcePoint,
	includeRemoved = false,
	preferredPage?: number
): DOMRect | null {
	const spans = Array.from(
		root.querySelectorAll<HTMLElement>(`[data-source-start-key="${CSS.escape(point.sourceKey)}"]`)
	);
	spans.sort((a, b) => {
		// Prefer the next token at a boundary; retain end carets as a fallback.
		const atEnd = (span: HTMLElement) => Number(
			point.offset === Number(span.dataset.sourceEndOffset) &&
			Number(span.dataset.sourceStartOffset) !== Number(span.dataset.sourceEndOffset)
		);
		const boundary = atEnd(a) - atEnd(b);
		if (boundary || preferredPage === undefined) return boundary;
		const distance = (span: HTMLElement) => Math.abs(
			Number(span.closest<HTMLElement>('.document-page')?.dataset.pageNumber) - preferredPage
		);
		return distance(a) - distance(b);
	});
	for (const span of spans) {
		const from = Number(span.dataset.sourceStartOffset),
			to = Number(span.dataset.sourceEndOffset);
		if (
			span.dataset.sourceStartKey !== point.sourceKey ||
			(span.dataset.revision && !(includeRemoved && span.dataset.revision === 'removed')) ||
			point.offset < from ||
			point.offset > to
		)
			continue;
		const text = span.firstChild;
		if (span.dataset.sourceKind === 'text' && text?.nodeType === Node.TEXT_NODE) {
			const caret = root.ownerDocument.createRange();
			caret.setStart(text, Math.min(point.offset - from, text.textContent?.length ?? 0));
			caret.collapse(true);
			const bounds = caret.getClientRects()[0];
			if (bounds?.height) return bounds;
		}
		const bounds = span.getBoundingClientRect();
		if (bounds.height) return bounds;
	}
	return null;
}
