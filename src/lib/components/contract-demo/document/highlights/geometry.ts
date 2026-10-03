import { HIGHLIGHT_THEME, type HighlightKind } from './theme';
import { annotationMemberships } from '../annotation-anchor';

export type { HighlightKind } from './theme';

const TEXT_CONTAINER_SELECTOR = 'p, h1, h2, h3';

export interface HighlightRect {
	page: number;
	x: number;
	y: number;
	width: number;
	height: number;
	kind: HighlightKind;
	triggerState?: 'default' | 'hover' | 'selected';
}

interface Band {
	y: number;
	height: number;
	center: number;
}
interface TextEntry {
	rects: TextRect[];
	trigger: HTMLElement | null;
	revision: string | undefined;
}
interface TextRect extends Band {
	left: number;
	right: number;
	band: Band;
}
interface TextContainer {
	element: HTMLElement;
	texts: TextEntry[];
	bands: Band[];
}
interface PageGeometry {
	element: HTMLElement;
	number: number;
	containers: TextContainer[];
}

export interface MeasuredInterval {
	page: PageGeometry;
	container: TextContainer;
	band: Band;
	left: number;
	right: number;
	kind: HighlightKind;
	owner?: HTMLElement;
}

function pageSpace(page: HTMLElement) {
	const bounds = page.getBoundingClientRect();
	const scale = bounds.width / page.offsetWidth;
	return { bounds, scale };
}

/** All text on a container's line supplies the same band, including unhighlighted runs. */
export function buildLineMaps(
	stage: HTMLElement,
	pageNumbers?: ReadonlySet<number>
): PageGeometry[] {
	const range = document.createRange();
	return Array.from(stage.querySelectorAll<HTMLElement>('.document-page'))
		.filter((element) => !pageNumbers || pageNumbers.has(Number(element.dataset.pageNumber)))
		.map((element) => {
			const { bounds, scale } = pageSpace(element);
			const containers: TextContainer[] = [];
			for (const container of element.querySelectorAll<HTMLElement>(TEXT_CONTAINER_SELECTOR)) {
				const style = getComputedStyle(container);
				let lineHeight = parseFloat(style.lineHeight);
				const top =
					(container.getBoundingClientRect().top - bounds.top) / scale +
					parseFloat(style.borderTopWidth || '0') +
					parseFloat(style.paddingTop || '0');
				const texts: (Omit<TextEntry, 'rects'> & { rects: Omit<TextRect, 'band'>[] })[] = [];
				const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
				for (let node = walker.nextNode(); node; node = walker.nextNode()) {
					// A decorative scene can hide the whole viewer from assistive technology.
					// Only hidden content inside this page should be omitted from its geometry.
					const hidden = node.parentElement?.closest('[aria-hidden="true"]');
					if (
						(hidden && element.contains(hidden)) ||
						node.parentElement?.closest(TEXT_CONTAINER_SELECTOR) !== container
					)
						continue;
					const rects: Omit<TextRect, 'band'>[] = [];
					range.selectNodeContents(node);
					for (const rect of range.getClientRects()) {
						if (!rect.width || !rect.height) continue;
						const y = (rect.top - bounds.top) / scale,
							height = rect.height / scale;
						rects.push({
							y,
							height,
							center: y + height / 2,
							left: (rect.left - bounds.left) / scale,
							right: (rect.right - bounds.left) / scale
						});
					}
					texts.push({
						rects,
						trigger: node.parentElement?.closest<HTMLElement>('.playbook-trigger') ?? null,
						revision: node.parentElement?.closest<HTMLElement>('[data-revision]')?.dataset.revision
					});
				}
				const bands: Band[] = [];
				const metrics = texts.flatMap((entry) => entry.rects);
				if (container.matches('p')) {
					const tops = [...new Set(metrics.map(rect => Math.round(rect.y * 100) / 100))].sort((a,b) => a-b);
					const step = tops.slice(1).map((top,index) => top-tops[index]).find(step => Math.abs(step-lineHeight) < 1);
					if (step) lineHeight = step;
				}
				for (const metric of metrics.sort((a, b) => a.center - b.center)) {
					if (Number.isFinite(lineHeight) && lineHeight > 0) {
						const y =
							top +
							Math.max(0, Math.round((metric.center - top - lineHeight / 2) / lineHeight)) *
								lineHeight;
						if (!bands.some((band) => Math.abs(band.y - y) < 0.01))
							bands.push({ y, height: lineHeight, center: y + lineHeight / 2 });
					} else {
						// Zero/normal line height uses the union of text metrics on that line.
						const band = bands.find(
							(band) =>
								Math.abs(band.center - metric.center) < Math.min(band.height, metric.height) / 2
						);
						if (band) {
							const bottom = Math.max(band.y + band.height, metric.y + metric.height);
							band.y = Math.min(band.y, metric.y);
							band.height = bottom - band.y;
							band.center = band.y + band.height / 2;
						} else bands.push({ y: metric.y, height: metric.height, center: metric.center });
					}
				}
				containers.push({
					element: container,
					bands,
					texts: texts.map((entry) => ({
						...entry,
						rects: entry.rects.map((rect) => ({ ...rect, band: nearestBand(bands, rect.center)! }))
					}))
				});
			}
			return { element, number: Number(element.dataset.pageNumber), containers };
		});
}

function nearestBand(bands: Band[], center: number): Band | undefined {
	return bands.reduce<Band | undefined>(
		(best, next) =>
			!best || Math.abs(next.center - center) < Math.abs(best.center - center) ? next : best,
		undefined
	);
}

export function measureRevisions(pages: PageGeometry[]): MeasuredInterval[] {
	return pages.flatMap((page) =>
		page.containers.flatMap((container) => {
			const intervals: MeasuredInterval[] = [];
			for (const entry of container.texts) {
				if (entry.revision !== 'added' && entry.revision !== 'removed') continue;
				for (const rect of entry.rects)
					intervals.push({
						page,
						container,
						band: rect.band,
						left: rect.left,
						right: rect.right,
						kind: entry.revision === 'added' ? 'revision-added' : 'revision-removed'
					});
			}
			return mergeIntervals(intervals);
		})
	);
}

export function measureTriggers(pages: PageGeometry[]): MeasuredInterval[] {
	return pages.flatMap((page) =>
		page.containers.flatMap((container) => {
			const intervals: MeasuredInterval[] = [];
			for (const entry of container.texts) {
				const owner = entry.trigger;
				if (!owner || owner.closest('.is-empty-insertion-slot')) continue;
				for (const rect of entry.rects)
					intervals.push({
						page,
						container,
						band: rect.band,
						left: rect.left,
						right: rect.right,
						kind: 'trigger',
						owner
					});
			}
			// Empty insertion slots have no text rectangles and occupy a full line.
			for (const owner of container.element.querySelectorAll<HTMLElement>('.playbook-trigger')) {
				if (
					!owner.closest('.is-empty-insertion-slot') ||
					owner.closest(TEXT_CONTAINER_SELECTOR) !== container.element
				)
					continue;
				const { bounds, scale } = pageSpace(page.element),
					box = owner.getBoundingClientRect();
				const y = (box.top - bounds.top) / scale,
					height = box.height / scale;
				intervals.push({
					page,
					container,
					band: { y, height, center: y + height / 2 },
					left: (box.left - bounds.left) / scale,
					right: (box.right - bounds.left) / scale,
					kind: 'trigger',
					owner
				});
			}
			return mergeIntervals(intervals);
		})
	);
}

function mergeIntervals(intervals: MeasuredInterval[]): MeasuredInterval[] {
	const result: MeasuredInterval[] = [];
	// Bands belong to a single container; keep each kind and owner independent.
	const bands = new Map<Band, Map<HighlightKind, Map<HTMLElement | undefined, MeasuredInterval>>>();
	for (const interval of intervals.sort((a, b) => a.band.y - b.band.y || a.left - b.left)) {
		let kinds = bands.get(interval.band);
		if (!kinds) bands.set(interval.band, (kinds = new Map()));
		let owners = kinds.get(interval.kind);
		if (!owners) kinds.set(interval.kind, (owners = new Map()));
		const last = owners.get(interval.owner);
		if (last && interval.left <= last.right + 0.01)
			last.right = Math.max(last.right, interval.right);
		else {
			const merged = { ...interval };
			result.push(merged);
			owners.set(interval.owner, merged);
		}
	}
	return result;
}

/** Subtract within vertically overlapping groups on each page before painting. */
export function resolveOverlaps(
	intervals: MeasuredInterval[],
	hoveredAnnotationId: string | null = null,
	selectedAnnotationId: string | null = null
): HighlightRect[] {
	const pages = new Map<PageGeometry, MeasuredInterval[]>();
	for (const interval of intervals) {
		const page = pages.get(interval.page);
		if (page) page.push(interval);
		else pages.set(interval.page, [interval]);
	}
	return Array.from(pages.values()).flatMap((page) => {
		const groups: MeasuredInterval[][] = [];
		let bottom = -Infinity;
		for (const interval of page.sort((a, b) => a.band.y - b.band.y)) {
			if (interval.band.y >= bottom) {
				groups.push([]);
				bottom = -Infinity;
			}
			groups.at(-1)!.push(interval);
			bottom = Math.max(bottom, interval.band.y + interval.band.height);
		}
		return groups.flatMap((group) => subtractGroup(group, hoveredAnnotationId, selectedAnnotationId));
	});
}

function subtractGroup(
	intervals: MeasuredInterval[],
	hoveredAnnotationId: string | null,
	selectedAnnotationId: string | null
): HighlightRect[] {
	type Piece = { interval: MeasuredInterval; x: number; y: number; width: number; height: number };
	const result: Piece[] = [];
	for (const interval of intervals.sort(
		(a, b) => HIGHLIGHT_THEME[b.kind].priority - HIGHLIGHT_THEME[a.kind].priority
	)) {
		let pieces: Piece[] = [
			{
				interval,
				x: interval.left,
				y: interval.band.y,
				width: interval.right - interval.left,
				height: interval.band.height
			}
		];
		for (const cover of result) {
			pieces = pieces.flatMap((piece) => {
				const left = Math.max(piece.x, cover.x),
					right = Math.min(piece.x + piece.width, cover.x + cover.width);
				const top = Math.max(piece.y, cover.y),
					bottom = Math.min(piece.y + piece.height, cover.y + cover.height);
				if (left >= right || top >= bottom) return [piece];
				return [
					{ ...piece, height: top - piece.y },
					{ ...piece, y: bottom, height: piece.y + piece.height - bottom },
					{ ...piece, y: top, height: bottom - top, width: left - piece.x },
					{ ...piece, x: right, y: top, height: bottom - top, width: piece.x + piece.width - right }
				].filter((part) => part.width > 0 && part.height > 0);
			});
			if (!pieces.length) break;
		}
		result.push(...pieces);
	}
	return result.map(({ interval, ...rect }) => {
		const owner = interval.owner;
		return {
			...rect,
			page: interval.page.number,
			kind: interval.kind,
			...(owner
				? {
						triggerState:
							selectedAnnotationId !== null && annotationMemberships(owner).includes(selectedAnnotationId)
								? ('selected' as const)
								: owner.dataset.annotationId === hoveredAnnotationId
									? ('hover' as const)
									: ('default' as const)
					}
				: {})
		};
	});
}
