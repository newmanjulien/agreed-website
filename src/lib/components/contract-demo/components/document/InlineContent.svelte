<script lang="ts">
	import type { InlineToken } from '$lib/components/contract-demo/document/pagination/types';
	import { annotationSegments } from '$lib/components/contract-demo/playbook/document-overlay';
	import type { AnnotationActivation } from '$lib/components/contract-demo/document/annotation-anchor';
	import RevisionText from './RevisionText.svelte';

	let {
		tokens,
		selectedAnnotationId,
		canOpenPlaybookItems,
		tabStops,
		onAnnotationSelect
	}: {
		tokens: readonly InlineToken[];
		selectedAnnotationId: string | null;
		canOpenPlaybookItems: boolean;
		tabStops?: ReadonlySet<InlineToken>;
		onAnnotationSelect?: (
			itemId: string,
			annotationId: string,
			activation: AnnotationActivation
		) => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent, itemId: string, annotationId: string) {
		if (!canOpenPlaybookItems || (event.key !== 'Enter' && event.key !== ' ')) return;
		event.preventDefault();
		if (event.repeat) return;
		onAnnotationSelect?.(itemId, annotationId, { owner: event.currentTarget as HTMLElement });
	}

	let segments = $derived(annotationSegments(tokens));
</script>

{#each segments as segment}
	{#if segment.target}
		{@const selected = selectedAnnotationId !== null && segment.membershipIds.includes(selectedAnnotationId)}
		<!-- Wrappers preserve memberships; only the annotation's first wrapper is a Tab stop. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span
			class="playbook-trigger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			role={canOpenPlaybookItems ? 'button' : undefined}
			tabindex={canOpenPlaybookItems ? (tabStops?.has(segment.tokens[0]) ? 0 : -1) : undefined}
			aria-label={canOpenPlaybookItems && segment.tokens.every((token) => !token.value.trim())
				? 'Open playbook item'
				: undefined}
			aria-pressed={canOpenPlaybookItems ? selected : undefined}
			data-item-id={segment.target.itemId}
			data-annotation-id={segment.target.id}
			data-annotation-memberships={JSON.stringify(segment.membershipIds)}
			onkeydown={(event) => handleKeydown(event, segment.target!.itemId, segment.target!.id)}
		>
			<RevisionText tokens={segment.tokens} />
		</span>
	{:else}
		<RevisionText tokens={segment.tokens} />
	{/if}
{/each}
