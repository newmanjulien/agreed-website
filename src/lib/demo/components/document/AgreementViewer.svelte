<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { AgreementSession } from '$lib/demo/document/agreement-session.svelte';
	import type { AnnotationSession } from '$lib/demo/document/annotations/annotation-session.svelte';
	import type { AnnotationKind, TextAnchor } from '$lib/demo/document/annotations/types';
	import type { DiscussionSession } from '$lib/demo/document/discussions/discussion-session.svelte';
	import type {
		DiscussionRoot,
		DiscussionTarget,
		DiscussionThreadAction
	} from '$lib/demo/document/discussions/types';
	import { getDocumentViewportMetrics } from '$lib/demo/document/document-viewport';
	import { createPageMeasurement } from '$lib/demo/document/pagination/measure';
	import { PAGE_FORMAT } from '$lib/demo/document/pagination/page-format';
	import { paginateDocument } from '$lib/demo/document/pagination/paginate';
	import type { PageLayout } from '$lib/demo/document/pagination/types';
	import type { ResolvedAgreementDocument } from '$lib/demo/document/resolve-agreement';
	import type { CompiledAgreement } from '$lib/demo/document/agreement-model';
	import type { AgreementDocument } from '$lib/demo/document/types';
	import { CLAUSE_REFERENCE_DURATION_MS } from '$lib/demo/document/clause-reference';
	import '$lib/demo/styles/document.css';
	import DocumentPage from './DocumentPage.svelte';
	import AgreementWorkspaceLayout from './AgreementWorkspaceLayout.svelte';
	import LoadingPagination from './LoadingPagination.svelte';
	import MeasureSurface from './MeasureSurface.svelte';
	import ClausePanelRenderer from './ClausePanelRenderer.svelte';
	import DocumentSelectionActions from './DocumentSelectionActions.svelte';
	import AnnotationRail from './AnnotationRail.svelte';
	import AnnotationHighlightFallback from './AnnotationHighlightFallback.svelte';

	let {
		agreement,
		session,
		annotations,
		discussion,
		documentStageElement = $bindable()
	}: {
		agreement: CompiledAgreement;
		session: AgreementSession;
		annotations: AnnotationSession;
		discussion: DiscussionSession;
		documentStageElement?: HTMLDivElement;
	} = $props();
	type PaginationStatus = 'loading' | 'ready' | 'error';
	const DESKTOP_WORKSPACE = {
		minWidth: 900,
		sideGutter: 20,
		panelGap: 18,
		panelMinWidth: 262.8,
		panelMaxWidth: 328.5
	} as const;
	const SIDE_PANEL_RESERVE =
		DESKTOP_WORKSPACE.sideGutter * 2 +
		DESKTOP_WORKSPACE.panelGap +
		DESKTOP_WORKSPACE.panelMinWidth;
	const NARROW_VIEWPORT_GUTTER = 30;
	let paginationStatus = $state<PaginationStatus>('loading');
	let pages = $state<PageLayout[]>([]);
	let selectedClauseId = $state<string | null>('data-ownership');
	let selectedClauseFragmentKey = $state<string | null>(null);
	let panelTop = $state(0);
	let measurementElement = $state<HTMLDivElement>();
	let shellElement = $state<HTMLDivElement>();
	let viewportElement = $state<HTMLDivElement>();
	let contextPanelElement = $state<HTMLElement>();
	let annotationRailBottom = $state(0);
	let pageScale = $state(1);
	let viewportWidth = $state(0);
	let clauseUpdateError = $state('');
	let referencedClauseId = $state<string | null>(null);
	let clauseReferenceTimer: ReturnType<typeof setTimeout> | undefined;
	let paginationRunId = 0;
	let mounted = $state(false);

	let displayWidth = $derived(PAGE_FORMAT.width * pageScale);
	let logicalStackHeight = $derived(
		pages.length * PAGE_FORMAT.height + Math.max(0, pages.length - 1) * PAGE_FORMAT.gap
	);
	let displayHeight = $derived(logicalStackHeight * pageScale);
	let workspaceHeight = $derived(Math.max(displayHeight, annotationRailBottom));
	let currentControlValues = $derived(session.currentControlValues(agreement.clauses));
	let hasAnnotationPanel = $derived(
		selectedClauseId === null &&
			(annotations.creationRanges.length > 0 ||
				annotations.resolvedAnnotations.length > 0 ||
				Object.keys(session.clauseProposals).length > 0)
	);
	let contextPanelKind: 'clause' | 'annotation' | null = $derived(
		selectedClauseId ? 'clause' : hasAnnotationPanel ? 'annotation' : null
	);
	let isDesktopViewport = $derived(viewportWidth >= DESKTOP_WORKSPACE.minWidth);

	function documentHasClause(document: AgreementDocument, clauseId: string): boolean {
		return document.blocks.some(
			(block) =>
				block.type === 'paragraph' &&
				block.content.some((node) => node.type === 'clause' && node.id === clauseId)
		);
	}

	function updateScale() {
		if (!viewportElement) return;
		viewportWidth = viewportElement.clientWidth;
		const isDesktop = viewportWidth >= DESKTOP_WORKSPACE.minWidth;
		const reservedWidth = isDesktop ? SIDE_PANEL_RESERVE : NARROW_VIEWPORT_GUTTER;
		const availableWidth = Math.max(280, viewportWidth - reservedWidth);
		pageScale = Math.min(1, availableWidth / PAGE_FORMAT.width);
	}

	function findClauseFragment(
		clauseId: string,
		preferredFragmentKey?: string | null
	): HTMLElement | undefined {
		if (!documentStageElement) return undefined;
		const fragments = Array.from(
			documentStageElement.querySelectorAll<HTMLElement>('[data-clause-fragment-key]')
		);
		return (
			fragments.find(
				(fragment) => fragment.dataset.clauseFragmentKey === preferredFragmentKey
			) ?? fragments.find((fragment) => fragment.dataset.clauseId === clauseId)
		);
	}

	function selectedClauseFragment(): HTMLElement | undefined {
		return selectedClauseId
			? findClauseFragment(selectedClauseId, selectedClauseFragmentKey)
			: undefined;
	}

	function updateContextPanelPosition() {
		if (!documentStageElement) return;

		const stageTop = documentStageElement.getBoundingClientRect().top;
		if (selectedClauseId) {
			const fragment = selectedClauseFragment();
			if (!fragment) return;
			panelTop = fragment.getBoundingClientRect().top - stageTop;
			selectedClauseFragmentKey =
				fragment.dataset.clauseFragmentKey ?? selectedClauseFragmentKey;
			return;
		}

		panelTop = 0;
	}

	function ensureSelectedClauseVisible() {
		const fragment = selectedClauseFragment();
		if (
			!fragment ||
			!contextPanelElement ||
			!viewportElement ||
			isDesktopViewport
		) {
			return;
		}

		const fragmentBounds = fragment.getBoundingClientRect();
		const panelBounds = contextPanelElement.getBoundingClientRect();
		const viewport = getDocumentViewportMetrics(viewportElement);
		const availableBottom = panelBounds.top - viewport.gap;
		const availableTop = viewport.top;

		if (fragmentBounds.bottom > availableBottom) {
			viewportElement.scrollBy({ top: fragmentBounds.bottom - availableBottom });
		} else if (fragmentBounds.top < availableTop) {
			viewportElement.scrollBy({ top: fragmentBounds.top - availableTop });
		}
	}

	async function positionOverlaysAfterRender() {
		await tick();
		annotations.refresh();
		await tick();
		updateContextPanelPosition();
		ensureSelectedClauseVisible();
	}

	function selectClause(clauseId: string, fragmentKey: string) {
		if (session.clauseProposal(clauseId)) {
			activateDiscussion({ kind: 'clause-proposal', id: clauseId });
			return;
		}

		clearSelection();
		clearClauseReference();
		dismissAnnotationComposer();
		discussion.cancel();
		clauseUpdateError = '';
		selectedClauseId = clauseId;
		selectedClauseFragmentKey = fragmentKey;
	}

	function startAnnotation(selection: { kind: AnnotationKind; anchor: TextAnchor }) {
		clearSelection();
		clearClauseReference();
		discussion.cancel();
		annotations.startAnnotationCreation(selection.kind, selection.anchor);
	}

	function handleDocumentClick(event: MouseEvent) {
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed) return;
		if (
			event.target instanceof Element &&
			event.target.closest('a, button, input, select, textarea, [role="button"]')
		) {
			return;
		}

		const annotationId = annotations.annotationIdAtPoint(event.clientX, event.clientY);
		if (!annotationId) return;

		event.preventDefault();
		event.stopPropagation();
		activateDiscussion({ kind: 'annotation', id: annotationId });
	}

	function dismissAnnotationComposer() {
		annotations.cancelComposer();
	}

	function submitAnnotationComposer() {
		annotations.submitComposer();
	}

	function prepareDiscussionActivation() {
		clearSelection();
		clearClauseReference();
		dismissAnnotationComposer();
		discussion.cancel();
	}

	function activateDiscussion(target: DiscussionTarget) {
		prepareDiscussionActivation();
		discussion.startReply(target);
	}

	function discussionRoot(target: DiscussionTarget): DiscussionRoot | undefined {
		return target.kind === 'annotation'
			? annotations.annotations.find((annotation) => annotation.id === target.id)
			: session.clauseProposal(target.id);
	}

	function addDiscussionReply(target: DiscussionTarget, text: string): boolean {
		return target.kind === 'annotation'
			? annotations.addReply(target.id, text)
			: session.addClauseProposalReply(target.id, text);
	}

	function updateDiscussionReply(
		target: DiscussionTarget,
		replyId: string,
		text: string
	): boolean {
		return target.kind === 'annotation'
			? annotations.editReply(target.id, replyId, text)
			: session.editClauseProposalReply(target.id, replyId, text);
	}

	function removeDiscussionReply(target: DiscussionTarget, replyId: string): boolean {
		return target.kind === 'annotation'
			? annotations.deleteReply(target.id, replyId)
			: session.deleteClauseProposalReply(target.id, replyId);
	}

	function editDiscussionRoot(target: DiscussionTarget) {
		prepareDiscussionActivation();
		const message = discussionRoot(target);
		if (message) discussion.startRootEdit(target, message);
	}

	function deleteDiscussionReply(target: DiscussionTarget, replyId: string) {
		if (discussion.isTargetBusy(target)) return;
		discussion.beginInteraction(target);
		if (!removeDiscussionReply(target, replyId)) return;
		discussion.cancelReplyEdit(target, replyId);
		discussion.contentMutated(target);
	}

	async function deleteDiscussionRoot(target: DiscussionTarget) {
		const isAnnotation = target.kind === 'annotation';
		const deleted = await discussion.runRootDeletion(
			target,
			() =>
				isAnnotation
					? annotations.deleteAnnotation(target.id)
					: deleteClauseProposal(target.id),
			isAnnotation
				? 'That message could not be deleted. Please try again.'
				: 'That change could not be laid out. The previous value was kept.'
		);

		if (deleted) {
			discussion.cancelTarget(target);
		}
	}

	async function submitDiscussion() {
		const composer = discussion.composer;
		const text = composer?.text.trim();
		if (
			!composer ||
			!text ||
			discussion.isTargetBusy(composer.target) ||
			!discussion.beginSubmission(composer.id)
		) {
			return;
		}

		let saved = false;
		let failureMessage = 'That message could not be saved. Please try again.';
		try {
			switch (composer.mode) {
				case 'reply':
					saved = addDiscussionReply(composer.target, text);
					break;
				case 'edit-root':
					if (composer.target.kind === 'annotation') {
						saved = annotations.editAnnotation(composer.target.id, text);
						break;
					}
					const change = session.prepareClauseProposalRootEdit(
						agreement.document,
						agreement.clauses,
						composer.target.id,
						text
					);
					if (change) {
						failureMessage = 'That change could not be laid out. The previous value was kept.';
						if (await applyPagination(change.document, false)) {
							session.commit(change);
							saved = true;
						}
					}
					break;
				case 'edit-reply':
					saved = updateDiscussionReply(composer.target, composer.replyId, text);
					break;
			}
		} catch (error) {
			console.error('Discussion submission failed.', error);
		}

		if (saved) {
			discussion.contentMutated(composer.target);
			discussion.completeSubmission(composer.id);
		} else {
			discussion.failSubmission(composer.id, failureMessage);
		}
	}

	function handleDiscussionAction(
		target: DiscussionTarget,
		action: DiscussionThreadAction
	) {
		switch (action.type) {
			case 'activate':
				activateDiscussion(target);
				break;
			case 'edit-root':
				editDiscussionRoot(target);
				break;
			case 'delete-root':
				void deleteDiscussionRoot(target);
				break;
			case 'edit-reply':
				prepareDiscussionActivation();
				discussion.startReplyEdit(target, action.reply);
				break;
			case 'delete-reply':
				deleteDiscussionReply(target, action.replyId);
				break;
			case 'text-change':
				discussion.updateText(action.text);
				break;
			case 'cancel':
				discussion.cancel();
				break;
			case 'submit':
				void submitDiscussion();
				break;
		}
	}

	function clearSelection(restoreFocus = false) {
		const focusTarget = restoreFocus ? selectedClauseFragment() : undefined;
		selectedClauseId = null;
		selectedClauseFragmentKey = null;
		clauseUpdateError = '';

		if (focusTarget) {
			void tick().then(() => focusTarget.focus({ preventScroll: true }));
		}
	}

	function clearClauseReference() {
		if (clauseReferenceTimer) clearTimeout(clauseReferenceTimer);
		clauseReferenceTimer = undefined;
		referencedClauseId = null;
	}

	async function navigateToClauseReference(clauseId: string) {
		clearSelection();
		clearClauseReference();
		await tick();
		referencedClauseId = clauseId;
		await tick();

		const fragment = findClauseFragment(clauseId);
		if (!fragment) {
			clearClauseReference();
			return;
		}

		fragment.focus({ preventScroll: true });
		if (!viewportElement) return;
		const viewport = getDocumentViewportMetrics(viewportElement);
		const fragmentBounds = fragment.getBoundingClientRect();
		const targetCenter = (viewport.top + viewport.bottom) / 2;
		viewportElement.scrollBy({
			top: (fragmentBounds.top + fragmentBounds.bottom) / 2 - targetCenter,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'auto'
				: 'smooth'
		});

		clauseReferenceTimer = setTimeout(() => {
			referencedClauseId = null;
			clauseReferenceTimer = undefined;
		}, CLAUSE_REFERENCE_DURATION_MS);
	}

	$effect(() => {
		const element = contextPanelElement;
		if (!element || typeof ResizeObserver === 'undefined') return;

		const observer = new ResizeObserver(() => ensureSelectedClauseVisible());
		observer.observe(element);

		return () => observer.disconnect();
	});

	$effect(() => {
		const target = documentStageElement;
		untrack(() => annotations.setTarget(target));
		if (!target) return;

		target.addEventListener('click', handleDocumentClick, true);
		return () => target.removeEventListener('click', handleDocumentClick, true);
	});

	$effect(() => {
		const clauseId = selectedClauseId;
		const annotationPanelVisible = hasAnnotationPanel;
		if (!mounted) return;
		untrack(() => {
			updateScale();
			if (clauseId || annotationPanelVisible) void positionOverlaysAfterRender();
		});
	});

	$effect(() => {
		const currentAgreement = agreement.document;
		const currentClauses = agreement.clauses;
		const currentSession = session;
		if (!mounted) return;

		untrack(() => {
			if (selectedClauseId && !documentHasClause(currentAgreement, selectedClauseId)) clearSelection();
			if (referencedClauseId && !documentHasClause(currentAgreement, referencedClauseId)) {
				clearClauseReference();
			}
			void applyPagination(
				currentSession.snapshot(currentAgreement, currentClauses),
				true
			);
		});
	});

	async function applyPagination(
		snapshot: ResolvedAgreementDocument,
		showLoading: boolean
	): Promise<boolean> {
		const runId = ++paginationRunId;

		try {
			if (showLoading) {
				paginationStatus = 'loading';
				await tick();
			}

			if (!measurementElement) throw new Error('The measurement surface is unavailable.');

			const measurement = createPageMeasurement(measurementElement);
			const nextPages = paginateDocument(snapshot, measurement);
			if (runId !== paginationRunId) return false;

			pages = nextPages;
			paginationStatus = 'ready';
			void positionOverlaysAfterRender();
			return true;
		} catch (error) {
			if (runId !== paginationRunId) return false;
			console.error('Agreement pagination failed.', error);
			if (showLoading) paginationStatus = 'error';
			return false;
		}
	}

	async function updateClauseControlValue(
		clauseId: string,
		controlId: string,
		value: string
	): Promise<boolean> {
		clauseUpdateError = '';
		if (currentControlValues[clauseId]?.[controlId] === value) return true;
		const change = session.prepareControlChange(
			agreement.document,
			agreement.clauses,
			clauseId,
			controlId,
			value
		);
		if (!change) return false;
		if (!(await applyPagination(change.document, false))) {
			clauseUpdateError = 'That change could not be laid out. The previous value was kept.';
			return false;
		}
		session.commit(change);
		return true;
	}

	async function submitClauseProposal(
		clauseId: string,
		optionValue: string,
		text: string
	): Promise<boolean> {
		clauseUpdateError = '';
		const change = session.prepareClauseProposal(
			agreement.document,
			agreement.clauses,
			clauseId,
			optionValue,
			text
		);
		if (!change) return false;
		if (!(await applyPagination(change.document, false))) return false;
		session.commit(change);
		selectedClauseId = null;
		selectedClauseFragmentKey = null;
		return true;
	}

	async function deleteClauseProposal(clauseId: string): Promise<boolean> {
		const change = session.prepareClauseProposalDeletion(
			agreement.document,
			agreement.clauses,
			clauseId
		);
		if (!change || !(await applyPagination(change.document, false))) return false;
		session.commit(change);
		return true;
	}

	onMount(() => {
		const viewport = viewportElement;
		const shell = shellElement;
		if (!viewport || !shell) return;

		function handleResize() {
			updateScale();
			void positionOverlaysAfterRender();
		}

		function handlePointerDown(event: PointerEvent) {
			const eventPath = event.composedPath();
			const isInsideContextPanel = eventPath.some(
				(node) => node instanceof HTMLElement && node.hasAttribute('data-context-panel')
			);

			if (annotations.composer) {
				if (!isInsideContextPanel) dismissAnnotationComposer();
				return;
			}

			if (discussion.composer) {
				if (!isInsideContextPanel) discussion.cancel();
				return;
			}

			if (!selectedClauseId) return;
			const isInteractive = eventPath.some(
				(node) =>
					node instanceof HTMLElement &&
						(Boolean(node.dataset.clauseId) || node.hasAttribute('data-context-panel'))
			);
			if (!isInteractive) clearSelection();
		}

		function handleKeydown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			if (annotations.composer) {
				dismissAnnotationComposer();
				return;
			}
			if (discussion.composer) {
				discussion.cancel();
				return;
			}
			clearSelection(true);
			clearClauseReference();
		}

		updateScale();
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(viewport);
		shell.addEventListener('pointerdown', handlePointerDown);
		shell.addEventListener('keydown', handleKeydown);
		mounted = true;

		return () => {
			mounted = false;
			paginationRunId += 1;
			if (clauseReferenceTimer) {
				clearTimeout(clauseReferenceTimer);
				clauseReferenceTimer = undefined;
			}
			resizeObserver.disconnect();
			shell.removeEventListener('pointerdown', handlePointerDown);
			shell.removeEventListener('keydown', handleKeydown);
			discussion.cancel();
			annotations.destroy();
		};
	});
</script>

{#snippet documentContent()}
	<div
		class="page-viewport relative shrink-0"
		style:width={`${displayWidth}px`}
		style:height={`${displayHeight}px`}
	>
		<div
			class="page-stack absolute top-0 left-0 flex w-(--agreement-page-width) origin-top-left flex-col gap-(--agreement-page-gap)"
			style:transform={`scale(${pageScale})`}
		>
			{#each pages as page}
				<DocumentPage
					{page}
					totalPages={pages.length}
					clauses={agreement.clauses}
					{selectedClauseId}
					{referencedClauseId}
					onClauseSelect={selectClause}
				/>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet contextPanelContent()}
	{#if selectedClauseId}
		{@const clause = agreement.clauses[selectedClauseId]}
		<ClausePanelRenderer
			clauseId={selectedClauseId}
			{clause}
			{currentControlValues}
			errorMessage={clauseUpdateError}
			onDismiss={() => clearSelection(true)}
			onControlValueChange={updateClauseControlValue}
			onProposalSubmit={submitClauseProposal}
			onClauseReference={navigateToClauseReference}
			bind:element={contextPanelElement}
		/>
	{:else if hasAnnotationPanel}
		<AnnotationRail
			session={annotations}
			{discussion}
			clauseProposals={session.clauseProposals}
			{documentStageElement}
			viewport={viewportElement!}
			onCancelComposer={dismissAnnotationComposer}
			onSubmitComposer={submitAnnotationComposer}
			onDiscussionAction={handleDiscussionAction}
			bind:bottom={annotationRailBottom}
		/>
	{/if}
{/snippet}

{#snippet documentOverlayContent()}
	<AnnotationHighlightFallback session={annotations} container={documentStageElement} />
{/snippet}

<div bind:this={shellElement} class="demo-viewer-shell relative h-full overflow-hidden">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -- this is an independently scrollable document -->
	<div
		bind:this={viewportElement}
		class="demo-scrollport h-full overflow-auto pt-6 pb-12 max-[650px]:pt-3.5 max-[650px]:pb-8"
		tabindex="0"
		role="document"
		aria-label="Agreement document"
		aria-busy={paginationStatus === 'loading'}
	>
		<MeasureSurface bind:element={measurementElement} />

		{#if paginationStatus === 'loading'}
			<LoadingPagination />
		{:else if paginationStatus === 'error'}
			<div
				class="flex min-h-full flex-col items-center justify-center gap-1.5 text-center text-demo-ink-secondary"
				role="alert"
			>
				<strong>We couldn’t display this agreement.</strong>
				<span class="text-demo-ink-muted">Please refresh to try again.</span>
			</div>
		{:else}
			<div
				class="viewer-root relative w-full"
				data-pagination-status="ready"
				data-page-count={pages.length}
				style:--agreement-page-width={`${PAGE_FORMAT.width}px`}
				style:--agreement-page-height={`${PAGE_FORMAT.height}px`}
				style:--agreement-page-horizontal-padding={`${PAGE_FORMAT.horizontalPadding}px`}
				style:--agreement-page-top-padding={`${PAGE_FORMAT.topPadding}px`}
				style:--agreement-first-page-top-padding={`${PAGE_FORMAT.firstTopPadding}px`}
				style:--agreement-page-bottom-padding={`${PAGE_FORMAT.bottomPadding}px`}
				style:--agreement-content-width={`${PAGE_FORMAT.contentWidth}px`}
				style:--agreement-page-gap={`${PAGE_FORMAT.gap}px`}
			>
				<AgreementWorkspaceLayout
					contextPanelKind={isDesktopViewport ? contextPanelKind : null}
					displayedPageWidth={displayWidth}
					documentHeight={displayHeight}
					{workspaceHeight}
					{panelTop}
					sideGutter={DESKTOP_WORKSPACE.sideGutter}
					panelGap={DESKTOP_WORKSPACE.panelGap}
					panelMinWidth={DESKTOP_WORKSPACE.panelMinWidth}
					panelMaxWidth={DESKTOP_WORKSPACE.panelMaxWidth}
					bind:documentStageElement
					{documentContent}
					{documentOverlayContent}
					{contextPanelContent}
				/>
			</div>
		{/if}
	</div>

	{#if paginationStatus === 'ready' && !isDesktopViewport && contextPanelKind}
		<div class="mobile-panel-layer">
			<div class="mobile-panel-anchor">
				{@render contextPanelContent()}
			</div>
		</div>
	{/if}

	{#if paginationStatus === 'ready'}
		<DocumentSelectionActions
			container={documentStageElement!}
			viewport={viewportElement!}
			positioningContainer={shellElement!}
			eventRoot={shellElement!}
			onSelect={startAnnotation}
		/>
	{/if}
</div>

<style>
	.demo-viewer-shell {
		container-type: inline-size;
	}

	.demo-scrollport {
		overscroll-behavior: contain;
	}

	.mobile-panel-layer {
		position: absolute;
		inset: 0;
		z-index: 30;
		overflow: hidden;
		pointer-events: none;
	}

	.mobile-panel-anchor {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		animation: sheet-in 140ms ease both;
	}

	.mobile-panel-anchor :global([data-context-panel]) {
		pointer-events: auto;
	}

	@keyframes sheet-in {
		from {
			transform: translateY(16px);
		}
		to {
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mobile-panel-anchor {
			animation: none;
		}
	}
</style>
