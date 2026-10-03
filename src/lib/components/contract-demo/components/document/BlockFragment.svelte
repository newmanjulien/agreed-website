<script lang="ts">
	import type { AnnotationActivation } from '$lib/components/contract-demo/document/annotation-anchor';
	import InlineContent from './InlineContent.svelte';
	import ProfileInline from './ProfileInline.svelte';
	import { fragmentKey, type PageFragment, type InlineToken } from '$lib/components/contract-demo/document/pagination/types';

	let {
		fragment,
		profileMode = false,
		selectedAnnotationId = null,
		canOpenPlaybookItems = false,
		tabStops,
		onAnnotationSelect
	}: {
		fragment: PageFragment;
		/** Preserve layout markup while suppressing global IDs and interactive semantics. */
		profileMode?: boolean;
		selectedAnnotationId?: string | null;
		canOpenPlaybookItems?: boolean;
		tabStops?: ReadonlySet<InlineToken>;
		onAnnotationSelect?: (
			itemId: string,
			annotationId: string,
			activation: AnnotationActivation
		) => void;
	} = $props();
	const Content = $derived(profileMode ? ProfileInline : InlineContent);
	const signature = $derived(fragment.type === 'table' && fragment.variant === 'signature');
	const cellClasses = $derived([
		'text-left align-top [overflow-wrap:anywhere]',
		signature ? 'py-[9px] pr-3' : 'h-11 border-[0.75px] border-[#babec3] p-2'
	]);
</script>

{#if fragment.type === 'heading'}
	<svelte:element
		this={`h${fragment.level}`}
		class={[
			'scroll-mt-(--document-viewport-gap) focus:outline-none',
			fragment.level === 1 && 'flex-none mb-[33px] text-center text-[20px] leading-[0] tracking-[-0.4px]',
			fragment.level === 2 && 'flex-none mt-[34px] mb-2.5 text-[17px] leading-[1.25] tracking-[-0.25px]'
		]}
		data-block-key={fragment.blockKey}
		data-source-fragment-key={fragmentKey(fragment)}
		tabindex={profileMode ? undefined : -1}
	>
		<Content
			tokens={fragment.tokens}
			{selectedAnnotationId}
			{tabStops}
			canOpenPlaybookItems={canOpenPlaybookItems && !profileMode}
			{onAnnotationSelect}
		/>
	</svelte:element>
{:else if fragment.type === 'paragraph'}
	<p
		class={[
			'flex-none text-justify text-[15px] leading-[1.46]',
			fragment.isFinal ? 'mb-5' : 'mb-0',
			fragment.emptyInsertionSlot && 'is-empty-insertion-slot [&_.playbook-trigger]:block [&_.playbook-trigger]:w-full [&_.playbook-trigger]:min-h-[1.46em]'
		]}
		data-block-key={fragment.blockKey}
		data-source-fragment-key={fragmentKey(fragment)}
	>
		<Content
			tokens={fragment.tokens}
			{selectedAnnotationId}
			{tabStops}
			canOpenPlaybookItems={canOpenPlaybookItems && !profileMode}
			{onAnnotationSelect}
		/>
	</p>
{:else}
	<table
		class={[
			'w-full flex-none border-collapse text-[14px] leading-[1.4]',
			signature ? 'my-[30px] table-auto' : 'mt-3 mb-6 table-fixed'
		]}
		data-block-key={fragment.blockKey}
		data-source-fragment-key={fragmentKey(fragment)}
	>
		<thead>
			{#each fragment.rows.slice(0, fragment.headerRowCount) as row}
				<tr>
					{#each row as cell}
						<th scope="col" class={[cellClasses, !signature && 'bg-fill-subtle']}>{cell}</th>
					{/each}
				</tr>
			{/each}
		</thead>
		<tbody>
			{#each fragment.rows.slice(fragment.headerRowCount) as row}
				<tr>
					{#each row as cell}
						<td class={cellClasses}>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
