import { annotationSegment } from '$lib/components/contract-demo/playbook/document-overlay';
import type { ResolvedBlock } from '$lib/components/contract-demo/contract/model';
import { tokenizeInline } from './tokenize';
import type { InlineToken, PageFragment, ParagraphFragment } from './types';

// Geometry authorizes height reuse only. Fragments always carry current provenance.
// Prepared object identity also guards page content and provenance reuse.
export interface PreparedBlock {
	readonly fragment: PageFragment;
	readonly geometryFingerprint: string;
}

// Preserve token/span and revision boundaries. Occurrence names and source coordinates
// are provenance only, but annotation segmentation affects layout.
function geometryTokens(tokens: readonly InlineToken[]) {
	let segment = -1;
	let previous: string | undefined;
	return tokens.map((token, index) => {
		const descriptor = annotationSegment(token.annotations);
		if (!index || previous !== descriptor.membershipKey) segment++;
		previous = descriptor.membershipKey;
		return [token.value, token.revision ?? null, segment, Boolean(descriptor.target)];
	});
}

export class LayoutPreparationEngine {
	#blocks = new WeakMap<ResolvedBlock, PreparedBlock>();
	prepare(block: ResolvedBlock): PreparedBlock {
		const cached = this.#blocks.get(block);
		if (cached) return cached;
		let fragment: PageFragment;
		if (block.kind === 'table') {
			fragment = {
				type: 'table',
				blockKey: block.blockKey,
				variant: block.variant,
				headerRowCount: block.headerRowCount,
				rows: block.rows
			};
		} else {
			const inline = tokenizeInline(block.content);
			fragment =
				block.kind === 'heading'
					? {
							type: 'heading',
							interval: { start: 0, end: inline.length },
							blockKey: block.blockKey,
							anchor: block.anchor,
							level: block.level,
							tokens: inline
						}
					: {
							type: 'paragraph',
							interval: { start: 0, end: inline.length },
							blockKey: block.blockKey,
							tokens: inline,
							isFinal: true,
							emptyInsertionSlot: Boolean(block.emptyInsertionSlot)
						};
		}
		const geometryFingerprint = JSON.stringify(
			fragment.type === 'table'
				? ['table', fragment.variant, fragment.headerRowCount, fragment.rows]
				: [
						fragment.type,
						fragment.type === 'heading' ? fragment.level : Boolean(fragment.emptyInsertionSlot),
						geometryTokens(fragment.tokens)
					]
		);
		const prepared = { fragment, geometryFingerprint };
		this.#blocks.set(block, prepared);
		return prepared;
	}
}

export function paragraphSlice(
	block: ParagraphFragment,
	start: number,
	end: number
): ParagraphFragment {
	if (start === 0 && end === block.tokens.length) return block;
	return {
		...block,
		interval: { start, end },
		tokens: block.tokens.slice(start, end),
		isFinal: end === block.tokens.length
	};
}
