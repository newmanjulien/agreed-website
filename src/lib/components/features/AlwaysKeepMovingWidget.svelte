<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import ContextPanelSurface from '$lib/demo/components/document/ContextPanelSurface.svelte';
	import MessageComposerView from '$lib/demo/components/document/MessageComposerView.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import CommentClausePreview from './comments/CommentClausePreview.svelte';
	import CommentThreadPreview from './comments/CommentThreadPreview.svelte';
	import FeatureDemoPanel from './demo/FeatureDemoPanel.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination, ScenePoint } from './demo/tour-model';
	import { commentsTour, commentSelectionTiming } from './comments/comments-tour';
	import type { CommentsFeaturePreviewContent } from './feature-preview-content';

	let { content }: { content: CommentsFeaturePreviewContent } = $props();

	const commentText = 'Could we use a shared version instead?';
	const playback = createGuidedTour(commentsTour);
	const targets = new SvelteMap<string, Element>();

	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();
	let submitElement = $state<HTMLButtonElement>();
	let cursorPoint = $state<ScenePoint>();

	let view = $derived(step.state.view);
	let selectionPhase = $derived(step.state.selection);
	let selectionProgress = $derived(
		selectionPhase === 'dragging' ? playback.progress : selectionPhase === 'complete' ? 1 : 0
	);
	let cursorDestination = $derived.by<GuidedCursorDestination | undefined>(() => {
		const target = step.cursor?.target;
		if (target === 'selection') {
			return cursorPoint ? { kind: 'point', point: cursorPoint } : undefined;
		}
		if (target === 'submit') {
			return submitElement ? { kind: 'element', element: submitElement } : undefined;
		}
		if (!target) return;
		const element = targets.get(target);
		return element ? { kind: 'element', element } : undefined;
	});
	let composerOpen = $derived(view === 'composer-empty' || view === 'composer-filled');
	let panelOpen = $derived(composerOpen || view === 'submitted');

	function registerTarget(name: string, element: Element | null) {
		if (element) targets.set(name, element);
		else targets.delete(name);
	}

	onMount(() => playback.start(widgetElement));
</script>

<FeatureDemoFrame
	label="A customer highlights a security term and creates a comment for a sales representative."
	panelFocused={panelOpen}
	bind:element={widgetElement}
	bind:sceneElement
>
	<CommentClausePreview
		{content}
		{selectionPhase}
		{selectionProgress}
		wrapTransitionProgress={commentSelectionTiming.wrap / commentSelectionTiming.drag}
		{sceneElement}
		bind:cursorPoint
		actionsOpen={view === 'selection'}
		{registerTarget}
	/>

	<FeatureDemoPanel visible={panelOpen}>
		{#if composerOpen}
			<ContextPanelSurface label="Add comment" responsiveMode="annotation" compact>
				<MessageComposerView
					title="Add comment"
					placeholder="Write a comment…"
					submitLabel="Comment"
					text={view === 'composer-filled' ? commentText : ''}
					interactive={false}
					bind:submitElement
				/>
			</ContextPanelSurface>
		{:else if view === 'submitted'}
			<CommentThreadPreview text={commentText} />
		{/if}
	</FeatureDemoPanel>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
