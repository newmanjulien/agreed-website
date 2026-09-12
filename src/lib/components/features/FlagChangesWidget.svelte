<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import ChangesPanelView from '$lib/demo/components/document/ChangesPanelView.svelte';
	import ChoiceSelectView from '$lib/demo/components/ui/ChoiceSelectView.svelte';
	import AgreementClausePreview from './flag-changes/AgreementClausePreview.svelte';
	import FeatureDemoFrame from './demo/FeatureDemoFrame.svelte';
	import GuidedCursor from './demo/GuidedCursor.svelte';
	import FeatureDemoPanel from './demo/FeatureDemoPanel.svelte';
	import { createGuidedTour } from './demo/tour-player.svelte';
	import type { GuidedCursorDestination } from './demo/tour-model';
	import type { FlagFeaturePreviewContent } from './feature-preview-content';
	import { flagChangesTour } from './flag-changes/flag-changes-tour';

	let { content }: { content: FlagFeaturePreviewContent } = $props();

	let clause = $derived(content.clause);
	let clauseDefinition = $derived(content.clause.widget);

	function requireOption(value: string) {
		const option = clauseDefinition.control.options.find((candidate) => candidate.value === value);
		if (!option) throw new Error(`Missing flag-changes tour option "${value}".`);
		return option;
	}

	let defaultOption = $derived(requireOption(clauseDefinition.control.defaultValue));
	let replacementOption = $derived(requireOption('ceo-coo'));
	let pickerOptions = $derived(clauseDefinition.control.options.map((option) => ({
		value: option.value,
		label: option.controlLabel
	})));
	const documentLabel = (option: typeof defaultOption) =>
		option.kind === 'custom' ? option.controlLabel : option.documentLabel;

	const playback = createGuidedTour(flagChangesTour);
	const targets = new SvelteMap<string, Element>();
	let step = $derived(playback.step);
	let renderedPanelValue = $state('');
	let widgetElement = $state<HTMLDivElement>();
	let sceneElement = $state<HTMLDivElement>();

	let activeOptionIndex = $derived(
		step.cursor?.target === 'replacement-option'
			? pickerOptions.findIndex((option) => option.value === replacementOption.value)
			: pickerOptions.findIndex((option) => option.value === defaultOption.value)
	);
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

	$effect(() => {
		if (step.state.panelOpen) {
			renderedPanelValue = step.state.selected
				? replacementOption.value
				: defaultOption.value;
		}
	});

	onMount(() => playback.start(widgetElement));
</script>

<FeatureDemoFrame
	label={`An agreement term opens a list of approved alternatives and changes from ${defaultOption.controlLabel} to ${replacementOption.controlLabel}.`}
	panelFocused={step.state.panelOpen}
	bind:element={widgetElement}
	bind:sceneElement
>
	<AgreementClausePreview
		{content}
		valueLabel={documentLabel(step.state.selected ? replacementOption : defaultOption)}
		selected={step.state.selected}
		panelOpen={step.state.panelOpen}
		{registerTarget}
	/>

	<FeatureDemoPanel visible={step.state.panelOpen}>
		<ChangesPanelView
			label={clause.title}
			prompt={clauseDefinition.prompt}
			appliedMessage={clauseDefinition.appliedMessage}
			showApplied={step.state.selected}
		>
			{#snippet control()}
				<ChoiceSelectView
					id="flag-changes-preview-select"
					value={renderedPanelValue}
					options={pickerOptions}
					open={step.state.menuOpen}
					interactive={false}
					activeIndex={activeOptionIndex}
					{registerTarget}
					triggerTarget="select-trigger"
					optionTargets={{ [replacementOption.value]: 'replacement-option' }}
				/>
			{/snippet}
		</ChangesPanelView>
	</FeatureDemoPanel>

	<GuidedCursor
		container={sceneElement}
		destination={cursorDestination}
		visible={step.cursor !== null}
		mode={step.cursor?.mode}
	/>
</FeatureDemoFrame>
