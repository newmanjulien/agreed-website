<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		hasPanel,
		reservePanelSpace = false,
		pageWidth,
		documentHeight,
		panelTop,
		documentStageElement = $bindable(),
		panelElement = $bindable(),
		documentContent,
		panelContent,
		footerContent
	}: {
		hasPanel: boolean;
		reservePanelSpace?: boolean;
		pageWidth: number;
		documentHeight: number;
		panelTop: number;
		documentStageElement?: HTMLDivElement;
		panelElement?: HTMLDivElement;
		documentContent: Snippet;
		panelContent: Snippet;
		footerContent?: Snippet;
	} = $props();
</script>

<div
	class="contract-workspace-layout relative w-full @container"
	style:--page-width={`${pageWidth}px`}
	style:--panel-top={`${panelTop}px`}
	style:min-height={`${documentHeight}px`}
>
	<div class={['w-(--page-width)', hasPanel || reservePanelSpace ? 'ml-(--page-left) mr-0' : 'mx-auto']}>
		<div
			class="document-stage relative data-[clause-hover]:cursor-pointer data-[clause-hover]:[&_*]:cursor-pointer"
			bind:this={documentStageElement}
			tabindex="-1"
			style:width={`${pageWidth}px`}
			style:height={`${documentHeight}px`}
		>
			{@render documentContent()}
		</div>
		{@render footerContent?.()}
	</div>

	{#if hasPanel}
		<div class="panel-rail pointer-events-none absolute top-(--panel-top) left-[calc(var(--page-left)+var(--page-width)+var(--panel-gap))] z-[5] w-(--panel-width) motion-reduce:animate-none" data-workspace-panel-rail>
			<div class="pointer-events-auto" data-workspace-panel bind:this={panelElement}>
				{@render panelContent()}
			</div>
		</div>
	{/if}
</div>

<style>
	@layer components {
		.contract-workspace-layout {
			--panel-gap: 24px;
			--right-gutter: 24px;
			--panel-width: clamp(360px, calc(100cqw - 88px - var(--page-width) - var(--panel-gap) - var(--right-gutter)), 480px);
			--page-left: min(calc(50cqw - var(--page-width) / 2), calc(100cqw - var(--right-gutter) - var(--panel-width) - var(--panel-gap) - var(--page-width)));
		}
		.panel-rail {
			animation: oceans-panel-in 140ms ease both;
		}
		@keyframes oceans-panel-in {
			from { opacity: 0; transform: translateY(3px); }
			to { opacity: 1; transform: translateY(0); }
		}
	}
</style>
