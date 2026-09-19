<script lang="ts">
	import { onMount } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { SvelteMap } from 'svelte/reactivity';
	import FeatureDemoApp from './demo/FeatureDemoApp.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import UploadDropzonePreview from './upload/UploadDropzonePreview.svelte';
	import UploadFilePreview from './upload/UploadFilePreview.svelte';
	import UploadProcessingPreview from './upload/UploadProcessingPreview.svelte';
	import { uploadChangesTour, uploadProcessingTasks } from './upload/upload-changes-tour';

	const playback = createGuidedTour(uploadChangesTour);
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

	const attachOrigin: Attachment = (node) => {
		registerTarget('origin', node);
		return () => registerTarget('origin', null);
	};

	onMount(() => playback.start(widgetElement));
</script>

<FeatureDemoFrame
	label="A screenshot, Gong recording, or redlined contract is dragged onto the upload field, then Agreed reviews the buyer’s requested changes."
	bind:element={widgetElement}
	bind:sceneElement
>
	<FeatureDemoApp wide>
		{#if step.state.screen === 'upload'}
			<UploadDropzonePreview
				highlighted={step.state.hover}
				{registerTarget}
				dropzoneTarget="dropzone"
			/>
		{:else}
			<UploadProcessingPreview
				tasks={uploadProcessingTasks(step.state.kind)}
				activeTask={step.state.activeTask}
				completed={step.state.completed}
			/>
		{/if}
	</FeatureDemoApp>

	<span class="upload-origin" {@attach attachOrigin}></span>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	>
		{#if step.state.file === 'held'}
			<UploadFilePreview kind={step.state.kind} />
		{/if}
	</GuidedCursor>
</FeatureDemoFrame>

<style>
	.upload-origin {
		position: absolute;
		left: 16%;
		bottom: -26px;
		width: 1px;
		height: 1px;
	}
</style>
