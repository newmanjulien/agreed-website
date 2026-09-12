<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="document-page-slice">
	<div class="document-copy">
		{@render children()}
	</div>
</div>

<style>
	.document-page-slice {
		position: absolute;
		top: var(--demo-document-top);
		left: var(--demo-document-left);
		width: var(--demo-document-width);
		height: var(--demo-document-height);
		overflow: hidden;
		outline: 1px solid var(--color-demo-line);
		outline-offset: -1px;
		background: var(--color-demo-surface);
		color: var(--color-demo-document-ink);
	}

	.document-copy {
		width: var(--demo-copy-width);
		margin-left: var(--demo-copy-left);
		padding-top: var(--demo-copy-top);
	}

	.document-copy :global(h2) {
		margin: 0 0 18px;
		font-size: 22px;
		line-height: 1.25;
		letter-spacing: -0.25px;
	}

	.document-copy :global(p) {
		margin: 0 0 20px;
		font-size: 16px;
		line-height: 1.46;
	}
</style>
