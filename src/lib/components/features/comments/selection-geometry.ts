import type { ScenePoint } from '../demo/tour-model.ts';

export interface RectLike {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface MeasuredSelectionRect {
	row: RectLike;
	scene: RectLike;
}

export interface SelectionSegment extends MeasuredSelectionRect {
	startProgress: number;
	endProgress: number;
}

export interface SelectionGeometry {
	segments: SelectionSegment[];
	bounds: RectLike;
	start: ScenePoint;
	end: ScenePoint;
}

const RECT_TOLERANCE = 0.5;

function nearlyEqual(left: number, right: number): boolean {
	return Math.abs(left - right) <= RECT_TOLERANCE;
}

export function deduplicateRects<Rect extends RectLike>(rects: ReadonlyArray<Rect>): Rect[] {
	const uniqueRects: Rect[] = [];
	for (const rect of rects) {
		if (
			rect.width > RECT_TOLERANCE &&
			!uniqueRects.some((candidate) =>
			nearlyEqual(rect.left, candidate.left) &&
			nearlyEqual(rect.top, candidate.top) &&
			nearlyEqual(rect.width, candidate.width) &&
			nearlyEqual(rect.height, candidate.height)
		)
		) uniqueRects.push(rect);
	}
	return uniqueRects;
}

export function rectRelativeTo(
	rect: RectLike,
	rootRect: RectLike,
	rootWidth: number,
	rootHeight: number
): RectLike {
	const scaleX = rootWidth > 0 && rootRect.width > 0 ? rootRect.width / rootWidth : 1;
	const scaleY = rootHeight > 0 && rootRect.height > 0 ? rootRect.height / rootHeight : 1;
	return {
		left: (rect.left - rootRect.left) / scaleX,
		top: (rect.top - rootRect.top) / scaleY,
		width: rect.width / scaleX,
		height: rect.height / scaleY
	};
}

export function buildSelectionGeometry(
	rects: ReadonlyArray<MeasuredSelectionRect>,
	wrapTransitionProgress: number
): SelectionGeometry | undefined {
	if (rects.length === 0) return;

	const totalWidth = rects.reduce((sum, rect) => sum + rect.row.width, 0) || 1;
	const wrapCount = Math.max(0, rects.length - 1);
	const wrapProgress = Math.min(wrapTransitionProgress, 0.25 / Math.max(1, wrapCount));
	const lineProgress = 1 - wrapProgress * wrapCount;
	let timelineProgress = 0;

	const segments = rects.map((rect, index) => {
		const duration = (rect.row.width / totalWidth) * lineProgress;
		const segment: SelectionSegment = {
			...rect,
			startProgress: timelineProgress,
			endProgress: timelineProgress + duration
		};
		timelineProgress += duration;
		if (index < rects.length - 1) timelineProgress += wrapProgress;
		return segment;
	});

	const left = Math.min(...segments.map(({ row }) => row.left));
	const top = Math.min(...segments.map(({ row }) => row.top));
	const right = Math.max(...segments.map(({ row }) => row.left + row.width));
	const bottom = Math.max(...segments.map(({ row }) => row.top + row.height));
	const first = segments[0]!;
	const last = segments.at(-1)!;

	return {
		segments,
		bounds: { left, top, width: right - left, height: bottom - top },
		start: { x: first.scene.left, y: first.scene.top + first.scene.height / 2 },
		end: { x: last.scene.left + last.scene.width, y: last.scene.top + last.scene.height / 2 }
	};
}

export function selectionFragmentProgress(
	segment: SelectionSegment,
	progress: number
): number {
	if (progress <= segment.startProgress) return 0;
	if (progress >= segment.endProgress) return 1;
	return (progress - segment.startProgress) / (segment.endProgress - segment.startProgress);
}

export function selectionPointAt(
	geometry: SelectionGeometry,
	progress: number
): ScenePoint {
	for (const [index, segment] of geometry.segments.entries()) {
		if (progress <= segment.endProgress) {
			const lineProgress = selectionFragmentProgress(segment, progress);
			return {
				x: segment.scene.left + segment.scene.width * lineProgress,
				y: segment.scene.top + segment.scene.height / 2
			};
		}

		const nextSegment = geometry.segments[index + 1];
		if (nextSegment && progress < nextSegment.startProgress) {
			const wrapProgress =
				(progress - segment.endProgress) /
				(nextSegment.startProgress - segment.endProgress);
			return {
				x: segment.scene.left + segment.scene.width +
					(nextSegment.scene.left - segment.scene.left - segment.scene.width) * wrapProgress,
				y: segment.scene.top + segment.scene.height / 2 +
					(nextSegment.scene.top + nextSegment.scene.height / 2 - segment.scene.top - segment.scene.height / 2) * wrapProgress
			};
		}
	}

	return geometry.end;
}
