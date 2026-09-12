<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChangesWidgetDefinition } from '$lib/demo/document/agreement-model';
	import ChoiceSelect from '$lib/demo/components/ui/ChoiceSelect.svelte';
	import ChangesPanelView from './ChangesPanelView.svelte';
	import ContextPanelSurface from './ContextPanelSurface.svelte';
	import MessageComposer from './MessageComposer.svelte';

	let {
		clauseId,
		title,
		definition,
		value,
		errorMessage,
		onDismiss,
		onChange,
		onProposalSubmit,
		element = $bindable()
	}: {
		clauseId: string;
		title: string;
		definition: ChangesWidgetDefinition;
		value: string;
		errorMessage: string;
		onDismiss: () => void;
		onChange: (value: string) => Promise<boolean>;
		onProposalSubmit: (optionValue: string, text: string) => Promise<boolean>;
		element?: HTMLElement;
	} = $props();

	type PanelMode = 'picker' | 'composer';

	let pending = $state(false);
	let selectedValue = $state<string>();
	let proposalDraft = $state('');
	let proposalError = $state('');
	let mode = $state<PanelMode>('picker');
	let selectElement = $state<HTMLButtonElement>();
	let widgetId = $derived(`clause-widget-${clauseId}`);
	let promptId = $derived(`${widgetId}-prompt`);
	let appliedMessageId = $derived(`${widgetId}-applied`);
	let errorMessageId = $derived(`${widgetId}-error`);
	let controlId = $derived(`${widgetId}-${definition.control.id}-control`);
	let displayedValue = $derived(selectedValue ?? value);
	let customOption = $derived(
		definition.control.options.find((option) => option.kind === 'custom')
	);
	let isApplied = $derived(value !== definition.control.defaultValue);
	let describedBy = $derived(
		[
			promptId,
			isApplied ? appliedMessageId : null,
			errorMessage ? errorMessageId : null
		]
			.filter(Boolean)
			.join(' ')
	);

	async function handleChange(nextValue: string) {
		if (pending) return;
		selectedValue = nextValue;
		proposalDraft = '';
		proposalError = '';
		const nextOption = definition.control.options.find((option) => option.value === nextValue);
		if (nextOption?.kind === 'custom') {
			selectedValue = undefined;
			mode = 'composer';
			return;
		}

		pending = true;
		try {
			selectedValue = (await onChange(nextValue)) ? undefined : value;
		} finally {
			pending = false;
		}
	}

	function cancelProposal() {
		proposalDraft = '';
		proposalError = '';
		selectedValue = undefined;
		mode = 'picker';
		void tick().then(() => selectElement?.focus({ preventScroll: true }));
	}

	function handleDismiss() {
		if (mode === 'composer') {
			cancelProposal();
			return;
		}
		onDismiss();
	}

	async function submitProposal() {
		if (pending || !customOption || !proposalDraft.trim()) return;
		proposalError = '';
		pending = true;
		try {
			if (await onProposalSubmit(customOption.value, proposalDraft)) {
				proposalDraft = '';
				selectedValue = undefined;
			} else {
				proposalError = 'That change could not be laid out. The previous value was kept.';
			}
		} catch (error) {
			console.error('Clause proposal submission failed.', error);
			proposalError = 'That change could not be laid out. The previous value was kept.';
		} finally {
			pending = false;
		}
	}

	onMount(() => {
		void tick().then(() => selectElement?.focus({ preventScroll: true }));
	});
</script>

{#if mode === 'picker'}
	<ChangesPanelView
		label={title}
		prompt={definition.prompt}
		{promptId}
		appliedMessage={definition.appliedMessage}
		{appliedMessageId}
		showApplied={isApplied}
		{errorMessage}
		{errorMessageId}
		onDismiss={handleDismiss}
		bind:element
	>
		{#snippet control()}
			<label class="sr-only" for={controlId}>{definition.control.label}</label>
			<ChoiceSelect
				id={controlId}
				value={displayedValue}
				options={definition.control.options.map((option) => ({
					value: option.value,
					label: option.controlLabel
				}))}
				disabled={pending}
				{describedBy}
				onChange={(value) => void handleChange(value)}
				bind:buttonElement={selectElement}
			/>
		{/snippet}
	</ChangesPanelView>
	{:else}
	<ContextPanelSurface label={title} onDismiss={handleDismiss} bind:element>
		<MessageComposer
			text={proposalDraft}
			title="Propose change"
			placeholder="Write the replacement clause…"
			submitLabel="Propose change"
			cancelLabel="Cancel"
			{pending}
			errorMessage={proposalError}
			onTextChange={(text) => {
				proposalDraft = text;
				proposalError = '';
			}}
			onCancel={cancelProposal}
			onSubmit={() => void submitProposal()}
		/>
	</ContextPanelSurface>
{/if}
