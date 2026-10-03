import { tick } from 'svelte';
import { sourcePointBounds } from '../anchoring/dom-anchor';
import type { getDocumentViewport } from '../document-viewport';
import { PAGE_FORMAT } from '../pagination/page-format';
import { pageIndex, sourcePage, visiblePageNumbers } from './page-index';
import type { RenderSnapshot } from './types';

type Viewport = ReturnType<typeof getDocumentViewport>;
interface PageWindowInput {
	snapshot: () => RenderSnapshot | null;
	stage: () => HTMLElement | undefined;
	viewport: Viewport;
	interactive: () => boolean;
	beforeCommit: () => ((listener: () => void) => () => void) | undefined;
}
const pageNumber = (element: HTMLElement) =>
	Number(element.closest<HTMLElement>('.document-page')?.dataset.pageNumber) || undefined;

/** Viewport membership, temporary focus, and source anchors share one page-window lifetime. */
export class DocumentPageWindow {
	visible = $state.raw<number[]>([1, 2]);
	anchor = $state<number>();
	focus = $state<number>();
	#input: PageWindowInput;
	#schedule?: () => void;

	constructor(input: PageWindowInput) {
		this.#input = input;
		$effect(() => {
			const stage = input.stage(), element = input.viewport.element;
			if (!stage || !element) return;
			return this.#observe(stage, element);
		});
		$effect(() => {
			void input.snapshot();
			this.#schedule?.();
		});
		$effect(() => {
			const stage = input.stage(), element = input.viewport.element;
			const beforeCommit = input.beforeCommit();
			if (!stage || !element || !beforeCommit) return;
			let scrollVersion = 0;
			let active = true;
			const onScroll = () => { scrollVersion++; };
			element.addEventListener('scroll', onScroll, { passive: true });
			const unsubscribe = beforeCommit(() => {
				const version = scrollVersion;
				void this.#restoreAnchor(stage, () => active && scrollVersion === version);
			});
			return () => {
				active = false;
				unsubscribe();
				element.removeEventListener('scroll', onScroll);
			};
		});
	}
	update() {
		const stage = this.#input.stage();
		if (!stage) return;
		const { viewport } = this.#input;
		const bounds = stage.getBoundingClientRect(), metrics = viewport.metrics();
		const next = visiblePageNumbers(
			this.#input.snapshot()?.pages.length ?? 0,
			viewport.toLocalPixels(metrics.top - bounds.top),
			viewport.toLocalPixels(metrics.bottom - bounds.top),
			PAGE_FORMAT.height + PAGE_FORMAT.gap
		);
		if (next.join(',') !== this.visible.join(',')) this.visible = next;
	}
	#observe(stage: HTMLElement, element: HTMLElement) {
		let frame: number | undefined;
		const schedule = () => {
			if (frame !== undefined) return;
			frame = requestAnimationFrame(() => { frame = undefined; this.update(); });
		};
		this.#schedule = schedule;
		const observer = new ResizeObserver(schedule);
		observer.observe(element);
		const camera = stage.closest<HTMLElement>('[data-demo-stage]');
		if (camera) observer.observe(camera);
		element.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule, { passive: true });
		const focus = (event: FocusEvent) => { this.focus = pageNumber(event.target as HTMLElement); };
		const blur = (event: FocusEvent) => {
			if (!(event.relatedTarget instanceof Node) || !stage.contains(event.relatedTarget)) this.focus = undefined;
		};
		const keyboard = (event: KeyboardEvent) => { this.#tab(event, stage); };
		stage.addEventListener('focusin', focus);
		stage.addEventListener('focusout', blur);
		stage.addEventListener('keydown', keyboard);
		schedule();
		return () => {
			observer.disconnect();
			if (frame !== undefined) cancelAnimationFrame(frame);
			this.#schedule = undefined;
			element.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			stage.removeEventListener('focusin', focus);
			stage.removeEventListener('focusout', blur);
			stage.removeEventListener('keydown', keyboard);
		};
	}
	#tab(event: KeyboardEvent, stage: HTMLElement) {
		const snapshot = this.#input.snapshot();
		if (event.key !== 'Tab' || !this.#input.interactive() || !snapshot) return;
		const owner = (event.target as HTMLElement).closest<HTMLElement>('.playbook-trigger');
		if (!owner) return;
		const destinations = pageIndex(snapshot).annotations;
		const index = destinations.findIndex(destination => destination.id === owner.dataset.annotationId);
		if (index < 0) return;
		const destination = destinations[index + (event.shiftKey ? -1 : 1)];
		if (!destination) {
			// A restored continuation is programmatically focusable. Leave from the
			// stage boundary so Shift+Tab does not revisit its first wrapper.
			if (event.shiftKey) stage.focus({ preventScroll: true });
			return;
		}
		event.preventDefault();
		this.focus = destination.page;
		void tick().then(() => {
			if (!stage.isConnected || this.#input.snapshot() !== snapshot) return;
			const target = [...stage.querySelectorAll<HTMLElement>('.playbook-trigger[tabindex="0"]')]
				.find(target => pageNumber(target) === destination.page && target.dataset.annotationId === destination.id);
			if (!target) return;
			target.focus({ preventScroll: true });
			const { viewport } = this.#input;
			const bounds = target.getBoundingClientRect(), metrics = viewport.metrics();
			if (bounds.top < metrics.top) viewport.scrollBy(bounds.top - metrics.top);
			else if (bounds.bottom > metrics.bottom) viewport.scrollBy(bounds.bottom - metrics.bottom);
			this.update();
		});
	}
	async #restoreAnchor(stage: HTMLElement, current: () => boolean) {
		const { viewport } = this.#input;
		const metrics = viewport.metrics();
		let token: HTMLElement | undefined;
		for (const page of stage.querySelectorAll<HTMLElement>('[data-page-number]')) {
			const bounds = page.getBoundingClientRect();
			if (bounds.bottom <= metrics.top) continue;
			if (bounds.top >= metrics.bottom) break;
			for (const span of page.querySelectorAll<HTMLElement>('[data-source-start-key]:not([data-generated])')) {
				if (span.dataset.revision && span.dataset.revision !== 'removed') continue;
				const bounds = span.getBoundingClientRect();
				if (bounds.height && bounds.top >= metrics.top && bounds.top < metrics.bottom) {
					token = span;
					break;
				}
			}
			if (token) break;
		}
		if (!token?.dataset.sourceStartKey) return;
		const point = { sourceKey: token.dataset.sourceStartKey, offset: Number(token.dataset.sourceStartOffset ?? 0) };
		const preferredPage = pageNumber(token);
		const top = sourcePointBounds(stage, point, true, preferredPage)?.top;
		const scrollTop = viewport.scrollTop;
		const valid = () => current() && stage.isConnected && viewport.scrollTop === scrollTop;
		await tick();
		if (!valid() || top === undefined) return;
		const snapshot = this.#input.snapshot();
		this.anchor = snapshot ? sourcePage(snapshot, point, preferredPage) : undefined;
		try {
			await tick();
			if (!valid() || this.#input.snapshot() !== snapshot) return;
			const after = sourcePointBounds(stage, point, true, preferredPage)?.top;
			if (after !== undefined && Math.abs(after - top) > 0.5) viewport.scrollBy(after - top);
		} finally {
			this.anchor = undefined;
			this.update();
		}
	}
}
