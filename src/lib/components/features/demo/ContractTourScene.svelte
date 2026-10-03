<script lang="ts">
	import { untrack } from 'svelte';
	import { createContractContext, setContractContext } from '$lib/components/contract-demo/document/runtime/context';
	import { setDocumentViewport } from '$lib/components/contract-demo/document/document-viewport';
	import ContractViewer from '$lib/components/contract-demo/components/document/ContractViewer.svelte';
	import RepPlaybookPanel from '$lib/components/contract-demo/components/playbook/RepPlaybookPanel.svelte';
	import ContractActions from '$lib/components/contract-demo/components/playbook/ContractActions.svelte';
	import { demoContract } from '$lib/components/contract-demo/data/fixture';
	import { triggerAnnotationId } from '$lib/components/contract-demo/playbook/document-overlay';
	import type { ContractDemoScene, ContractSceneLayout, ContractTourState } from './contract-tour';

	let {
		scene,
		state: tourState,
		positioned,
		onLayout,
		onError,
		onRenderStateChange,
		viewportElement = $bindable()
	}: {
		scene: ContractDemoScene;
		state: ContractTourState;
		positioned: boolean;
		onLayout: (layout: ContractSceneLayout) => void;
		onError: (message: string) => void;
		onRenderStateChange: (ready: boolean) => void;
		viewportElement?: HTMLDivElement;
	} = $props();

	const { source, renderer } = setContractContext(untrack(() => createContractContext(demoContract)));
	let viewer = $state<ContractViewer>();
	const item = untrack(() => source.items.find((candidate) => candidate._id === scene.itemId)!);
	const trigger = untrack(() => scene.mode === 'clause'
		? item.triggers.find((candidate) => candidate.id === scene.triggerId)!
		: undefined);
	const annotationId = trigger ? triggerAnnotationId(item._id, trigger.id) : null;
	const panelOpen = $derived(scene.mode === 'clause' && (!positioned || tourState.panelOpen));
	const selection = $derived(tourState.concessionId ? { [item._id]: tourState.concessionId } : {});
	setDocumentViewport(() => viewportElement);

	function renderStateChanged(ready: boolean) {
		if (ready && scene.mode === 'actions') {
			const actions = viewportElement?.querySelector<HTMLElement>('[data-workspace-actions]');
			if (actions) onLayout({ mode: 'actions', actions });
			else onError('The contract actions could not be positioned.');
		}
		onRenderStateChange(ready);
	}

	export function retry() {
		viewer?.retry();
	}
</script>

<div class="h-full overflow-hidden" bind:this={viewportElement}>
	<div class="pt-6 pb-12">
		{#snippet panelContent()}
			<RepPlaybookPanel
				{item}
				open={tourState.openSection ?? null}
				selected={renderer.snapshot?.concessions[item._id]}
				onToggle={() => {}}
			/>
		{/snippet}
		{#snippet footerContent()}
			{#if scene.mode === 'actions'}
				<ContractActions />
			{/if}
		{/snippet}
		<ContractViewer
			bind:this={viewer}
			hasPanel={panelOpen}
			reservePanelSpace
			interactive={false}
			onSceneLayout={scene.mode === 'clause' ? (highlight, panel) => onLayout({ mode: 'clause', highlight, panel }) : undefined}
			onRenderStateChange={renderStateChanged}
			onSceneError={onError}
			hoveredAnnotationId={tourState.hovered ? annotationId : null}
			{panelContent}
			{footerContent}
			selectedAnnotationId={panelOpen ? annotationId : null}
			panelSource={trigger?.range.start}
			selectedConcessions={selection}
		/>
	</div>
</div>
