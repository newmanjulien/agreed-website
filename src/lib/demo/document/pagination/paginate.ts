import type { ResolvedAgreementDocument } from '../resolve-agreement';
import type { PageMeasurement } from './measure';
import { tokenizeInline } from './tokenize.ts';
import type {
	HeadingFragment,
	InlineToken,
	PageFragment,
	PageLayout,
	ParagraphFragment
} from './types';

function paragraphFragment(
	blockKey: string,
	tokens: InlineToken[],
	start: number,
	end: number
): ParagraphFragment {
	return {
		type: 'paragraph',
		blockKey,
		tokens: tokens.slice(start, end),
		isContinuation: start > 0,
		isFinal: end === tokens.length
	};
}

function headingPreview(
	document: ResolvedAgreementDocument,
	blockIndex: number
): ParagraphFragment | undefined {
	const next = document.blocks[blockIndex + 1];
	if (!next || next.type !== 'paragraph') return undefined;

	const tokens = tokenizeInline(next.content);
	if (tokens.length === 0) return undefined;
	return paragraphFragment(`block-${blockIndex + 1}`, tokens, 0, Math.min(tokens.length, 4));
}

function largestFittingParagraphEnd(
	blockKey: string,
	tokens: InlineToken[],
	start: number,
	pageFragments: PageFragment[],
	pageIndex: number,
	measurement: PageMeasurement
): number {
	let low = start + 1;
	let high = tokens.length - 1;
	let best = start;

	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		const candidate = paragraphFragment(blockKey, tokens, start, middle);
		if (measurement.fits([...pageFragments, candidate], pageIndex)) {
			best = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}

	return best;
}

export function paginateDocument(
	document: ResolvedAgreementDocument,
	measurement: PageMeasurement
): PageLayout[] {
	const pages: PageLayout[] = [{ number: 1, fragments: [] }];

	const currentPage = () => pages[pages.length - 1];
	const newPage = () => {
		if (currentPage().fragments.length === 0) {
			throw new Error('Pagination attempted to create two empty pages in a row.');
		}
		pages.push({ number: pages.length + 1, fragments: [] });
	};

	for (const [blockIndex, block] of document.blocks.entries()) {
		const blockKey = `block-${blockIndex}`;
		if (block.type === 'heading') {
			const heading: HeadingFragment = {
				type: 'heading',
				blockKey,
				anchor: block.anchor,
				level: block.level,
				tokens: tokenizeInline(block.content)
			};
			const preview = headingPreview(document, blockIndex);
			const keepTogether = preview ? [heading, preview] : [heading];

			if (
				currentPage().fragments.length > 0 &&
				!measurement.fits(
					[...currentPage().fragments, ...keepTogether],
					pages.length - 1
				)
			) {
				newPage();
			}

			if (!measurement.fits([...currentPage().fragments, heading], pages.length - 1)) {
				throw new Error(`Heading "${block.anchor}" does not fit on an empty page.`);
			}

			currentPage().fragments.push(heading);
			continue;
		}

		if (block.type === 'signature-grid') {
			const signature: PageFragment = { ...block, blockKey };
			if (
				!measurement.fits([...currentPage().fragments, signature], pages.length - 1) &&
				currentPage().fragments.length > 0
			) {
				newPage();
			}

			if (!measurement.fits([signature], pages.length - 1)) {
				throw new Error('The signature grid is taller than a page.');
			}

			currentPage().fragments.push(signature);
			continue;
		}

		const tokens = tokenizeInline(block.content);
		let start = 0;

		while (start < tokens.length) {
			const complete = paragraphFragment(blockKey, tokens, start, tokens.length);
			if (measurement.fits([...currentPage().fragments, complete], pages.length - 1)) {
				currentPage().fragments.push(complete);
				start = tokens.length;
				continue;
			}

			const end = largestFittingParagraphEnd(
				blockKey,
				tokens,
				start,
				currentPage().fragments,
				pages.length - 1,
				measurement
			);

			if (end === start) {
				if (currentPage().fragments.length === 0) {
					throw new Error(`A token in "${blockKey}" is wider or taller than an empty page.`);
				}
				newPage();
				continue;
			}

			currentPage().fragments.push(paragraphFragment(blockKey, tokens, start, end));
			start = end;
			newPage();
		}
	}

	if (pages.at(-1)?.fragments.length === 0) pages.pop();
	if (pages.length === 0) throw new Error('Pagination produced no pages.');

	return pages;
}
