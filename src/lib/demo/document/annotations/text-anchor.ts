import {
	compareTextPoints,
	indexDocumentText,
	rangeFromIndexedTextBlock
} from '../dom-text-index';
import type { IndexedTextBlock, TextPoint } from '../dom-text-index';
import type { TextAnchor, TextAnchorSegment } from './types';

export interface ResolvedTextAnchor {
	anchor: TextAnchor;
	ranges: Range[];
}

const ANNOTATABLE_BLOCK_SELECTOR =
	'.agreement-heading[data-block-id], .agreement-paragraph[data-block-id]';

function selectedInterval(
	document: Document,
	block: IndexedTextBlock,
	selectionStart: TextPoint,
	selectionEnd: TextPoint
): { start: number; end: number } | null {
	let start = block.ends.findIndex(
		(point) => compareTextPoints(document, point, selectionStart) > 0
	);
	if (start === -1) return null;

	let end = block.starts.findIndex(
		(point) => compareTextPoints(document, point, selectionEnd) >= 0
	);
	if (end === -1) end = block.text.length;

	while (start < end && block.text[start] === ' ') start += 1;
	while (end > start && block.text[end - 1] === ' ') end -= 1;
	return start < end ? { start, end } : null;
}

export function createTextAnchor(root: HTMLElement, range: Range): TextAnchor | null {
	const annotatableBlockIds = new Set(
		Array.from(root.querySelectorAll<HTMLElement>(ANNOTATABLE_BLOCK_SELECTOR), (element) =>
			element.dataset.blockId
		).filter((blockId): blockId is string => Boolean(blockId))
	);
	const document = root.ownerDocument;
	const selectionStart = { node: range.startContainer, offset: range.startOffset };
	const selectionEnd = { node: range.endContainer, offset: range.endOffset };
	const segments: TextAnchorSegment[] = [];

	for (const block of indexDocumentText(root)) {
		const interval = selectedInterval(document, block, selectionStart, selectionEnd);
		if (!interval) continue;
		if (!annotatableBlockIds.has(block.id)) return null;
		segments.push({
			blockId: block.id,
			...interval,
			quote: block.text.slice(interval.start, interval.end)
		});
	}

	return segments.length > 0 ? { segments } : null;
}

export function resolveTextAnchor(root: HTMLElement, anchor: TextAnchor): ResolvedTextAnchor | null {
	const blocks = new Map(indexDocumentText(root).map((block) => [block.id, block]));
	const segments: TextAnchorSegment[] = [];
	const ranges: Range[] = [];

	for (const segment of anchor.segments) {
		const block = blocks.get(segment.blockId);
		if (!block) return null;

		let start = segment.start;
		let end = segment.end;
		if (block.text.slice(start, end) !== segment.quote) {
			start = block.text.indexOf(segment.quote);
			if (start === -1 || block.text.indexOf(segment.quote, start + 1) !== -1) return null;
			end = start + segment.quote.length;
		}

		const range = rangeFromIndexedTextBlock(root, block, start, end);
		if (!range) return null;
		segments.push(
			start === segment.start && end === segment.end ? segment : { ...segment, start, end }
		);
		ranges.push(range);
	}

	if (ranges.length === 0) return null;
	const unchanged = segments.every((segment, index) => segment === anchor.segments[index]);

	return {
		anchor: unchanged ? anchor : { segments },
		ranges
	};
}
