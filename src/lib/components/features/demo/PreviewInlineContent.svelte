<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type {
		FeaturePreviewParagraphContentNode,
		FeaturePreviewClauseContentNode,
		FeaturePreviewTextNode
	} from '../feature-preview-content';
	import type { TextNode } from '$lib/demo/document/types';

	let {
		content,
		valueLabels = {},
		registerTarget,
		cursorTargetName = 'clause'
	}: {
		content: ReadonlyArray<FeaturePreviewParagraphContentNode> | ReadonlyArray<TextNode>;
		valueLabels?: Readonly<Record<string, string>>;
		registerTarget?: (name: string, element: Element | null) => void;
		cursorTargetName?: string;
	} = $props();

	const attachCursorTarget: Attachment = (node) => {
		registerTarget?.(cursorTargetName, node);
		return () => registerTarget?.(cursorTargetName, null);
	};
</script>

{#snippet text(node: FeaturePreviewTextNode)}
	{#if node.marks?.bold && node.marks?.italic}
		<strong><em>{node.value}</em></strong>
	{:else if node.marks?.bold}
		<strong>{node.value}</strong>
	{:else if node.marks?.italic}
		<em>{node.value}</em>
	{:else}{node.value}{/if}
{/snippet}

{#snippet atom(node: FeaturePreviewClauseContentNode)}
	{#if node.type === 'value'}
		<span class="preview-value">{valueLabels[node.id] ?? ''}</span>
	{:else if node.cursorTarget}
		<span class="preview-cursor-target" {@attach attachCursorTarget}>{@render text(node)}</span>
	{:else}
		{@render text(node)}
	{/if}
{/snippet}

{#each content as node}
	{#if node.type === 'clause'}
		<span class="preview-clause" data-clause-id={node.id}>
			{#each node.content as clauseNode}
				{@render atom(clauseNode)}
			{/each}
		</span>
	{:else}
		{@render atom(node)}
	{/if}
{/each}
