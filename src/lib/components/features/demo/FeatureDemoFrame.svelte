<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		panelFocused = false,
		label,
		element = $bindable(),
		sceneElement = $bindable(),
		children
	}: {
		panelFocused?: boolean;
		label: string;
		element?: HTMLDivElement;
		sceneElement?: HTMLDivElement;
		children: Snippet;
	} = $props();
</script>

<div class="feature-demo-frame" bind:this={element} role="img" aria-label={label}>
	<div class="feature-demo-scene" class:panel-focused={panelFocused} bind:this={sceneElement} aria-hidden="true" inert>
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
		--demo-scene-width: 702px;
		--demo-scene-height: 430px;
		--demo-document-top: -164px;
		--demo-document-left: -315px;
		--demo-document-width: 690px;
		--demo-document-height: 860px;
		--demo-copy-width: 570px;
		--demo-copy-left: 60px;
		--demo-copy-top: 184px;
		--demo-panel-top: 153px;
		--demo-panel-left: 397px;
		--demo-panel-width: 284px;
	}

	.feature-demo-scene {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--demo-scene-width);
		height: var(--demo-scene-height);
		overflow: hidden;
		font-family: Arial, Helvetica, sans-serif;
		transition: left 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (max-width: 767px) {
		.feature-demo-scene { left: -50px; }
		.feature-demo-scene.panel-focused {
			left: calc((100% - var(--demo-panel-width)) / 2 - var(--demo-panel-left));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feature-demo-scene { transition: none; }
	}
</style>
