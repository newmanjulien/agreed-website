<script lang="ts">
	import ChangesClausePanel from './ChangesClausePanel.svelte';
	import FaqClausePanel from './FaqClausePanel.svelte';
	import type { ClauseDefinition } from '$lib/demo/document/agreement-model';
	import type { AgreementControlValues } from '$lib/demo/document/agreement-control-values';

	let {
		clauseId,
		clause,
		currentControlValues,
		errorMessage,
		onDismiss,
		onControlValueChange,
		onProposalSubmit,
		onClauseReference,
		element = $bindable()
	}: {
		clauseId: string;
		clause: ClauseDefinition;
		currentControlValues: Readonly<AgreementControlValues>;
		errorMessage: string;
		onDismiss: () => void;
		onControlValueChange: (
			clauseId: string,
			controlId: string,
			value: string
		) => Promise<boolean>;
		onProposalSubmit: (
			clauseId: string,
			optionValue: string,
			text: string
		) => Promise<boolean>;
		onClauseReference: (clauseId: string) => void;
		element?: HTMLElement;
	} = $props();

</script>

{#key clauseId}
	{#if clause.widget.type === 'changes'}
		{@const definition = clause.widget}
		{@const control = definition.control}
		<ChangesClausePanel
			{clauseId}
			title={clause.title}
			{definition}
			value={currentControlValues[clauseId]?.[control.id] ?? control.defaultValue}
			{errorMessage}
			{onDismiss}
			onChange={(value) => onControlValueChange(clauseId, control.id, value)}
			onProposalSubmit={(optionValue, text) =>
				onProposalSubmit(clauseId, optionValue, text)}
			bind:element
		/>
	{:else}
		<FaqClausePanel
			{clauseId}
			title={clause.title}
			definition={clause.widget}
			{onDismiss}
			{onClauseReference}
			bind:element
		/>
	{/if}
{/key}
