<script lang="ts">
	import AgreementExcerptPreview from '../demo/AgreementExcerptPreview.svelte';
	import PreviewInlineContent from '../demo/PreviewInlineContent.svelte';
	import type { FlagFeaturePreviewContent } from '../feature-preview-content';

	let {
		content,
		valueLabel,
		selected = false,
		panelOpen = false,
		registerTarget
	}: {
		content: FlagFeaturePreviewContent;
		valueLabel: string;
		selected?: boolean;
		panelOpen?: boolean;
		registerTarget: (name: string, element: Element | null) => void;
	} = $props();
</script>

<AgreementExcerptPreview>
	<h2><PreviewInlineContent content={content.heading.content} /></h2>
	{#each content.paragraphsBeforeClause as paragraph}
		<p><PreviewInlineContent content={paragraph.content} /></p>
	{/each}
	<p class:clause-selected={panelOpen} class:value-changed={selected}>
		<PreviewInlineContent
			content={content.clauseParagraph.content}
			valueLabels={{ 'introducer-titles': valueLabel }}
			{registerTarget}
		/>
	</p>
	{#each content.paragraphsAfterClause as paragraph}
		<p><PreviewInlineContent content={paragraph.content} /></p>
	{/each}
</AgreementExcerptPreview>

<style>
	p :global(.preview-clause) {
		border-radius: 3px; background: var(--color-demo-clause-editable-highlight);
		box-decoration-break: clone; -webkit-box-decoration-break: clone;
		transition: background-color 160ms ease;
	}
	p.clause-selected :global(.preview-clause) { background: rgba(24, 128, 56, 0.22); }
	p :global(.preview-value) { font-weight: 400; }
	p.value-changed :global(.preview-value) { animation: value-change-in 220ms ease-out both; }
	@keyframes value-change-in { from { opacity: 0; } to { opacity: 1; } }
	@media (prefers-reduced-motion: reduce) {
		p :global(.preview-clause) { transition: none; }
		p :global(.preview-value) { animation: none; }
	}
</style>
