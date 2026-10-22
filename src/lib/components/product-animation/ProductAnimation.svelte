<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import data from './data/contract.json';
	import ContractDocument from './ContractDocument.svelte';
	import GuidancePanel from './GuidancePanel.svelte';
	import ContractActions from './ContractActions.svelte';
	import GuidedCursor from './GuidedCursor.svelte';
	import { createGuidedTour } from './tour-player.svelte';
	import { createSceneGeometry, validateTour, type CursorFrame } from './scene-geometry';
	import type { AnimationStep, PreparedContract } from './model';
	import './animation.css';

	let { tour, label, framing = 'feature', loop = false, completedStep }: {
		tour: readonly AnimationStep[]; label: string; framing?: 'hero' | 'feature'; loop?: boolean; completedStep?: AnimationStep;
	} = $props();
	const contract = data as PreparedContract;
	untrack(() => validateTour(completedStep ? [...tour, completedStep] : tour, contract));
	const playback = createGuidedTour(untrack(() => tour), untrack(() => ({ loop, completedStep })));
	playback.setReady(false);
	const step = $derived(playback.step);
	const snapshot = $derived(contract.states[step.state.contract]);
	const panel = $derived(contract.panels.find((panel) => panel.id === (step.state.box?.clause ?? step.state.clause))!);
	let frameElement: HTMLDivElement;
	let stageElement: HTMLDivElement;
	let viewportElement: HTMLDivElement;
	let columnElement: HTMLDivElement;
	let railElement: HTMLDivElement;
	let mobile = $state(false);
	let cursor = $state.raw<CursorFrame>({ x: 0, y: 0, opacity: 0, ringOpacity: 0, ringScale: .45, scale: 1 });
	let geometry = $state.raw<ReturnType<typeof createSceneGeometry>>();
	const panelVisible = $derived(Boolean(step.state.box) && !(mobile && step.state.viewport === 'revision'));
	const documentState = $derived({ ...step.state, box: panelVisible ? step.state.box : undefined });
	$effect(() => {
		const beat = step, reduced = playback.reducedMotion, coordinator = geometry;
		if (coordinator) untrack(() => void coordinator.prepare(beat, reduced));
	});
	onMount(() => {
		const coordinator = createSceneGeometry({ frame: frameElement, stage: stageElement, viewport: viewportElement, column: columnElement, rail: railElement }, contract, framing, playback,
			(nextMobile, nextCursor) => { mobile = nextMobile; cursor = nextCursor; });
		geometry = coordinator;
		const unsubscribe = playback.onFrame(coordinator.apply);
		const stop = playback.start(frameElement);
		return () => { unsubscribe(); coordinator.destroy(); stop(); };
	});
</script>

<div class="product-animation" class:is-mobile={mobile} bind:this={frameElement} role="img" aria-label={label}>
	<div class="animation-content" aria-hidden="true" inert>
		<div class="animation-stage" bind:this={stageElement} data-phase={step.phase}>
			<div class="document-viewport" bind:this={viewportElement}>
				<div class="document-column" bind:this={columnElement} style:transform={framing === 'hero' ? 'translateX(232px)' : undefined}>
					<ContractDocument {contract} state={documentState} />
					<ContractActions approvalCount={snapshot.approvalCount} highlighted={step.cursor?.target.kind === 'approval'} />
				</div>
				<div class="panel-rail" bind:this={railElement}>
					{#key panel.id}<GuidancePanel {panel} openSection={step.state.box?.section} selected={snapshot.concessions[panel.id]} />{/key}
				</div>
			</div>
			<GuidedCursor {cursor} />
		</div>
	</div>
</div>

<style>
	.product-animation { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5; color: var(--color-ink); background: var(--color-canvas); text-align: left; user-select: none; }
	.animation-content { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
	.animation-stage { position: absolute; left: 0; top: 0; width: 1440px; height: 860px; transform-origin: top left; }
	.document-viewport { position: absolute; inset: 0; overflow: hidden; overflow-anchor: none; }
	.document-column { width: 816px; margin-left: 80px; padding: 24px 0; }
	.panel-rail { position: absolute; left: 920px; width: 440px; visibility: hidden; opacity: 0; }
	.is-mobile .document-column { width: calc(100% - 24px); margin-left: 12px; }
	.is-mobile .panel-rail { left: 24px; width: calc(100% - 48px); }
</style>
