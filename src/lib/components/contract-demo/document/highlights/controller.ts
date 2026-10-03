import {
	buildLineMaps,
	measureRevisions,
	measureTriggers,
	resolveOverlaps,
	type MeasuredInterval,
	type HighlightRect
} from './geometry';
import { annotationMemberships } from '../annotation-anchor';

type GeometryChange = 'invalidate' | 'measure';

type PageGeometry = ReturnType<typeof buildLineMaps>[number];
type PageRecord = {
	geometry: PageGeometry;
	triggers: MeasuredInterval[];
	revisions: MeasuredInterval[];
};
export type PageHighlights = ReadonlyMap<number, readonly HighlightRect[]>;
export const EMPTY_HIGHLIGHTS: readonly HighlightRect[] = Object.freeze([]);

export class DocumentHighlightController {
	#stage: HTMLElement;
	#pages = new Map<number, PageRecord>();
	#publication: PageHighlights = new Map();
	#listeners = new Set<(pages: PageHighlights) => void>();
	#hoveredAnnotationId: string | null = null;
	#selectedAnnotationId: string | null = null;
	#geometryListeners = new Set<(change: GeometryChange) => void>();
	#allGeometryDirty = true;
	#geometryDirty = new Set<number>();
	#paintDirty = new Set<number>();
	#frame: number | undefined;
	#destroyed = false;
	#resize: ResizeObserver;
	#mutations: MutationObserver;
	#observed = new Set<Element>();

	constructor(stage: HTMLElement) {
		this.#stage = stage;
		this.#resize = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const page = (entry.target as HTMLElement).closest<HTMLElement>('.document-page');
				if (page) this.#invalidatePages([Number(page.dataset.pageNumber)]);
			}
		});
		this.#mutations = new MutationObserver(this.#contentChanged);
		this.#invalidatePages(this.#observeContent());
		this.#schedule();
	}

	subscribe(listener: (pages: PageHighlights) => void) {
		this.#listeners.add(listener);
		listener(this.#publication);
		return () => {
			this.#listeners.delete(listener);
		};
	}
	hitTest(pageElement: HTMLElement, clientX: number, clientY: number): HTMLElement | null {
		const number = Number(pageElement.dataset.pageNumber),
			page = this.#pages.get(number);
		if (
			this.#destroyed ||
			this.#allGeometryDirty ||
			this.#geometryDirty.has(number) ||
			page?.geometry.element !== pageElement
		)
			return null;
		const bounds = pageElement.getBoundingClientRect(),
			scale = bounds.width / pageElement.offsetWidth;
		if (
			!scale ||
			clientX < bounds.left ||
			clientX >= bounds.right ||
			clientY < bounds.top ||
			clientY >= bounds.bottom
		)
			return null;
		const x = (clientX - bounds.left) / scale,
			y = (clientY - bounds.top) / scale;
		return (
			page.triggers.find(
				(interval) =>
					interval.owner?.isConnected &&
					x >= interval.left &&
					x < interval.right &&
					y >= interval.band.y &&
					y < interval.band.y + interval.band.height
			)?.owner ?? null
		);
	}
	hasGeometry(owner: HTMLElement): boolean {
		const number = Number(owner.closest<HTMLElement>('.document-page')?.dataset.pageNumber);
		return !this.#allGeometryDirty && !this.#geometryDirty.has(number) &&
			Boolean(this.#pages.get(number)?.triggers.some((interval) => interval.owner === owner && interval.right > interval.left));
	}
	setHoveredAnnotationId(annotationId: string | null) {
		if (this.#hoveredAnnotationId === annotationId) return;
		this.#invalidateAnnotationPaint(this.#hoveredAnnotationId, annotationId);
		this.#hoveredAnnotationId = annotationId;
		this.#schedule();
	}
	setSelectedAnnotationId(annotationId: string | null) {
		if (this.#selectedAnnotationId === annotationId) return;
		this.#invalidateAnnotationPaint(this.#selectedAnnotationId, annotationId);
		this.#selectedAnnotationId = annotationId;
		this.#schedule();
	}
	#invalidateAnnotationPaint(previous: string | null, next: string | null) {
		// Memberships preserve selection across overlapping annotations and page boundaries.
		for (const [number, page] of this.#pages) {
			if (page.triggers.some(({ owner }) => owner && annotationMemberships(owner)
				.some(id => id === previous || id === next))) this.#paintDirty.add(number);
		}
	}
	subscribeGeometry(listener: (change: GeometryChange) => void) {
		this.#geometryListeners.add(listener);
		return () => {
			this.#geometryListeners.delete(listener);
		};
	}
	#notifyGeometry(change: GeometryChange) {
		for (const listener of this.#geometryListeners) listener(change);
	}
	invalidateLayout = () => {
		if (this.#destroyed) return;
		this.#allGeometryDirty = true;
		this.#notifyGeometry('invalidate');
		this.#schedule();
	};
	contentCommitted(changedPages?: readonly number[]) {
		if (this.#destroyed) return;
		const added = this.#observeContent();
		if (changedPages) {
			const mounted = new Set(
				[...this.#stage.querySelectorAll<HTMLElement>('.document-page')].map(page => Number(page.dataset.pageNumber))
			);
			this.#invalidatePages([...added, ...changedPages.filter(number => mounted.has(number))]);
		}
		else this.invalidateLayout();
	}
	#invalidatePages(pages: readonly number[]) {
		if (this.#destroyed || !pages.length) return;
		for (const number of pages) this.#geometryDirty.add(number);
		this.#notifyGeometry('invalidate');
		this.#schedule();
	}
	#contentChanged = (records: MutationRecord[]) => {
		const geometry = new Set<number>();
		for (const record of records) {
			const element = record.target instanceof Element ? record.target : record.target.parentElement;
			const page = element?.closest<HTMLElement>('.document-page');
			if (!page || (record.type === 'attributes' &&
				record.oldValue === element?.getAttribute(record.attributeName!))) continue;
			geometry.add(Number(page.dataset.pageNumber));
		}
		this.#invalidatePages([...geometry]);
	};
	#observeContent() {
		const contents = new Set(this.#stage.querySelectorAll('.document-page__content'));
		const removed = [...this.#observed].filter((content) => !contents.has(content));
		const addedPages: number[] = [];
		for (const content of removed) {
			this.#resize.unobserve(content);
			this.#observed.delete(content);
		}
		// MutationObserver cannot unobserve one target. Reconnect only when pages disappear.
		if (removed.length) {
			this.#contentChanged(this.#mutations.takeRecords());
			this.#mutations.disconnect();
			for (const [number, page] of this.#pages) if (!page.geometry.element.isConnected) {
				this.#pages.delete(number);
				this.#paintDirty.add(number);
			}
			this.#schedule();
		}
		for (const content of contents) {
			const added = !this.#observed.has(content);
			if (added) {
				this.#resize.observe(content);
				addedPages.push(Number((content as HTMLElement).closest<HTMLElement>('.document-page')?.dataset.pageNumber));
			}
			if (added || removed.length)
				this.#mutations.observe(content, {
					subtree: true,
					childList: true,
					characterData: true,
					attributes: true,
					attributeOldValue: true,
					attributeFilter: ['class', 'data-revision']
				});
			this.#observed.add(content);
		}
		return addedPages;
	}

	#ensureGeometry() {
		if (!this.#allGeometryDirty && !this.#geometryDirty.size) return false;
		if (this.#allGeometryDirty) {
			for (const page of this.#stage.querySelectorAll<HTMLElement>('.document-page')) this.#geometryDirty.add(Number(page.dataset.pageNumber));
			this.#allGeometryDirty = false;
		}
		const number = this.#geometryDirty.values().next().value;
		const processing = new Set<number>(number === undefined ? [] : [number]);
		const updated = buildLineMaps(this.#stage, processing);
		let changed = updated.length > 0;
		for (const [number, page] of this.#pages) {
			if (processing.has(number) || !page.geometry.element.isConnected) {
				this.#pages.delete(number);
				this.#paintDirty.add(number);
				changed = true;
			}
		}
		for (const geometry of updated) {
			this.#pages.set(geometry.number, {
				geometry,
				triggers: measureTriggers([geometry]),
				revisions: measureRevisions([geometry])
			});
			this.#paintDirty.add(geometry.number);
		}
		for (const number of processing) this.#geometryDirty.delete(number);
		return changed;
	}
	#schedule = () => {
		if (this.#destroyed || this.#frame !== undefined) return;
		this.#frame = requestAnimationFrame(() => {
			if (this.#ensureGeometry()) this.#notifyGeometry('measure');
			this.#frame = undefined;
			if (this.#paintDirty.size) {
				const publication = new Map(this.#publication);
				for (const number of this.#paintDirty) {
					const page = this.#pages.get(number);
					if (!page) {
						publication.delete(number);
						continue;
					}
					publication.set(number, resolveOverlaps(
						[
							...page.triggers,
							...page.revisions
						],
						this.#hoveredAnnotationId,
						this.#selectedAnnotationId
					));
				}
				this.#paintDirty.clear();
				this.#publication = publication;
				for (const listener of this.#listeners) listener(publication);
			}
			if (this.#geometryDirty.size) this.#schedule();
			else this.#stage.setAttribute('data-highlights-ready', '');
		});
	};
	destroy() {
		this.#destroyed = true;
		if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
		this.#resize.disconnect();
		this.#mutations.disconnect();
		this.#observed.clear();
		this.#listeners.clear();
		this.#geometryListeners.clear();
		this.#pages.clear();
		this.#publication = new Map();
		this.#hoveredAnnotationId = null;
		this.#selectedAnnotationId = null;
		this.#stage.removeAttribute('data-highlights-ready');
	}
}
