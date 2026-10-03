<script lang="ts">
	import type { InlineToken } from '$lib/components/contract-demo/document/pagination/types';
	import { groupRevisionRuns } from '$lib/components/contract-demo/document/revision-runs';
	import SourceText from './SourceText.svelte';
	let { tokens }: { tokens: readonly InlineToken[] } = $props();
	let runs = $derived(groupRevisionRuns(tokens));
</script>

{#each runs as run}
	{#if run.revision === 'removed'}
		<del class="contract-revision-removed line-through select-none"><SourceText tokens={run.tokens} /></del>
	{:else if run.revision === 'added'}
		<ins class="contract-revision-added no-underline"><SourceText tokens={run.tokens} /></ins>
	{:else}
		<SourceText tokens={run.tokens} />
	{/if}
{/each}
