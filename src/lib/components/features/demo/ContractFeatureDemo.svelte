<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { observeCameraSize } from '$lib/components/contract-demo/document/camera-size';
	import { CONTENT_MAX_WIDTH } from '$lib/components/ui/ContentMeasure.svelte';
	import GuidedCursor from './GuidedCursor.svelte';
	import ContractTourScene from './ContractTourScene.svelte';
	import { createGuidedTour } from './tour-player.svelte';
	import { contractCursorMoveDuration, type ContractDemoScene, type ContractSceneLayout, type ContractTourStep } from './contract-tour';
	import '$lib/components/contract-demo/styles/demo.css';

	let { name, scene, tour, label, fallback }: {
		name: string;
		scene: ContractDemoScene;
		tour: ReadonlyArray<ContractTourStep>;
		label: string;
		fallback: string;
	} = $props();

	// Preserve native document typography; scale only the shared camera.
	const STAGE_WIDTH = 1440;
	const CROP_PADDING = 24;
	const playback = createGuidedTour(untrack(() => tour));
	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let stageElement = $state<HTMLDivElement>();
	let viewportElement = $state<HTMLDivElement>();
	let sceneComponent = $state<ContractTourScene>();
	let originElement = $state<HTMLSpanElement>();
	let layout = $state<ContractSceneLayout>();
	let mounted = $state(false);
	let error = $state('');
	let positioned = $state(false);
	let renderReady = $state(false);
	let frameWidth = $state(0);
	let frameHeight = $state(0);
	let cropX = $state(0);
	let cropWidth = $state(STAGE_WIDTH);
	const scale = $derived(frameWidth > 0 ? frameWidth / cropWidth : 1);
	const cropHeight = $derived(frameHeight > 0 ? frameHeight / scale : 860);
	// Subtract the widget's two 1px borders from the shared content width.
	const widgetScale = $derived(Math.min(frameWidth / (CONTENT_MAX_WIDTH - 2), 1));
	const cursorHeight = $derived((scene.mode === 'actions' ? 24.3 : 22.68) * widgetScale);
	const clickRingSize = $derived(26 * widgetScale);
	const cursorDestination = $derived.by(() => {
		const target = step.cursor?.target;
		if (target === 'origin') return originElement;
		if (layout?.mode === 'actions') return target === 'approval' || target === 'send'
			? layout.actions.querySelector(`[data-contract-action="${target}"]`) ?? undefined
			: undefined;
		if (layout?.mode !== 'clause') return;
		if (target === 'highlight') return layout.highlight;
		if (target === 'apply' && scene.concessionId) return layout.panel.querySelector(`[data-concession-id="${CSS.escape(scene.concessionId)}"]`) ?? undefined;
		if (target) return layout.panel.querySelector(`[data-playbook-section="${target}"]`) ?? undefined;
	});

	function localBounds(element: Element) {
		const bounds = element.getBoundingClientRect();
		const stage = stageElement!.getBoundingClientRect();
		return {
			left: (bounds.left - stage.left) / scale,
			right: (bounds.right - stage.left) / scale,
			top: (bounds.top - stage.top) / scale,
			bottom: (bounds.bottom - stage.top) / scale
		};
	}

	function alignActions(actions: Element) {
		if (!viewportElement) return;
		viewportElement.scrollTop = Math.max(0, viewportElement.scrollTop + localBounds(actions).bottom - cropHeight + CROP_PADDING);
	}

	async function positionScene(next: ContractSceneLayout, cancelled: () => boolean) {
		if (!stageElement || !viewportElement) return;
		if (next.mode === 'actions') {
			const target = next.actions;
			const bounds = localBounds(target);
			// Keep the wider crop centered on the contract actions.
			cropWidth = (bounds.right - bounds.left + CROP_PADDING * 2) / 0.729;
			cropX = (bounds.left + bounds.right - cropWidth) / 2;
			await tick();
			if (cancelled() || !target.isConnected || !viewportElement) return;
			// Keep the real document footer in view without moving it into the document stage.
			alignActions(target);
			positioned = true;
			return;
		}
		const { highlight: target, panel } = next;
		const clauseBounds = localBounds(target);
		const explanation = localBounds(panel);
		cropX = Math.min(clauseBounds.left, explanation.left) - CROP_PADDING;
		cropWidth = Math.max(clauseBounds.right, explanation.right) - cropX + CROP_PADDING;
		await tick();
		if (cancelled() || !target.isConnected || !viewportElement) return;
		// Set the crop once so opening guidance and applying a concession keep the camera still.
		viewportElement.scrollTop = Math.max(0, viewportElement.scrollTop + clauseBounds.top - CROP_PADDING);
		positioned = true;
	}

	$effect(() => {
		const next = layout;
		if (!next || !frameWidth || positioned || error) return;
		let cancelled = false;
		untrack(() => void positionScene(next, () => cancelled));
		return () => { cancelled = true; };
	});

	$effect(() => {
		const next = layout;
		if (next?.mode !== 'actions' || !positioned || !viewportElement || error) return;
		// Anchor the footer to the bottom of the responsive camera.
		cropHeight;
		let cancelled = false;
		void tick().then(() => {
			if (!cancelled && next.actions.isConnected) alignActions(next.actions);
		});
		return () => { cancelled = true; };
	});

	$effect(() => {
		if (!widgetElement) return;
		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			mounted = true;
			observer.disconnect();
		}, { rootMargin: '600px' });
		observer.observe(widgetElement);
		return () => observer.disconnect();
	});

	$effect(() => {
		playback.setReady(positioned && renderReady && !error);
	});

	$effect(() => {
		if (!positioned || !widgetElement) return;
		return playback.start(widgetElement);
	});
</script>

<div class="relative h-[430px] overflow-hidden rounded-lg border border-[#ebebeb] bg-canvas/60 shadow-feature select-none" bind:this={widgetElement}>
	<div class="absolute inset-0 overflow-hidden" role="img" aria-label={label} aria-hidden={error ? true : undefined}>
		<div class={`oceans-demo contract-feature-demo relative h-full overflow-hidden font-sans text-left text-[16px] leading-[1.5] text-ink bg-canvas ${name}-demo`} aria-hidden="true" inert data-phase={step.phase} data-ready={positioned} use:observeCameraSize={(width, height) => { frameWidth = width; frameHeight = height; }}>
			{#if mounted}
				<div
					class={['absolute top-0 left-0 origin-top-left', positioned && !error ? 'opacity-100' : 'opacity-0']}
					data-demo-stage
					bind:this={stageElement}
					style:width={`${STAGE_WIDTH}px`}
					style:height={`${cropHeight}px`}
					style:--demo-viewport-height={`${cropHeight}px`}
					style:transform={`translateX(${-cropX * scale}px) scale(${scale})`}
				>
					<ContractTourScene
						bind:this={sceneComponent}
						{scene}
						{positioned}
						state={step.state}
						onLayout={(next) => { layout = next; error = ''; }}
						onError={(message) => { error = message; }}
						onRenderStateChange={(ready) => { renderReady = ready; }}
						bind:viewportElement
					/>
					<span class="absolute size-px" bind:this={originElement} style:left={`${cropX + 340}px`} style:top={`${Math.min(cropHeight - 55, 320)}px`}></span>
					<GuidedCursor
						container={stageElement}
						destination={cursorDestination}
						visible={positioned && step.cursor !== null}
						mode={step.cursor?.mode}
						phase={step.phase}
						moveDuration={contractCursorMoveDuration}
						cameraScale={scale}
						{cursorHeight}
						{clickRingSize}
					/>
				</div>
			{/if}
		</div>
	</div>
	{#if error}
		<div class="relative grid h-full place-content-center gap-3 p-8 text-center text-ink-muted" role="alert">
			<p>{fallback}</p>
			<button type="button" class="underline" onclick={() => {
				playback.reset();
				error = '';
				positioned = false;
				renderReady = false;
				layout = undefined;
				void tick().then(() => sceneComponent?.retry());
			}}>Retry demo</button>
		</div>
	{/if}
</div>

<style>
	@layer components {
		.contract-feature-demo :global(.panel-rail) { animation-duration: 180ms; }
		.contract-feature-demo[data-ready='false'] :global(.panel-rail) { animation: none; }
	}
	@layer utilities {
		.approval-demo:is([data-phase='hover-send'], [data-phase='click-send'], [data-phase='clicked']) :global([data-contract-action='send']:enabled) {
			border-color: var(--color-accent-hover);
			background-color: var(--color-accent-hover);
		}
		.approval-demo[data-phase='click-send'] :global([data-contract-action='send']:enabled) {
			transform: translateY(1px) scale(0.97);
		}
	}
</style>
