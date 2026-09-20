<script lang="ts">
	import type { Snippet } from 'svelte';
	import DemoHeader from '$lib/components/hero/requests-demo/DemoHeader.svelte';

	let {
		wide = false,
		pointsLeft,
		children
	}: {
		wide?: boolean;
		pointsLeft?: number;
		children: Snippet;
	} = $props();
</script>

<div class="feature-demo-app" class:is-wide={wide}>
	<DemoHeader {pointsLeft} />

	<div class="feature-demo-screen">
		{@render children()}
	</div>
</div>

<style>
	.feature-demo-app {
		--app-header-height: 40px;
		--app-gutter: 16px;
		--demo-zoom: 0.84;
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100% / var(--demo-zoom));
		height: calc(100% / var(--demo-zoom));
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--color-surface);
		transform: scale(var(--demo-zoom));
		transform-origin: top left;
	}

	.feature-demo-app:not(.is-wide) :global(.demo-header-bar) {
		padding-left: var(--app-gutter);
		padding-right: var(--app-gutter);
	}

	.feature-demo-app.is-wide {
		--app-gutter: 32px;
	}

	.feature-demo-screen {
		min-height: 0;
		flex: 1;
		overflow: hidden;
	}

	@media (max-width: 640px) {
		.feature-demo-app.is-wide {
			--app-gutter: 20px;
		}
	}
</style>
