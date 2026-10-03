import { paragraphSlice, type PreparedBlock } from './prepare';
import { fitsPage, pageCapacity } from './page-format';
import {
	maximumParagraphLineEnd,
	paragraphFirstLineHeight,
	paragraphFragmentHeight,
	type LayoutProfiles
} from './profile';
import type { LayoutPlacement, PageFragment, PaginatedPage } from './types';

export interface PaginationOptions {
	capacity?: (pageIndex: number) => number;
}

/** Complete, synchronous page assignment from request-local, validated geometry.
 * Always starts at block zero. There is no measurement, cache, scheduling or prior layout.
 */
export function paginatePreparedDocument(
	blocks: readonly PreparedBlock[],
	profiles: LayoutProfiles,
	{ capacity = pageCapacity }: PaginationOptions = {}
): PaginatedPage[] {
	const pages: PaginatedPage[] = [];
	if (!blocks.length) return pages;
	const capacityAt = (pageIndex: number) => {
		const value = capacity(pageIndex);
		if (!Number.isFinite(value) || value <= 0)
			throw new Error('Pagination requires a finite, positive page capacity.');
		return value;
	};
	const profileFor = (block: PreparedBlock) => {
		const profile = profiles.get(block);
		if (!profile || profile.kind !== block.fragment.type)
			throw new Error(`Missing or mismatched layout profile for "${block.fragment.blockKey}".`);
		return profile;
	};
	let page: { number: number; placements: LayoutPlacement[] } = { number: 1, placements: [] };
	let remaining = capacityAt(0);
	const fits = (height: number) => fitsPage(height, remaining);
	function newPage() {
		if (!page.placements.length) throw new Error('Pagination cannot emit an empty page.');
		pages.push(page);
		page = { number: page.number + 1, placements: [] };
		remaining = capacityAt(page.number - 1);
	}
	function accept(prepared: PreparedBlock, fragment: PageFragment, height: number) {
		page.placements.push({ prepared, fragment });
		remaining -= height;
	}
	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index];
		const whole = block.fragment;
		const profile = profileFor(block);
		if (whole.type === 'heading' && profile.kind === 'heading') {
			const next = blocks[index + 1];
			const following = next?.fragment.type === 'paragraph' ? profileFor(next) : undefined;
			const required =
				profile.outerHeight +
				(following?.kind === 'paragraph' ? paragraphFirstLineHeight(following) : 0);
			if (!fits(required) && page.placements.length) newPage();
			if (!fits(required))
				throw new Error(
					`Heading "${whole.anchor}" cannot fit with its required spacing and following line on an empty page.`
				);
			accept(block, whole, profile.outerHeight);
		} else if (whole.type === 'table' && profile.kind === 'table') {
			if (!fits(profile.outerHeight) && page.placements.length) newPage();
			if (!fits(profile.outerHeight))
				throw new Error(`Table "${whole.blockKey}" exceeds an empty page.`);
			accept(block, whole, profile.outerHeight);
		} else if (whole.type === 'paragraph' && profile.kind === 'paragraph') {
			if (profile.tokenCount !== whole.tokens.length)
				throw new Error(`Paragraph layout profile does not match "${whole.blockKey}".`);
			if (!profile.lines.length) {
				const height = paragraphFragmentHeight(profile, 0, 0);
				if (!fits(height) && page.placements.length) newPage();
				if (!fits(height))
					throw new Error(`Paragraph spacing in "${whole.blockKey}" exceeds an empty page.`);
				accept(block, paragraphSlice(whole, 0, whole.tokens.length), height);
				continue;
			}
			for (let start = 0; start < profile.lines.length;) {
				const end = maximumParagraphLineEnd(profile, start, remaining);
				if (end === start) {
					if (!page.placements.length)
						throw new Error(
							`Visual line ${start} and its spacing in "${whole.blockKey}" exceed an empty page.`
						);
					newPage();
					continue;
				}
				accept(
					block,
					paragraphSlice(whole, profile.lines[start].startToken, profile.lines[end - 1].endToken),
					paragraphFragmentHeight(profile, start, end)
				);
				start = end;
				if (start < profile.lines.length) newPage();
			}
		}
	}
	if (page.placements.length) pages.push(page);
	return pages;
}
