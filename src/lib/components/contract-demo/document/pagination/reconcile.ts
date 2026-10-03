import type { PageFragment, PaginatedPage } from './types';

export interface PageReconciliation {
	pages: PaginatedPage[];
	/** Includes removed pages so downstream geometry can discard them. */
	changedPages: number[];
}

function sameFragment(a: PageFragment, b: PageFragment): boolean {
	return a.interval?.start === b.interval?.start && a.interval?.end === b.interval?.end;
}

function samePage(candidate: PaginatedPage, previous: PaginatedPage): boolean {
	return (
		candidate.number === previous.number &&
		candidate.placements.length === previous.placements.length &&
		candidate.placements.every(
			({ prepared, fragment }, index) =>
				prepared === previous.placements[index].prepared &&
				sameFragment(fragment, previous.placements[index].fragment)
		)
	);
}

/** Reconcile complete paginator output at the same page positions, never partial work.
 * Prepared objects and their tokens are immutable across requests. Their identity
 * proves content/provenance equality; geometry fingerprints cannot authorize reuse.
 */
export function reconcilePages(
	candidates: readonly PaginatedPage[],
	layoutEpoch: string,
	previous?: { readonly layoutEpoch: string; readonly pages: readonly PaginatedPage[] }
): PageReconciliation {
	const previousPages = previous?.pages ?? [];
	const sameEpoch = previous?.layoutEpoch === layoutEpoch;
	const pages = candidates.map((candidate, index) => {
		const prior = previousPages[index];
		return sameEpoch && prior && samePage(candidate, prior) ? prior : candidate;
	});
	const changedPages: number[] = [];
	for (let index = 0; index < Math.max(pages.length, previousPages.length); index++) {
		if (!sameEpoch || pages[index] !== previousPages[index]) changedPages.push(index + 1);
	}
	return { pages, changedPages };
}
