import { yieldToBrowser, PROCESSING_BUDGET_MS } from './scheduling';
import type { HeadingFragment, ParagraphFragment, TableFragment } from './types';
import {
	LAYOUT_COORDINATE_TOLERANCE as EPSILON,
	type ParagraphLayoutProfile,
	type WholeBlockLayoutProfile
} from './profile';

function requireLayout(condition: boolean, detail: string): asserts condition {
	if (!condition) throw new Error(`Unsupported contract layout: ${detail}.`);
}

function margins(element: HTMLElement) {
	const style = getComputedStyle(element);
	return {
		marginBlockStart: parseFloat(style.marginBlockStart),
		marginBlockEnd: parseFloat(style.marginBlockEnd)
	};
}

/** Headings and static tables stay whole and only need their total height. */
export function readWholeBlockProfile(
	element: HTMLElement,
	fragment: HeadingFragment | TableFragment
): WholeBlockLayoutProfile {
	const selector = fragment.type === 'heading' ? `h${fragment.level}` : 'table';
	requireLayout(element.matches(selector), `missing ${fragment.type} element`);
	const { marginBlockStart, marginBlockEnd } = margins(element);
	return {
		kind: fragment.type,
		outerHeight: element.getBoundingClientRect().height + marginBlockStart + marginBlockEnd
	};
}

/** Reads text leaves, not wrapper bounds (which can include multiple lines).
 * DOM order is the unconditional marker's index in the whole prepared paragraph.
 */
export async function readParagraphProfile(
	element: HTMLElement,
	fragment: ParagraphFragment,
	checkCurrent: () => void = () => {}
): Promise<ParagraphLayoutProfile> {
	requireLayout(element.matches('p'), 'missing paragraph element');
	const style = getComputedStyle(element);
	requireLayout(
		[style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth].every(
			(value) => parseFloat(value) === 0
		),
		'paragraph padding or borders require an explicit profile model'
	);
	const contentHeight = element.getBoundingClientRect().height;
	const lineHeight = parseFloat(style.lineHeight);
	requireLayout(Number.isFinite(lineHeight) && lineHeight > 0, 'paragraph line height');
	const leaves = [...element.querySelectorAll<HTMLElement>('[data-contract-token]')];
	requireLayout(leaves.length === fragment.tokens.length, 'paragraph token markers');
	const range = element.ownerDocument.createRange();
	const observed: { top: number; startToken: number; endToken: number }[] = [];
	let sliceStart = performance.now();
	for (let index = 0; index < leaves.length; index++) {
		if (index % 64 === 0 && performance.now() - sliceStart >= PROCESSING_BUDGET_MS) {
			await yieldToBrowser();
			checkCurrent();
			sliceStart = performance.now();
		}
		const leaf = leaves[index];
		const text = leaf.firstChild;
		requireLayout(
			text?.nodeType === Node.TEXT_NODE && text.textContent === fragment.tokens[index].value,
			'paragraph token text differs from prepared content'
		);
		range.selectNodeContents(text);
		// Collapsed trailing spaces can return zero-width rects on the following line.
		// They carry no visible geometry and stay with the preceding token/line.
		const rects = [...range.getClientRects()].filter(
			(rect) => rect.width > EPSILON && rect.height > 0
		);
		if (!rects.length) {
			requireLayout(!fragment.tokens[index].value.trim(), 'visible token has no line geometry');
			if (observed.length) observed[observed.length - 1].endToken = index + 1;
			continue;
		}
		const top = rects[0].top;
		requireLayout(
			rects.every((rect) => Math.abs(rect.top - top) <= EPSILON),
			`token ${index} spans multiple visual lines in ${fragment.blockKey}`
		);
		const previous = observed.at(-1);
		if (previous && Math.abs(previous.top - top) <= EPSILON) previous.endToken = index + 1;
		else {
			requireLayout(
				!previous || top > previous.top,
				'paragraph visual lines are out of token order'
			);
			observed.push({ top, startToken: previous?.endToken ?? 0, endToken: index + 1 });
		}
	}
	if (!observed.length) {
		// Wholly collapsed whitespace retains its tokens without allocating a visual line.
		// A block insertion trigger can allocate an empty line without visible glyphs.
		requireLayout(
			contentHeight === 0 ||
				(fragment.emptyInsertionSlot === true && Math.abs(contentHeight - lineHeight) <= EPSILON),
			'paragraph content height has no observed visual lines'
		);
		return {
			kind: 'paragraph',
			tokenCount: fragment.tokens.length,
			...margins(element),
			contentHeight,
			lines:
				contentHeight > 0
					? [{ startToken: 0, endToken: fragment.tokens.length, top: 0, bottom: contentHeight }]
					: []
		};
	}
	const firstTop = observed[0].top;
	// WebKit can allocate integral line boxes even when computed line-height is fractional.
	const allocatedLineHeight = contentHeight / observed.length;
	const lines = observed.map((line, index) => {
		// Glyph positions establish real line boundaries. Their successive displacement
		// gives allocated line-box height including leading; the block supplies the end.
		const top = line.top - firstTop;
		const bottom = index + 1 < observed.length ? observed[index + 1].top - firstTop : contentHeight;
		requireLayout(
			Math.abs(bottom - top - allocatedLineHeight) <= EPSILON,
			`paragraph line boxes differ in ${fragment.blockKey}: ${bottom - top} vs ${lineHeight}; content ${contentHeight}`
		);
		return { startToken: line.startToken, endToken: line.endToken, top, bottom };
	});
	return {
		kind: 'paragraph',
		tokenCount: fragment.tokens.length,
		...margins(element),
		contentHeight,
		lines
	};
}
