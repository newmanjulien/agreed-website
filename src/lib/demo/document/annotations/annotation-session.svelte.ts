import {
	clearCustomHighlights,
	createCustomHighlightOwner,
	setCustomHighlight,
	type CustomHighlightOwner
} from '../custom-highlights';
import { resolveTextAnchor } from './text-anchor';
import type {
	AnnotationComposerState,
	AnnotationKind,
	DocumentAnnotation,
	TextAnchor
} from './types';
import { createDiscussionMessageId } from '../discussions/types';

const COMMENT_HIGHLIGHT = 'agreed-annotation-comment';
const CHANGE_HIGHLIGHT = 'agreed-annotation-change';

function clearHighlights(owner: CustomHighlightOwner) {
	clearCustomHighlights(owner, COMMENT_HIGHLIGHT, CHANGE_HIGHLIGHT);
}

function rangeContainsPoint(range: Range, clientX: number, clientY: number): boolean {
	return Array.from(range.getClientRects()).some(
		(rectangle) =>
			clientX >= rectangle.left &&
			clientX <= rectangle.right &&
			clientY >= rectangle.top &&
			clientY <= rectangle.bottom
	);
}

function rangesContainPoint(ranges: Range[], clientX: number, clientY: number): boolean {
	return ranges.some((range) => rangeContainsPoint(range, clientX, clientY));
}

function anchorLength(anchor: TextAnchor): number {
	return anchor.segments.reduce(
		(length, segment) => length + segment.end - segment.start,
		0
	);
}

function renderHighlights(
	owner: CustomHighlightOwner,
	annotations: ReadonlyArray<{
		annotation: AnnotationComposerState | DocumentAnnotation;
		ranges: Range[];
	}>
) {
	clearHighlights(owner);
	const commentRanges = annotations
		.filter(({ annotation }) => annotation.kind === 'comment')
		.flatMap(({ ranges }) => ranges);
	const changeRanges = annotations
		.filter(({ annotation }) => annotation.kind === 'change')
		.flatMap(({ ranges }) => ranges);

	setCustomHighlight(owner, COMMENT_HIGHLIGHT, commentRanges, 2);
	setCustomHighlight(owner, CHANGE_HIGHLIGHT, changeRanges, 2);
}

export class AnnotationSession {
	annotations = $state<DocumentAnnotation[]>([]);
	composer = $state<AnnotationComposerState | null>(null);
	resolvedAnnotations = $state<Array<{ annotation: DocumentAnnotation; ranges: Range[] }>>([]);
	creationRanges = $state<Range[]>([]);

	#target: HTMLElement | undefined;
	#observer: MutationObserver | undefined;
	#refreshQueued = false;
	#highlightOwner = createCustomHighlightOwner();

	setTarget(target: HTMLElement | undefined) {
		if (target === this.#target) return;
		this.#observer?.disconnect();
		this.#observer = undefined;
		this.#target = target;
		this.refresh();

		if (!target || typeof MutationObserver === 'undefined') return;
		this.#observer = new MutationObserver(() => this.#scheduleRefresh());
		this.#observer.observe(target, { childList: true, characterData: true, subtree: true });
	}

	startAnnotationCreation(kind: AnnotationKind, anchor: TextAnchor) {
		this.composer = { kind, anchor, text: '' };
		this.refresh();
	}

	updateComposerText(text: string) {
		if (!this.composer) return;
		this.composer.text = text;
	}

	cancelComposer(): boolean {
		if (!this.composer) return false;
		this.composer = null;
		this.creationRanges = [];
		this.#renderHighlights();
		return true;
	}

	deleteAnnotation(id: string): boolean {
		const annotationIndex = this.annotations.findIndex((annotation) => annotation.id === id);
		if (annotationIndex === -1) return false;

		this.annotations.splice(annotationIndex, 1);
		this.refresh();
		return true;
	}

	editAnnotation(id: string, text: string): boolean {
		const annotation = this.annotations.find((candidate) => candidate.id === id);
		const nextText = text.trim();
		if (!annotation || !nextText) return false;
		annotation.text = nextText;
		return true;
	}

	addReply(id: string, text: string): boolean {
		const annotation = this.annotations.find((candidate) => candidate.id === id);
		const replyText = text.trim();
		if (!annotation || !replyText) return false;
		annotation.replies.push({
			id: createDiscussionMessageId('reply'),
			text: replyText
		});
		return true;
	}

	editReply(annotationId: string, replyId: string, text: string): boolean {
		const annotation = this.annotations.find((candidate) => candidate.id === annotationId);
		const reply = annotation?.replies.find((candidate) => candidate.id === replyId);
		const nextText = text.trim();
		if (!reply || !nextText) return false;
		reply.text = nextText;
		return true;
	}

	deleteReply(annotationId: string, replyId: string): boolean {
		const annotation = this.annotations.find((candidate) => candidate.id === annotationId);
		if (!annotation) return false;
		const replyIndex = annotation.replies.findIndex((reply) => reply.id === replyId);
		if (replyIndex === -1) return false;
		annotation.replies.splice(replyIndex, 1);
		return true;
	}

	annotationIdAtPoint(clientX: number, clientY: number): string | undefined {
		let bestMatch: { id: string; length: number } | undefined;

		for (let index = this.resolvedAnnotations.length - 1; index >= 0; index -= 1) {
			const { annotation, ranges } = this.resolvedAnnotations[index];
			if (!rangesContainPoint(ranges, clientX, clientY)) continue;

			const length = anchorLength(annotation.anchor);
			if (!bestMatch || length < bestMatch.length) {
				bestMatch = { id: annotation.id, length };
			}
		}

		return bestMatch?.id;
	}

	submitComposer(): boolean {
		const composer = this.composer;
		const text = composer?.text.trim();
		if (!composer || !text) return false;

		this.annotations.push({
			id: createDiscussionMessageId('annotation'),
			kind: composer.kind,
			anchor: composer.anchor,
			text,
			replies: []
		});
		this.composer = null;
		this.creationRanges = [];
		this.refresh();
		return true;
	}

	refresh() {
		const target = this.#target;
		if (!target) {
			this.resolvedAnnotations = [];
			this.creationRanges = [];
			clearHighlights(this.#highlightOwner);
			return;
		}

		const resolvedAnnotations: Array<{ annotation: DocumentAnnotation; ranges: Range[] }> = [];
		for (const annotation of this.annotations) {
			const resolved = resolveTextAnchor(target, annotation.anchor);
			if (!resolved) continue;
			if (resolved.anchor !== annotation.anchor) annotation.anchor = resolved.anchor;
			resolvedAnnotations.push({ annotation, ranges: resolved.ranges });
		}
		this.resolvedAnnotations = resolvedAnnotations;
		const creationComposer = this.composer;
		const resolvedCreation = creationComposer
			? resolveTextAnchor(target, creationComposer.anchor)
			: null;
		if (
			creationComposer &&
			resolvedCreation &&
			resolvedCreation.anchor !== creationComposer.anchor
		) {
			creationComposer.anchor = resolvedCreation.anchor;
		}
		this.creationRanges = resolvedCreation?.ranges ?? [];

		this.#renderHighlights();
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = undefined;
		this.#target = undefined;
		this.resolvedAnnotations = [];
		this.creationRanges = [];
		this.composer = null;
		clearHighlights(this.#highlightOwner);
	}

	#renderHighlights() {
		const creationComposer = this.composer;
		renderHighlights(this.#highlightOwner, [
			...this.resolvedAnnotations,
			...(creationComposer && this.creationRanges.length > 0
				? [{ annotation: creationComposer, ranges: this.creationRanges }]
				: [])
		]);
	}

	#scheduleRefresh() {
		if (this.#refreshQueued) return;
		this.#refreshQueued = true;
		queueMicrotask(() => {
			this.#refreshQueued = false;
			this.refresh();
		});
	}
}
