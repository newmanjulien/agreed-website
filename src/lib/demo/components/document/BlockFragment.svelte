<script lang="ts">
	import InlineContent from './InlineContent.svelte';
	import type { ClauseRegistry } from '$lib/demo/document/agreement-model';
	import type { PageFragment } from '$lib/demo/document/pagination/types';

	let {
		fragment,
		pageNumber,
		clauses,
		selectedClauseId,
		referencedClauseId,
		onClauseSelect
	}: {
		fragment: PageFragment;
		pageNumber: number;
		clauses: ClauseRegistry;
		selectedClauseId: string | null;
		referencedClauseId: string | null;
		onClauseSelect: (clauseId: string, clauseFragmentKey: string) => void;
	} = $props();

	let blockFragmentKey = $derived(`page-${pageNumber}:${fragment.blockKey}`);
</script>

{#if fragment.type === 'heading'}
	<svelte:element
		this={`h${fragment.level}`}
		id={fragment.anchor}
		class="agreement-block agreement-heading"
		data-block-id={fragment.blockKey}
		tabindex="-1"
	>
		<InlineContent
			tokens={fragment.tokens}
			{blockFragmentKey}
			{clauses}
			{selectedClauseId}
			{referencedClauseId}
			{onClauseSelect}
		/>
	</svelte:element>
{:else if fragment.type === 'paragraph'}
	<p
		class="agreement-block agreement-paragraph"
		class:is-continuation={fragment.isContinuation}
		class:is-final={fragment.isFinal}
		data-block-id={fragment.blockKey}
	>
		<InlineContent
			tokens={fragment.tokens}
			{blockFragmentKey}
			{clauses}
			{selectedClauseId}
			{referencedClauseId}
			{onClauseSelect}
		/>
	</p>
{:else}
	<section class="agreement-block agreement-signatures" data-block-id={fragment.blockKey}>
		<h2>{fragment.title}</h2>
		<div class="signature-grid">
			{#each fragment.parties as party}
				<div class="signature-block">
					<h3>{party.name}</h3>
					{#each party.fields as field}
						<p>
							{field.label}:
							{#if field.kind === 'signature-line'}
								<span class="signature-line"></span>
							{:else}
								<span class:field-value={field.marks?.bold}>
									{#if field.marks?.italic}<em>{field.value}</em>{:else}{field.value}{/if}
								</span>
							{/if}
						</p>
					{/each}
				</div>
			{/each}
		</div>
	</section>
{/if}
