<script lang="ts">
	import { untrack } from 'svelte';
	import {
		createContractContext,
		setContractContext
	} from '$lib/components/contract-demo/document/runtime/context';
	import type { ContractSourceInput } from '$lib/components/contract-demo/document/runtime/source';
	import { conflictsForConcession } from '$lib/components/contract-demo/playbook/selection-conflicts';
	import ContractViewer from '$lib/components/contract-demo/components/document/ContractViewer.svelte';
	import { setDocumentViewport } from '$lib/components/contract-demo/document/document-viewport';
	import RepPlaybookPanel from '$lib/components/contract-demo/components/playbook/RepPlaybookPanel.svelte';
	import ContractActions from '$lib/components/contract-demo/components/playbook/ContractActions.svelte';
	import { triggerAnnotationId } from '$lib/components/contract-demo/playbook/document-overlay';
	import type { ConcessionSelection } from '$lib/components/contract-demo/playbook/model';
	let { data }: { data: ContractSourceInput } = $props();
	const { source, renderer, viewer } = setContractContext(untrack(() => createContractContext(data)));
	let selectedConcessions = $state.raw<ConcessionSelection>({});
	const appliedConcessions: ConcessionSelection = $derived(renderer.snapshot?.concessions ?? {});
	let scrollElement = $state<HTMLDivElement>();
	const viewport = setDocumentViewport(() => scrollElement);
	const initialItem = source.items.find((candidate) => candidate._id === 'demo:resale');
	const initialTrigger = initialItem?.triggers[0];
	let selectedItemId = $state<string | null>(initialItem?._id ?? null),
		selectedAnnotationId = $state<string | null>(
			initialItem && initialTrigger ? triggerAnnotationId(initialItem._id, initialTrigger.id) : null
		);
	let initialViewPositioned = false;
	function positionInitialView(_target: HTMLElement, panel: HTMLElement) {
		if (initialViewPositioned || !scrollElement) return;
		initialViewPositioned = true;
		const panelBounds = panel.getBoundingClientRect();
		const viewportBounds = scrollElement.getBoundingClientRect();
		const scrollTop = scrollElement.scrollTop + viewport.toLocalPixels(
			(panelBounds.top + panelBounds.bottom - viewportBounds.top - viewportBounds.bottom) / 2
		);
		// Tall mobile viewports need extra space above the document to center the box.
		scrollElement.style.setProperty('--initial-top-space', `${Math.max(0, -scrollTop)}px`);
		scrollElement.scrollTop = Math.max(0, scrollTop);
	}
	const item = $derived(source.items.find((i) => i._id === selectedItemId));
	const reasons = $derived.by(() => {
		if (!item) return {};
		try {
			return Object.fromEntries(
				item.concessions.map((c) => {
					const blocked = conflictsForConcession(
						source.renderSource.sourceIndex,
						source.renderSource.items,
						appliedConcessions,
						item._id,
						c.id
					);
					const descriptions = blocked.map(({ itemId, concession }) => {
						const owner = source.items.find((candidate) => candidate._id === itemId);
						return `“${owner?.concessions.find((choice) => choice.id === concession.id)?.description ?? 'another concession'}”`;
					});
					return [c.id, blocked.length ? `Remove ${descriptions.join(' and ')} first.` : ''];
				})
			);
		} catch {
			return Object.fromEntries(
				item.concessions.map((c) => [c.id, 'Contract source is unavailable.'])
			);
		}
	});
	function toggle(id: string) {
		if (!item || !renderer.snapshot || renderer.pending !== null) return;
		if (appliedConcessions[item._id] !== id && reasons[id]) return;
		const next = { ...appliedConcessions };
		if (next[item._id] === id) delete next[item._id];
		else next[item._id] = id;
		selectedConcessions = next;
	}
	function removeConcession(itemId: string) {
		const next = { ...selectedConcessions };
		delete next[itemId];
		selectedConcessions = next;
	}
	function close(restoreFocus = true) {
		initialViewPositioned = true;
		if (restoreFocus) viewer.restoreAnnotationFocus?.();
		selectedItemId = null;
		selectedAnnotationId = null;
	}
	function dismissOutsidePanel(event: PointerEvent) {
		if (!item || event.defaultPrevented || event.button !== 0) return;
		if (event.composedPath().some((node) => node instanceof Element && node.matches('[data-workspace-panel], [data-annotation-id], [data-contract-feedback], [data-workspace-actions]'))) return;
		close(false);
	}
	function localDismissal(element: HTMLDivElement) {
		const events = new AbortController();
		element.addEventListener('pointerdown', dismissOutsidePanel, { signal: events.signal });
		element.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && item) {
				event.preventDefault();
				event.stopPropagation();
				close();
			}
		}, { signal: events.signal });
		return { destroy: () => events.abort() };
	}
</script>

<div class="demo-workspace h-full overflow-hidden" role="region" aria-label="Interactive Oceans contract demo" use:localDismissal>
	<!-- Keyboard focus lets visitors scroll this embedded document independently. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div class="h-full overflow-auto overscroll-contain [overflow-anchor:none] [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent" data-demo-viewport bind:this={scrollElement} tabindex="0" role="region" aria-label="Scrollable contract">
		<main class="pt-[calc(1.5rem+var(--initial-top-space,0px))] pb-12" aria-label="Contract document">
			{#snippet panelContent()}
				{#if item}
					<RepPlaybookPanel
						{item}
						selected={appliedConcessions[item._id]}
						disabled={!renderer.snapshot || renderer.pending !== null}
						conflicts={reasons}
						onToggle={toggle}
					/>
				{/if}
			{/snippet}
			{#snippet footerContent()}
				<ContractActions />
			{/snippet}
			<ContractViewer
				hasPanel={Boolean(item)}
				onSceneLayout={positionInitialView}
				{panelContent}
				{footerContent}
				{selectedAnnotationId}
				{selectedConcessions}
				onRemoveConcession={removeConcession}
				onRestoreConcessions={() => {
					if (renderer.snapshot) selectedConcessions = renderer.snapshot.concessions;
				}}
				panelSource={item?.triggers[0]?.range.start}
				onSelect={(id, trigger) => {
					initialViewPositioned = true;
					selectedItemId = id;
					selectedAnnotationId = trigger;
				}}
			/>
		</main>
	</div>
</div>
