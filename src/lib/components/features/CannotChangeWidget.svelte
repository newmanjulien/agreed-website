<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import ContextPanelSurface from '$lib/demo/components/document/ContextPanelSurface.svelte';
	import FaqWidgetView from '$lib/demo/components/widgets/FaqWidgetView.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import NonNegotiableClausePreview from './cannot-change/NonNegotiableClausePreview.svelte';
	import FeatureDemoPanel from './demo/FeatureDemoPanel.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import type { AgreementFeaturePreviewContent } from './feature-preview-content';
	import { cannotChangeTour } from './cannot-change/cannot-change-tour';

	let { content }: { content: AgreementFeaturePreviewContent } = $props();

	let clause = $derived(content.clause);
	let definition = $derived(content.clause.widget);

	const objectionId = 'training-data';
	const playback = createGuidedTour(cannotChangeTour);
	const targets = new SvelteMap<string, Element>();
	let step = $derived(playback.step);
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();

	let panelOpen = $derived(step.state.view !== 'document');
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
	label="A red non-negotiable agreement term opens proven answers to common objections."
	panelFocused={panelOpen}
	bind:element={widgetElement}
	bind:sceneElement
>
	<NonNegotiableClausePreview {content} active={panelOpen} {registerTarget} />

	<FeatureDemoPanel visible={panelOpen}>
		<ContextPanelSurface label={clause.title} intro={definition.intro}>
			<FaqWidgetView
				widgetId="cannot-change-preview-faq"
				items={definition.items}
				openItemId={step.state.view === 'answer' ? objectionId : null}
				interactive={false}
				{registerTarget}
				itemTargets={{ [objectionId]: 'objection' }}
			/>
		</ContextPanelSurface>
	</FeatureDemoPanel>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
