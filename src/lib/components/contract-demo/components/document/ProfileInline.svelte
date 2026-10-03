<script lang="ts">
	import type { InlineToken } from '../../document/pagination/types';
	import { annotationSegments } from '../../playbook/document-overlay';
	import { groupRevisionRuns } from '../../document/revision-runs';
	let { tokens }: { tokens: readonly InlineToken[] } = $props();
	const segments = $derived(annotationSegments(tokens));
</script>

{#snippet text(values: readonly InlineToken[])}
	{#each values as token}<span data-contract-token>{token.value}</span>{/each}
{/snippet}
{#snippet revisions(values: readonly InlineToken[])}
	{#each groupRevisionRuns(values) as run}
		{#if run.revision === 'removed'}<del class="contract-revision-removed line-through select-none">{@render text(run.tokens)}</del>
		{:else if run.revision === 'added'}<ins class="contract-revision-added no-underline">{@render text(run.tokens)}</ins>
		{:else}{@render text(run.tokens)}{/if}
	{/each}
{/snippet}
{#each segments as segment}
	{#if segment.target}<span class="playbook-trigger">{@render revisions(segment.tokens)}</span>
	{:else}{@render revisions(segment.tokens)}{/if}
{/each}
