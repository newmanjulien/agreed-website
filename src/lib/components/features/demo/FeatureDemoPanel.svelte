<script lang="ts">
	import type { Snippet } from 'svelte';

	let { visible = false, children }: { visible?: boolean; children: Snippet } = $props();
</script>

<div class="feature-demo-panel" class:is-visible={visible}>
	{@render children()}
</div>

<style>
	.feature-demo-panel {
		position: absolute;
		top: var(--demo-panel-top);
		left: var(--demo-panel-left);
		z-index: 3;
		width: var(--demo-panel-width);
		opacity: 0;
		transform: translateY(4px) scale(0.985);
		transform-origin: top left;
		transition: opacity 180ms ease, transform 180ms ease;
	}

	.feature-demo-panel.is-visible {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.feature-demo-panel { transition: none; }
	}
</style>
