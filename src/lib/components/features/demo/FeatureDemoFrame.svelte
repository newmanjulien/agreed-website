<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		element = $bindable(),
		sceneElement = $bindable(),
		children
	}: {
		label: string;
		element?: HTMLDivElement;
		sceneElement?: HTMLDivElement;
		children: Snippet;
	} = $props();
</script>

<div class="feature-demo-frame" bind:this={element} role="img" aria-label={label}>
	<div class="feature-demo-scene" bind:this={sceneElement} aria-hidden="true" inert>
		{@render children()}
	</div>
</div>

<style>
	.feature-demo-frame {
		position: relative;
		height: 430px;
		overflow: hidden;
		border: 1px solid rgb(231 229 228);
		border-radius: 16px;
		background: color-mix(in srgb, rgb(250 250 249) 60%, transparent);
		box-shadow: 0 1px 0 rgba(48, 47, 45, 0.03);
		pointer-events: none;
		user-select: none;
	}

	.feature-demo-scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
</style>
