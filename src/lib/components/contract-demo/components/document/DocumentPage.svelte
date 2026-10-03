<script lang="ts">
	import type { AnnotationActivation } from '$lib/components/contract-demo/document/annotation-anchor';
	import { PAGE_FORMAT } from '$lib/components/contract-demo/document/pagination/page-format';
	import type { HighlightRect } from '$lib/components/contract-demo/document/highlights/geometry';
	import BlockFragment from './BlockFragment.svelte';
	import { fragmentKey, type PaginatedPage, type InlineToken } from '$lib/components/contract-demo/document/pagination/types';

	let {
		page,
		highlights = [],
		selectedAnnotationId,
		canOpenPlaybookItems,
		tabStops,
		onAnnotationSelect
	}: {
		page: PaginatedPage;
		highlights?: readonly HighlightRect[];
		selectedAnnotationId: string | null;
		canOpenPlaybookItems: boolean;
		tabStops: ReadonlySet<InlineToken>;
		onAnnotationSelect: (
			itemId: string,
			annotationId: string,
			activation: AnnotationActivation
		) => void;
	} = $props();
	const highlightClasses = {
		trigger: 'fill-(--document-highlight-trigger) data-[trigger-state=hover]:fill-(--document-highlight-trigger-hover) data-[trigger-state=selected]:fill-(--document-highlight-trigger-selected)',
		'revision-added': 'fill-(--document-highlight-revision-added)',
		'revision-removed': 'fill-(--document-highlight-revision-removed)'
	};
</script>

<article
	class={[
		'document-page relative isolate h-(--contract-page-height) w-(--contract-page-width) overflow-hidden bg-surface px-(--contract-page-horizontal-padding) pb-(--contract-page-bottom-padding) outline-1 -outline-offset-1 outline-line',
		page.number === 1 ? 'pt-(--contract-first-page-top-padding)' : 'pt-(--contract-page-top-padding)'
	]}
	aria-label={`Page ${page.number}`}
	data-page-number={page.number}
>
	<div class="document-page__content flex w-(--contract-content-width) flex-col font-sans text-[#171717] select-none">
		{#each page.placements as { fragment } (fragmentKey(fragment))}
			<BlockFragment
				{fragment}
				{selectedAnnotationId}
				{canOpenPlaybookItems}
				{tabStops}
				{onAnnotationSelect}
			/>
		{/each}
	</div>
	<svg
		class="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply forced-colors:mix-blend-normal"
		aria-hidden="true"
		viewBox={`0 0 ${PAGE_FORMAT.width} ${PAGE_FORMAT.height}`}
	>
		{#each highlights as rect}
			<rect
				x={rect.x}
				y={rect.y}
				width={rect.width}
				height={rect.height}
				class={['forced-colors:forced-color-adjust-none forced-colors:fill-[Mark]! forced-colors:opacity-35', highlightClasses[rect.kind]]}
				data-trigger-state={rect.triggerState}
			/>
		{/each}
	</svg>
	<div class="absolute right-12 bottom-8 text-[15px] leading-none text-[#a3a3a3]" aria-hidden="true">
		{page.number}
	</div>
</article>
