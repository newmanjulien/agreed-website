<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import ReviewScreen from '$lib/components/hero/requests-demo/ReviewScreen.svelte';
	import RequestDiscussionModal from '$lib/components/hero/requests-demo/RequestDiscussionModal.svelte';
	import FeatureDemoApp from './demo/FeatureDemoApp.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import { demoStartingPoints } from '$lib/components/hero/requests-demo/demo-points';
	import { discussionDemo, discussionRequest, discussionTour } from './discussion/discussion-tour';

	const playback = createGuidedTour(discussionTour);
	const targets = new SvelteMap<string, Element>();

	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();

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
	label="A sales rep opens How to discuss for a change that cannot be accepted, then expands a question to ask the buyer."
	bind:element={widgetElement}
	bind:sceneElement
>
	<FeatureDemoApp pointsLeft={demoStartingPoints}>
		<ReviewScreen
			compact
			{registerTarget}
			targetRequestId={discussionDemo.requestId}
			targetName="discuss"
		/>
		{#if step.state.panelOpen}
			<RequestDiscussionModal
				guide={discussionRequest.discussionGuide}
				onClose={() => {}}
				interactive={false}
				expandedQuestionId={step.state.questionOpen ? discussionDemo.questionId : undefined}
				{registerTarget}
				questionTargetName="question"
			/>
		{/if}
	</FeatureDemoApp>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
