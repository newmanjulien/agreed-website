<script lang="ts">
	import type { Snippet } from 'svelte';
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import SquareIconButton from '$lib/demo/components/ui/SquareIconButton.svelte';

	let {
		label,
		intro,
		introId,
		onDismiss,
		closeLabel = 'Close panel',
		responsiveMode = 'clause',
		compact = false,
		element = $bindable(),
		children
	}: {
		label: string;
		intro?: string;
		introId?: string;
		onDismiss?: () => void;
		closeLabel?: string;
		responsiveMode?: 'clause' | 'annotation';
		compact?: boolean;
		element?: HTMLElement;
		children: Snippet;
	} = $props();
</script>

<aside
	class="context-panel-surface w-full rounded-demo-widget border border-demo-line bg-demo-surface p-3.5 text-demo-ink shadow-none"
	class:is-annotation-panel={responsiveMode === 'annotation'}
	class:is-compact={compact}
	bind:this={element}
	data-context-panel
	aria-label={label}
>
	<header class="context-panel-header" class:has-intro={intro !== undefined}>
		{#if intro !== undefined}
			<p id={introId} class="m-0 min-w-0 text-[15px] leading-[1.45] text-demo-ink-muted">{intro}</p>
		{/if}
		{#if onDismiss}
			<div class="context-panel-close">
				<SquareIconButton type="button" aria-label={closeLabel} onclick={onDismiss}>
					<XIcon aria-hidden="true" size={22} weight="regular" />
				</SquareIconButton>
			</div>
		{/if}
	</header>

	<div class="context-panel-body">
		{@render children()}
	</div>
</aside>

<style>
	.context-panel-header {
		margin-bottom: 12px;
	}

	.context-panel-surface.is-compact {
		padding: 10px;
	}

	.context-panel-header:not(.has-intro) {
		display: none;
		margin-bottom: 0;
	}

	.context-panel-close {
		display: none;
	}

	@container (width < 900px) {
		.context-panel-surface {
			display: grid;
			max-height: min(65%, 560px);
			grid-template-rows: auto minmax(0, 1fr);
			padding: 0;
			overflow: hidden;
			border-width: 1px 0 0;
			border-radius: var(--radius-demo-widget) var(--radius-demo-widget) 0 0;
		}

		.context-panel-surface .context-panel-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 24px;
			margin-bottom: 0;
			padding: 12px 14px;
		}

		.context-panel-surface.is-annotation-panel .context-panel-header:not(.has-intro) {
			justify-content: flex-end;
			gap: 0;
			padding: 8px 12px 0;
		}

		.context-panel-surface .context-panel-close {
			display: block;
			flex: none;
		}

		.context-panel-surface .context-panel-body {
			overflow-y: auto;
			overscroll-behavior: contain;
			padding: 0 14px calc(14px + env(safe-area-inset-bottom));
		}
	}
</style>
