<script lang="ts">
	import { tick, untrack, onDestroy, type Snippet } from 'svelte';
	import type { SourcePoint, ConcessionSelection } from '../../playbook/model';
	import { getContractContext } from '../../document/runtime/context';
	import { activeConflicts } from '../../playbook/selection-conflicts';
	import { contractMeasurement } from '../../document/runtime/measurement.svelte';
	import DocumentPresentation from './DocumentPresentation.svelte';
	let {
		hasPanel = false,
		reservePanelSpace = false,
		interactive = true,
		hoveredAnnotationId,
		onSceneLayout,
		onRenderStateChange,
		onSceneError,
		panelContent,
		footerContent,
		selectedConcessions,
		onRemoveConcession,
		onRestoreConcessions,
		selectedAnnotationId = null,
		panelSource,
		onSelect
	}: {
		hasPanel?: boolean;
		reservePanelSpace?: boolean;
		interactive?: boolean;
		hoveredAnnotationId?: string | null;
		onSceneLayout?: (target: HTMLElement, panel: HTMLElement) => void;
		onRenderStateChange?: (ready: boolean) => void;
		onSceneError?: (message: string) => void;
		panelContent: Snippet;
		footerContent?: Snippet;
		selectedConcessions: ConcessionSelection;
		onRemoveConcession?: (itemId: string) => void;
		onRestoreConcessions?: () => void;
		selectedAnnotationId?: string | null;
		panelSource?: SourcePoint;
		onSelect?: (itemId: string, annotationId: string) => boolean | void;
	} = $props();
	const { source, renderer, viewer } = getContractContext();
	const pages = $derived(renderer.snapshot?.pages ?? []);
	const requestedModel = $derived.by(() => {
		try {
			return {
				conflicts: activeConflicts(
					source.renderSource.sourceIndex,
					source.renderSource.items,
					selectedConcessions
				),
				error: null
			};
		} catch (cause) {
			return {
				conflicts: [],
				error: { message: 'We couldn’t validate the requested contract.', cause }
			};
		}
	});
	const hasActiveConflicts = $derived(requestedModel.conflicts.length > 0);
	const profiler = $derived(contractMeasurement.profiler);
	const renderError = $derived(contractMeasurement.error ?? renderer.error);
	const current = $derived(
		Boolean(
			profiler &&
			!requestedModel.error &&
			renderer.isCurrent({
				source: source.renderSource,
				concessions: selectedConcessions,
				profiler
			}) &&
			!renderer.pending &&
			!renderError &&
			!hasActiveConflicts
		)
	);
	$effect(() => {
		if (renderError) onSceneError?.(renderError.message);
	});
	$effect(() => {
		const notify = onRenderStateChange;
		const snapshot = renderer.snapshot;
		if (!notify) return;
		if (!current || !snapshot) {
			notify(false);
			return;
		}
		let cancelled = false;
		void tick().then(() => {
			if (!cancelled && current && renderer.snapshot === snapshot) notify(true);
		});
		return () => { cancelled = true; };
	});
	export function retry() {
		if (contractMeasurement.error) {
			contractMeasurement.retry?.();
			return;
		}
		if (requestedModel.error) {
			renderer.fail(requestedModel.error);
			return;
		}
		if (profiler && !hasActiveConflicts)
			renderer.request({
				source: source.renderSource,
				concessions: selectedConcessions,
				profiler
			});
	}
	function restoreDisplayedVersion() {
		onRestoreConcessions?.();
		renderer.cancelPending();
	}
	$effect(() => {
		const layoutProfiler = profiler,
			model = source.renderSource,
			selection = selectedConcessions,
			blocked = hasActiveConflicts,
			error = requestedModel.error;
		untrack(() => {
			if (error) {
				renderer.fail(error);
				return;
			}
			if (!layoutProfiler || blocked) {
				renderer.cancelPending();
				return;
			}
			if (
				renderer.isCurrent({
					source: model,
					concessions: selection,
					profiler: layoutProfiler
				})
			) {
				renderer.cancelPending();
				return;
			}
			renderer.request({
				source: model,
				concessions: selection,
				profiler: layoutProfiler
			});
		});
	});
	onDestroy(() => renderer.destroy());
</script>
{#if interactive && (hasActiveConflicts || renderError)}
	<!-- Feedback overlays the viewport without moving the displayed contract. -->
	<div class="pointer-events-none sticky top-4 z-10 h-0 px-4">
		<div class="mx-auto flex max-w-xl flex-col gap-4">
			{#if hasActiveConflicts}
				<div role="alert" data-contract-feedback class="pointer-events-auto rounded border border-line bg-surface p-3">
					These applied concessions conflict with current contract changes. Remove an alternative to
					continue.
					{#each requestedModel.conflicts as conflict}
						{@const item = source.items.find((item) => item._id === conflict.itemId)}
						{@const concession = item?.concessions.find(
							(concession) => concession.id === conflict.concession.id
						)}
						{#if onRemoveConcession}
							<button class="ml-2 underline" onclick={() => onRemoveConcession?.(conflict.itemId)}>
								Remove “{concession?.description ?? conflict.concession.id}”{item?.instructions?.summary
									? ` — ${item.instructions.summary}`
									: ''}
							</button>
						{/if}
					{/each}
				</div>
			{/if}
			{#if renderError}
				<div class="pointer-events-auto rounded border border-danger bg-danger-surface p-3 text-ink" role="alert" data-contract-feedback>
					<p>{pages.length ? 'We couldn’t apply these changes. The contract below shows the last rendered version.' : 'We couldn’t display this contract.'}</p>
					<button type="button" class="mr-3 underline" onclick={retry}>Retry</button>
					{#if pages.length && onRestoreConcessions}
						<button type="button" class="underline" onclick={restoreDisplayedVersion}>Restore displayed version</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
<DocumentPresentation snapshot={renderer.snapshot} {viewer} {current} beforeCommit={listener => renderer.beforeCommit(listener)} {hasPanel} {reservePanelSpace} {interactive} {hoveredAnnotationId} {onSceneLayout} {onSceneError} {panelContent} {footerContent} {selectedAnnotationId} {panelSource} {onSelect} />
