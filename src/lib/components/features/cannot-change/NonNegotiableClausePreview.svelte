<script lang="ts">
	import AgreementExcerptPreview from '../demo/AgreementExcerptPreview.svelte';
	import PreviewInlineContent from '../demo/PreviewInlineContent.svelte';
	import type { AgreementFeaturePreviewContent } from '../feature-preview-content';

	let { content, active = false, registerTarget }: {
		content: AgreementFeaturePreviewContent;
		active?: boolean;
		registerTarget: (name: string, element: Element | null) => void;
	} = $props();
</script>

<AgreementExcerptPreview>
	<h2><PreviewInlineContent content={content.heading.content} /></h2>
	{#each content.paragraphsBeforeClause as paragraph}
		<p><PreviewInlineContent content={paragraph.content} /></p>
	{/each}
	<p class:clause-active={active}>
		<PreviewInlineContent content={content.clauseParagraph.content} {registerTarget} />
	</p>
	<h2><PreviewInlineContent content={content.pricingHeading.content} /></h2>
	{#each content.paragraphsAfterClause as paragraph}
		<p><PreviewInlineContent content={paragraph.content} /></p>
	{/each}
</AgreementExcerptPreview>

<style>
	p :global(.preview-clause) {
		border-radius: 3px;
		background: var(--color-demo-clause-informational-highlight);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		transition: background-color 160ms ease;
	}

	p.clause-active :global(.preview-clause) {
		background: var(--color-demo-clause-informational-selected-highlight);
	}

	@media (prefers-reduced-motion: reduce) {
		p :global(.preview-clause) { transition: none; }
	}
</style>
