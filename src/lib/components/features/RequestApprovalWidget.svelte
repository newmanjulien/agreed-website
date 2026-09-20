<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import FeatureDemoApp from './demo/FeatureDemoApp.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import ReviewRequestsPreview from './demo/ReviewRequestsPreview.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import ApprovalBagPreview from './approval/ApprovalBagPreview.svelte';
	import { approvalDemo, approvalTour, approvalTypedText } from './approval/approval-tour';

	const playback = createGuidedTour(approvalTour);
	const targets = new SvelteMap<string, Element>();

	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();
	let typedProgress = $derived(step.trackProgress ? playback.progress : step.state.typedProgress);
	let explanation = $derived(approvalTypedText(typedProgress));

	let cursorDestination = $derived.by<GuidedCursorDestination | undefined>(() => {
		const target = step.cursor?.target;
		if (!target) return;
		const element = targets.get(target);
		return element ? { kind: 'element', element } : undefined;
	});

	function registerTarget(name: string, element: Element | null) {
		if (element) targets.set(name, element);
		else targets.delete(name);
	}

	onMount(() => playback.start(widgetElement));
</script>

<FeatureDemoFrame
	label="A sales rep adds a buyer change that needs approval and types why the buyer asked for it."
	bind:element={widgetElement}
	bind:sceneElement
>
	<FeatureDemoApp>
		{#if step.state.screen === 'review'}
			<ReviewRequestsPreview
				{registerTarget}
				targetRequestId={approvalDemo.requestId}
				targetName="add"
			/>
		{:else}
			<ApprovalBagPreview text={explanation} />
		{/if}
	</FeatureDemoApp>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
