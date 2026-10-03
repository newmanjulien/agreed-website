import type { SourcePoint, SourceRange } from '$lib/components/contract-demo/contract/source-model';
import type { SourceIndex } from '$lib/components/contract-demo/contract/source-index';
import type { ResolvedRun } from '$lib/components/contract-demo/contract/model';
import {
	matchAnnotationOccurrence,
	ranksBefore,
	type AnnotationTokenCoordinates,
	type AnnotationOccurrence
} from './annotation-occurrence';

export type { AnnotationOccurrence } from './annotation-occurrence';

export interface AnnotationActivation {
	owner: HTMLElement;
	clientX?: number;
	clientY?: number;
}

function tokenCoordinates(token: HTMLElement): AnnotationTokenCoordinates | undefined {
	const visualSource: SourceRange | undefined = token.dataset.visualSource
		? JSON.parse(token.dataset.visualSource)
		: undefined;
	const point =
		visualSource?.start ??
		(token.dataset.sourceStartKey
			? {
					sourceKey: token.dataset.sourceStartKey,
					offset: Number(token.dataset.sourceStartOffset)
				}
			: undefined);
	return point
		? {
				source: visualSource ?? {
					start: point,
					end: { sourceKey: token.dataset.sourceEndKey!, offset: Number(token.dataset.sourceEndOffset) }
				},
				visualSource,
				generated: token.dataset.generated as ResolvedRun['generated'],
				generatedOffset: visualSource ? Number(token.dataset.generatedOffset ?? 0) : undefined,
				sourceKind: token.dataset.sourceKind as ResolvedRun['sourceKind'],
				length: token.textContent?.length ?? 0,
				pageNumber: pageNumber(token)
			}
		: undefined;
}

function pageNumber(element: HTMLElement) {
	return Number(element.closest<HTMLElement>('[data-page-number]')?.dataset.pageNumber ?? 0);
}

export function annotationMemberships(element: HTMLElement): string[] {
	return JSON.parse(element.dataset.annotationMemberships ?? '[]');
}

/** Capture text coordinates, never the segment's ordinal or page-local row index. */
export function annotationOccurrence(
	annotationId: string,
	activation: AnnotationActivation
): AnnotationOccurrence | null {
	const { owner, clientX, clientY } = activation;
	const scratchRange = owner.ownerDocument.createRange();
	const distance = (token: HTMLElement) => {
		if (clientX === undefined || clientY === undefined) return 0;
		const range = scratchRange;
		range.selectNodeContents(token);
		let nearest = Infinity;
		for (const bounds of range.getClientRects())
			nearest = Math.min(
				nearest,
				Math.hypot(
					Math.max(bounds.left - clientX, 0, clientX - bounds.right),
					Math.max(bounds.top - clientY, 0, clientY - bounds.bottom)
				)
			);
		return nearest;
	};
	let token: HTMLElement | undefined;
	let nearest = Infinity;
	for (const candidate of owner.querySelectorAll<HTMLElement>(
		'[data-source-start-key], [data-visual-source]'
	)) {
		const measured = distance(candidate);
		if (!token || measured < nearest) {
			token = candidate;
			nearest = measured;
		}
	}
	if (!token) return null;
	const coordinates = tokenCoordinates(token);
	if (!coordinates) return null;
	// Preserve the character within a long run as well as its token after repagination.
	const caretDocument = owner.ownerDocument as Document & {
		caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
		caretRangeFromPoint?: (x: number, y: number) => Range | null;
	};
	let offset = 0;
	if (clientX !== undefined && clientY !== undefined) {
		const position = caretDocument.caretPositionFromPoint?.(clientX, clientY);
		const range = position ? null : caretDocument.caretRangeFromPoint?.(clientX, clientY);
		const node = position?.offsetNode ?? range?.startContainer;
		if (node?.nodeType === Node.TEXT_NODE && token.contains(node))
			offset = Math.min(
				position?.offset ?? range?.startOffset ?? 0,
				Math.max(0, (token.textContent?.length ?? 0) - 1)
			);
	}
	const { source, visualSource, generated, generatedOffset, sourceKind } = coordinates;
	return {
		annotationId,
		point: { ...source.start, offset: source.start.offset + (!visualSource && sourceKind === 'text' ? offset : 0) },
		visualSource,
		generated,
		generatedOffset: visualSource ? (generatedOffset ?? 0) + offset : undefined,
		pageNumber: coordinates.pageNumber
	};
}

export interface AnnotationAnchor {
	owner: HTMLElement;
	token: HTMLElement;
	characterOffset: number;
}

/** A character range keeps a wrapped token anchored to the selected line. */
export function annotationAnchorBounds(anchor: AnnotationAnchor): DOMRect {
	const { token, characterOffset } = anchor;
	const text = token.firstChild;
	if (text?.nodeType === Node.TEXT_NODE && text.textContent?.length) {
		const offset = Math.max(0, Math.min(characterOffset, text.textContent.length - 1));
		const range = token.ownerDocument.createRange();
		range.setStart(text, offset);
		range.setEnd(text, offset + 1);
		const bounds = range.getClientRects()[0];
		if (bounds?.height) return bounds;
	}
	return token.getBoundingClientRect();
}

/** Positioning and focus share membership-aware occurrence resolution. */
export function resolveAnnotationAnchor(
	root: HTMLElement,
	index: SourceIndex,
	annotationId: string | null,
	preference: AnnotationOccurrence | null,
	fallbackPoint?: SourcePoint
): AnnotationAnchor | undefined {
	if (!annotationId) return;
	let best: (AnnotationAnchor & { rank: number[] }) | undefined;
	for (const owner of root.querySelectorAll<HTMLElement>('[data-annotation-memberships]')) {
		if (!annotationMemberships(owner).includes(annotationId)) continue;
		for (const token of owner.querySelectorAll<HTMLElement>(
			'[data-source-start-key], [data-visual-source]'
		)) {
			const coordinates = tokenCoordinates(token);
			if (!coordinates) continue;
			const { rank, characterOffset } = matchAnnotationOccurrence(index, coordinates, preference, fallbackPoint);
			if (!best || ranksBefore(rank, best.rank)) {
				best = { owner, token, characterOffset, rank };
			}
		}
	}
	return best;
}
