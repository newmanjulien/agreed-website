import type { SourcePoint, SourceRange } from '../contract/source-model';
import { pointPosition, type SourceIndex } from '../contract/source-index';
import type { ResolvedRun } from '../contract/model';

export interface AnnotationOccurrence {
	annotationId: string;
	point: SourcePoint;
	visualSource?: SourceRange;
	generatedOffset?: number;
	generated?: ResolvedRun['generated'];
	pageNumber: number;
}

export interface AnnotationTokenCoordinates {
	source: SourceRange;
	visualSource?: SourceRange;
	generatedOffset?: number;
	generated?: ResolvedRun['generated'];
	sourceKind?: ResolvedRun['sourceKind'];
	length: number;
	pageNumber: number;
}

export function ranksBefore(rank: readonly number[], previous: readonly number[]): boolean {
	for (let i = 0; i < rank.length; i++) if (rank[i] !== previous[i]) return rank[i] < previous[i];
	return false;
}

const samePoint = (a: SourcePoint, b: SourcePoint) =>
	a.sourceKey === b.sourceKey && a.offset === b.offset;

/** Page mounting and DOM positioning must choose the same source character. */
export function matchAnnotationOccurrence(
	index: SourceIndex,
	coordinates: AnnotationTokenCoordinates,
	preference: AnnotationOccurrence | null,
	fallbackPoint?: SourcePoint
) {
	const point = preference?.point ?? fallbackPoint;
	const position = point ? pointPosition(index, point) : undefined;
	const { source, visualSource, length, pageNumber } = coordinates;
	const start = pointPosition(index, source.start), end = pointPosition(index, source.end);
	const sameReplacement = Boolean(preference?.visualSource && visualSource &&
		preference.generated === coordinates.generated &&
		samePoint(preference.visualSource.start, visualSource.start) &&
		samePoint(preference.visualSource.end, visualSource.end));
	const offset = coordinates.generatedOffset ?? 0;
	const selectedOffset = preference?.generatedOffset ?? 0;
	const containsSource = position !== undefined && position >= start && (position < end || start === end);
	const containsGenerated = selectedOffset >= offset && (selectedOffset < offset + length || length === 0);
	const exact = preference?.visualSource ? sameReplacement && containsGenerated : !visualSource && containsSource;
	const matchingProvenance = preference?.visualSource ? sameReplacement : !visualSource;
	return {
		rank: [
			matchingProvenance ? 0 : 1,
			exact ? 0 : 1,
			position === undefined ? 0 : Math.max(start - position, 0, position - end),
			sameReplacement ? Math.max(offset - selectedOffset, 0, selectedOffset - offset - length) : 0,
			preference ? Math.abs(pageNumber - preference.pageNumber) : 0
		],
		characterOffset: sameReplacement
			? selectedOffset - offset
			: !visualSource && coordinates.sourceKind === 'text' && point?.sourceKey === source.start.sourceKey
				? point.offset - source.start.offset : 0
	};
}
