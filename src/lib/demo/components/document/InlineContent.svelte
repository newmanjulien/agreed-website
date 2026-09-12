<script lang="ts">
	import type { InlineToken } from '$lib/demo/document/pagination/types';
	import type { ClauseRegistry } from '$lib/demo/document/agreement-model';
	import ClauseReferenceMarker from './ClauseReferenceMarker.svelte';

	interface InlineSegment {
		clauseId?: string;
		isClauseInactive?: boolean;
		clauseFragmentKey?: string;
		isClauseStart?: boolean;
		tokens: InlineToken[];
	}

	let {
		tokens,
		blockFragmentKey,
		clauses,
		selectedClauseId,
		referencedClauseId,
		onClauseSelect
	}: {
		tokens: InlineToken[];
		blockFragmentKey: string;
		clauses: ClauseRegistry;
		selectedClauseId: string | null;
		referencedClauseId: string | null;
		onClauseSelect: (clauseId: string, clauseFragmentKey: string) => void;
	} = $props();

	function segmentTokensByClause(items: InlineToken[], keyBase: string): InlineSegment[] {
		const segments: InlineSegment[] = [];

		for (const token of items) {
			const previous = segments.at(-1);
			if (previous && previous.clauseId === token.clauseId) {
				previous.tokens.push(token);
				continue;
			}

			const segmentIndex = segments.length;
			segments.push({
				...(token.clauseId
					? {
							clauseId: token.clauseId,
							isClauseInactive: token.isClauseInactive,
							clauseFragmentKey: `${keyBase}:clause-${segmentIndex}`,
							isClauseStart: token.isClauseStart
						}
					: {}),
				tokens: [token]
			});
		}

		return segments;
	}

	function handleKeydown(event: KeyboardEvent, clauseId: string, clauseFragmentKey: string) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onClauseSelect(clauseId, clauseFragmentKey);
	}

	function handleClick(clauseId: string, clauseFragmentKey: string) {
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed) return;
		onClauseSelect(clauseId, clauseFragmentKey);
	}

	function clauseHighlightTone(clauseId: string) {
		const clause = clauses[clauseId];
		if (!clause) throw new Error(`Missing definition for clause "${clauseId}".`);
		return clause.highlightTone;
	}

	let segments = $derived(segmentTokensByClause(tokens, blockFragmentKey));
</script>

{#snippet renderTokens(groupTokens: InlineToken[])}
	{#each groupTokens as token}
		{#if token.marks?.bold && token.marks?.italic}
			<strong><em>{token.value}</em></strong>
		{:else if token.marks?.bold}
			<strong>{token.value}</strong>
		{:else if token.marks?.italic}
			<em>{token.value}</em>
		{:else}{token.value}{/if}
	{/each}
{/snippet}

{#each segments as segment}
	{#if segment.clauseId && segment.clauseFragmentKey}
		<span
			class="agreement-clause"
			class:is-clause-reference-target={referencedClauseId === segment.clauseId}
			class:is-clause-inactive={segment.isClauseInactive}
			id={segment.isClauseStart ? `clause-${segment.clauseId}` : undefined}
			role="button"
			tabindex="0"
			aria-pressed={selectedClauseId === segment.clauseId}
			data-clause-id={segment.clauseId}
			data-annotation-excluded
			data-clause-highlight-tone={clauseHighlightTone(segment.clauseId)}
			data-clause-fragment-key={segment.clauseFragmentKey}
			onclick={() => handleClick(segment.clauseId!, segment.clauseFragmentKey!)}
			onkeydown={(event) =>
				handleKeydown(event, segment.clauseId!, segment.clauseFragmentKey!)}
		>
			{#if referencedClauseId === segment.clauseId}
				<ClauseReferenceMarker />
			{/if}
			{@render renderTokens(segment.tokens)}
		</span>
	{:else}
		{@render renderTokens(segment.tokens)}
	{/if}
{/each}
