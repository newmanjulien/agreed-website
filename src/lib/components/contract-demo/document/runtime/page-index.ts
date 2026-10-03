import type { SourcePoint } from '../../playbook/model';
import { annotationSegments } from '../../playbook/document-overlay';
import type { InlineToken } from '../pagination/types';
import { matchAnnotationOccurrence, ranksBefore, type AnnotationOccurrence, type AnnotationTokenCoordinates } from '../annotation-occurrence';
import type { RenderSnapshot } from './types';

export interface AnnotationDestination { page: number; id: string }
const indexes = new WeakMap<RenderSnapshot, ReturnType<typeof buildIndex>>();
function buildIndex(snapshot: RenderSnapshot) {
	const annotations: AnnotationDestination[] = [];
	const tabStops = new Set<InlineToken>();
	const seenAnnotations = new Set<string>();
	const sources = new Map<string, AnnotationTokenCoordinates[]>();
	const annotationSources = new Map<string, AnnotationTokenCoordinates[]>();
	const annotationPages = new Map<string, number>();
	for (const page of snapshot.pages) {
		for (const { fragment } of page.placements) {
			if (fragment.type === 'table') continue;
			for (const segment of annotationSegments(fragment.tokens)) {
				if (segment.target && !seenAnnotations.has(segment.target.id)) {
					seenAnnotations.add(segment.target.id);
					annotations.push({ page: page.number, id: segment.target.id });
					tabStops.add(segment.tokens[0]);
				}
				for (const id of segment.membershipIds) {
					if (!annotationPages.has(id)) annotationPages.set(id, page.number);
				}
				for (const token of segment.tokens) {
					const source = token.visualSource ?? token.source;
					if (!source) continue;
					const entry: AnnotationTokenCoordinates = {
						source,
						visualSource: token.visualSource,
						generated: token.generated,
						generatedOffset: token.generatedOffset,
						sourceKind: token.sourceKind,
						length: token.value.length,
						pageNumber: page.number
					};
					// Scroll restoration locates baseline source spans, not visual provenance.
					if (token.source) {
						const key = token.source.start.sourceKey;
						if (!sources.has(key)) sources.set(key, []);
						sources.get(key)!.push({ ...entry, source: token.source });
					}
					for (const id of segment.membershipIds) {
						if (!annotationSources.has(id)) annotationSources.set(id, []);
						annotationSources.get(id)!.push(entry);
					}
				}
			}
		}
	}
	return { annotations, tabStops, sources, annotationSources, annotationPages };
}
export function pageIndex(snapshot: RenderSnapshot) {
	let index = indexes.get(snapshot);
	if (!index) {
		index = buildIndex(snapshot);
		indexes.set(snapshot, index);
	}
	return index;
}
function nearestSourcePage(entries: readonly AnnotationTokenCoordinates[], point: SourcePoint, preferred?: number) {
	let best: { rank: number[]; page: number } | undefined;
	for (const entry of entries) {
		const { start, end } = entry.source;
		if (start.sourceKey !== point.sourceKey) continue;
		// Half-open source intervals prefer the next token at a page boundary.
		const contains = start.offset === end.offset
			? point.offset === start.offset : point.offset >= start.offset && point.offset < end.offset;
		const rank = [
			contains ? 0 : 1,
			Math.max(start.offset - point.offset, point.offset - end.offset, 0),
			preferred === undefined ? 0 : Math.abs(entry.pageNumber - preferred)
		];
		if (!best || ranksBefore(rank, best.rank)) best = { rank, page: entry.pageNumber };
	}
	return best?.page;
}
export function sourcePage(snapshot: RenderSnapshot, point: SourcePoint, preferred?: number) {
	return nearestSourcePage(pageIndex(snapshot).sources.get(point.sourceKey) ?? [], point, preferred);
}
export function annotationPage(snapshot: RenderSnapshot, id: string | null, preference: AnnotationOccurrence | null = null, fallbackPoint?: SourcePoint) {
	if (!id) return fallbackPoint ? sourcePage(snapshot, fallbackPoint) : undefined;
	const index = pageIndex(snapshot);
	let best: { rank: number[]; page: number } | undefined;
	if (preference || fallbackPoint) {
		for (const entry of index.annotationSources.get(id) ?? []) {
			const { rank } = matchAnnotationOccurrence(snapshot.source.sourceIndex, entry, preference, fallbackPoint);
			if (!best || ranksBefore(rank, best.rank)) best = { rank, page: entry.pageNumber };
		}
	}
	return best?.page ?? index.annotationPages.get(id);
}
export function visiblePageNumbers(count: number, top: number, bottom: number, stride: number): number[] {
	if (!count) return [];
	const first = Math.max(0, Math.min(count - 1, Math.floor(top / stride)) - 1);
	const last = Math.min(count - 1, Math.max(first, Math.floor(bottom / stride)) + 1);
	return Array.from({ length: last - first + 1 }, (_, index) => first + index + 1);
}
