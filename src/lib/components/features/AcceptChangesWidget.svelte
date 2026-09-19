<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import FeatureDemoApp from './demo/FeatureDemoApp.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import ReviewRequestsPreview from './demo/ReviewRequestsPreview.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import {
		acceptChangesTour,
		acceptDemo,
		acceptPointsLeft,
		acceptRequest
	} from './accept/accept-changes-tour';

	const playback = createGuidedTour(acceptChangesTour);
	const targets = new SvelteMap<string, Element>();

	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();
	let pointsLeft = $derived(acceptPointsLeft(step.state.accepted));

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
	label="A sales rep accepts a buyer change that costs {acceptRequest.points} points, and the remaining points drop from {acceptDemo.startingPoints} to {acceptPointsLeft(true)}."
	bind:element={widgetElement}
	bind:sceneElement
>
	<FeatureDemoApp {pointsLeft}>
		<ReviewRequestsPreview
			acceptedRequestId={step.state.accepted ? acceptDemo.requestId : undefined}
			{registerTarget}
			targetRequestId={acceptDemo.requestId}
			targetName="accept"
		/>
	</FeatureDemoApp>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
