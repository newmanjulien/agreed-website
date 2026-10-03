<script lang="ts">
	import {
		annotationOccurrence,
		annotationAnchorBounds,
		resolveAnnotationAnchor,
		type AnnotationActivation,
		type AnnotationOccurrence
	} from '$lib/components/contract-demo/document/annotation-anchor';
	import { tick, untrack, onMount, onDestroy, type Snippet } from 'svelte';
	import type { SourcePoint } from '$lib/components/contract-demo/playbook/model';
	import type { RenderSnapshot } from '$lib/components/contract-demo/document/runtime/types';
	import { sourcePointBounds } from '$lib/components/contract-demo/document/anchoring/dom-anchor';
	import {
		DocumentHighlightController,
		EMPTY_HIGHLIGHTS,
		type PageHighlights
	} from '$lib/components/contract-demo/document/highlights/controller';
	import { DocumentClauseInteractions } from '$lib/components/contract-demo/document/highlights/interactions';
	import { getDocumentViewport } from '$lib/components/contract-demo/document/document-viewport';
	import { PAGE_FORMAT } from '$lib/components/contract-demo/document/pagination/page-format';
	import type { InlineToken } from '$lib/components/contract-demo/document/pagination/types';
	import { ContractViewerState } from '../../document/runtime/viewer.svelte';
	import { annotationPage, pageIndex } from '../../document/runtime/page-index';
	import { DocumentPageWindow } from '../../document/runtime/page-window.svelte';
	import DocumentPage from './DocumentPage.svelte';
	import LoadingPagination from './LoadingPagination.svelte';
	import ContractWorkspaceLayout from './ContractWorkspaceLayout.svelte';
	let {
		hasPanel = false,
		reservePanelSpace = false,
		interactive = true,
		hoveredAnnotationId,
		onSceneLayout,
		onSceneError,
		panelContent,
		footerContent,
		selectedAnnotationId = null,
		panelSource,
		onSelect,
		snapshot,
		viewer,
		current = true,
		beforeCommit
	}: {
		hasPanel?: boolean;
		reservePanelSpace?: boolean;
		interactive?: boolean;
		hoveredAnnotationId?: string | null;
		onSceneLayout?: (target: HTMLElement, panel: HTMLElement) => void;
		onSceneError?: (message: string) => void;
		panelContent: Snippet;
		footerContent?: Snippet;
		selectedAnnotationId?: string | null;
		panelSource?: SourcePoint;
		onSelect?: (itemId: string, annotationId: string) => boolean | void;
		snapshot: RenderSnapshot | null;
		viewer: ContractViewerState;
		current?: boolean;
		beforeCommit?: (listener: () => void) => () => void;
	} = $props();
	const viewport = getDocumentViewport();
	const displayComplete = $derived(Boolean(snapshot));
	let highlights = $state<DocumentHighlightController>();
	let clauseInteractions = $state<DocumentClauseInteractions>();
	let highlightRects = $state.raw<PageHighlights>(new Map());
	let geometryVersion = $state(0);
	$effect(() => {
		const stage = viewer.documentStageElement;
		if (!stage || !displayComplete) return;
		const controller = new DocumentHighlightController(stage);
		highlights = controller;
		const unsubscribeGeometry = controller.subscribeGeometry((change) => {
			if (change === 'measure') geometryVersion += 1;
		});
		const unsubscribe = controller.subscribe((rects) => {
			highlightRects = rects;
		});
		return () => {
			unsubscribe();
			unsubscribeGeometry();
			controller.destroy();
			highlights = undefined;
			highlightRects = new Map();
		};
	});
	$effect(() => {
		const stage = viewer.documentStageElement;
		const controller = highlights;
		if (!interactive || !stage || !controller) return;
		const interactions = new DocumentClauseInteractions(stage, controller, selectAnnotation);
		clauseInteractions = interactions;
		return () => {
			interactions.destroy();
			clauseInteractions = undefined;
		};
	});
	$effect(() => {
		// Noninteractive scenes drive hover explicitly; the app owns pointer hover.
		if (!highlights || interactive) return;
		highlights.setHoveredAnnotationId(hoveredAnnotationId ?? null);
	});
	$effect(() => {
		highlights?.setSelectedAnnotationId(selectedAnnotationId);
	});
	let lastGeometrySnapshot: RenderSnapshot | null = null;
	$effect(() => {
		const root = viewer.documentStageElement,
			commit = snapshot,
			controller = highlights;
		if (!root || !controller) return;
		void mountedPages;
		controller.contentCommitted(commit !== lastGeometrySnapshot ? commit?.changedPages : []);
		lastGeometrySnapshot = commit;
	});
	const pages = $derived(snapshot?.pages ?? []);
	const tabStops = $derived(snapshot ? pageIndex(snapshot).tabStops : new Set<InlineToken>());
	let selectedOccurrence = $state.raw<AnnotationOccurrence | null>(null);
	const occurrence = $derived(selectedOccurrence?.annotationId === selectedAnnotationId ? selectedOccurrence : null);
	const pageWindow = new DocumentPageWindow({
		snapshot: () => snapshot,
		stage: () => viewer.documentStageElement,
		viewport,
		interactive: () => interactive,
		beforeCommit: () => beforeCommit
	});
	const panelPage = $derived(snapshot && hasPanel
		? annotationPage(snapshot, selectedAnnotationId, occurrence, panelSource)
		: undefined);
	const mountedPages = $derived(pages.filter(page =>
		pageWindow.visible.includes(page.number) || page.number === panelPage ||
		page.number === pageWindow.anchor || page.number === pageWindow.focus));

	const canOpenPlaybookItems = $derived(current && interactive);
	$effect(() => {
		clauseInteractions?.setEnabled(canOpenPlaybookItems);
	});
	let panelTop = $state(0);
	let panelElement = $state<HTMLDivElement>();
	const displayHeight = $derived(
		pages.length * PAGE_FORMAT.height + Math.max(0, pages.length - 1) * PAGE_FORMAT.gap
	);
	function annotationAnchor() {
		const root = viewer.documentStageElement,
			index = snapshot?.source.sourceIndex;
		if (!root || !index) return;
		return resolveAnnotationAnchor(
			root,
			index,
			selectedAnnotationId,
			occurrence,
			panelSource
		);
	}
	function restoreAnnotationFocus() {
		const anchor = canOpenPlaybookItems ? annotationAnchor() : undefined;
		const target = anchor?.owner ?? viewer.documentStageElement;
		target?.focus({ preventScroll: true });
	}
	async function positionPanel(cancelled: () => boolean) {
		await tick();
		if (cancelled() || !viewer.documentStageElement || !hasPanel) return;
		const anchor = annotationAnchor();
		const bounds =
			(anchor ? annotationAnchorBounds(anchor) : null) ??
			(panelSource ? sourcePointBounds(viewer.documentStageElement, panelSource, true) : null);
		const stageTop = viewer.documentStageElement.getBoundingClientRect().top;
		panelTop = Math.max(
			0,
			viewport.toLocalPixels((bounds?.top ?? viewport.metrics().top) - stageTop)
		);
		if (!onSceneLayout || !current || !geometryVersion) return;
		await tick();
		if (cancelled() || !current) return;
		if (!anchor || !panelElement || !highlights?.hasGeometry(anchor.owner)) {
			// A newly mounted page may still be waiting for its geometry slice.
			if (anchor && panelElement) return;
			onSceneError?.('The contract explanation could not be positioned.');
			return;
		}
		onSceneLayout(anchor.owner, panelElement);
	}
	function selectAnnotation(
		itemId: string,
		annotationId: string,
		activation: AnnotationActivation
	) {
		if (!canOpenPlaybookItems) return;
		if (onSelect?.(itemId, annotationId) === false) return;
		selectedOccurrence = annotationOccurrence(annotationId, activation);
	}
	$effect(() => {
		const selected = selectedAnnotationId,
			open = hasPanel;
		untrack(() => {
			if (!open || selectedOccurrence?.annotationId !== selected) selectedOccurrence = null;
		});
	});
	$effect(() => {
		void snapshot?.id;
		void selectedAnnotationId;
		void selectedOccurrence;
		void panelSource;
		void hasPanel;
		void geometryVersion;
		void current;
		void panelElement;
		let cancelled = false;
		void positionPanel(() => cancelled);
		return () => { cancelled = true; };
	});
	onMount(() => {
		viewer.restoreAnnotationFocus = restoreAnnotationFocus;
	});
	onDestroy(() => {
		viewer.documentStageElement = undefined;
		viewer.restoreAnnotationFocus = undefined;
	});
</script>

{#if !pages.length}
	<LoadingPagination />
{:else}
	<div
		class="viewer-root w-full"
		data-document-commit={snapshot?.id}
		data-page-count={pages.length}
		style:--contract-page-width={`${PAGE_FORMAT.width}px`}
		style:--contract-page-height={`${PAGE_FORMAT.height}px`}
		style:--contract-page-horizontal-padding={`${PAGE_FORMAT.horizontalPadding}px`}
		style:--contract-page-top-padding={`${PAGE_FORMAT.topPadding}px`}
		style:--contract-first-page-top-padding={`${PAGE_FORMAT.firstTopPadding}px`}
		style:--contract-page-bottom-padding={`${PAGE_FORMAT.bottomPadding}px`}
		style:--contract-content-width={`${PAGE_FORMAT.contentWidth}px`}
		style:--contract-page-gap={`${PAGE_FORMAT.gap}px`}
	>
		{#snippet documentContent()}
			<div class="relative" style:height={`${displayHeight}px`}>
				{#each mountedPages as page (page.number)}
					<div class="absolute left-0 right-0" style:top={`${(page.number - 1) * (PAGE_FORMAT.height + PAGE_FORMAT.gap)}px`}>
					<DocumentPage
						{page}
						highlights={highlightRects.get(page.number) ?? EMPTY_HIGHLIGHTS}
						{selectedAnnotationId}
						{canOpenPlaybookItems}
						{tabStops}
						onAnnotationSelect={selectAnnotation}
					/>
					</div>
				{/each}
			</div>
		{/snippet}
		<ContractWorkspaceLayout
			{hasPanel}
			{reservePanelSpace}
			pageWidth={PAGE_FORMAT.width}
			documentHeight={displayHeight}
			{panelTop}
			bind:documentStageElement={viewer.documentStageElement}
			bind:panelElement
			{documentContent}
			{panelContent}
			{footerContent}
		/>
	</div>
{/if}
