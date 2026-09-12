<script lang="ts">
	import BlockFragment from './BlockFragment.svelte';
	import type { ClauseRegistry } from '$lib/demo/document/agreement-model';
	import type { PageLayout } from '$lib/demo/document/pagination/types';

	let {
		page,
		totalPages,
		clauses,
		selectedClauseId,
		referencedClauseId,
		onClauseSelect
	}: {
		page: PageLayout;
		totalPages: number;
		clauses: ClauseRegistry;
		selectedClauseId: string | null;
		referencedClauseId: string | null;
		onClauseSelect: (clauseId: string, clauseFragmentKey: string) => void;
	} = $props();
</script>

<article
	class="document-page"
	class:first-page={page.number === 1}
	aria-label={`Page ${page.number} of ${totalPages}`}
>
	<div class="document-page__content agreement-document agreement-flow">
		{#each page.fragments as fragment}
			<BlockFragment
				{fragment}
				pageNumber={page.number}
				{clauses}
				{selectedClauseId}
				{referencedClauseId}
				{onClauseSelect}
			/>
		{/each}
	</div>
	<div class="document-page__number" aria-hidden="true">
		{page.number}
	</div>
</article>
