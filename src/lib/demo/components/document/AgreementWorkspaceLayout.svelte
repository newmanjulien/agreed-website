<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		contextPanelKind,
		displayedPageWidth,
		documentHeight,
		workspaceHeight,
		panelTop,
		sideGutter,
		panelGap,
		panelMinWidth,
		panelMaxWidth,
		documentStageElement = $bindable(),
		documentContent,
		documentOverlayContent,
		contextPanelContent
	}: {
		contextPanelKind: 'clause' | 'annotation' | null;
		displayedPageWidth: number;
		documentHeight: number;
		workspaceHeight: number;
		panelTop: number;
		sideGutter: number;
		panelGap: number;
		panelMinWidth: number;
		panelMaxWidth: number;
		documentStageElement?: HTMLDivElement;
		documentContent: Snippet;
		documentOverlayContent?: Snippet;
		contextPanelContent: Snippet;
	} = $props();
</script>

<div
	class="agreement-workspace-layout"
	class:has-clause-panel={contextPanelKind === 'clause'}
	class:has-annotation-panel={contextPanelKind === 'annotation'}
	style:--page-width={`${displayedPageWidth}px`}
	style:--page-half-width={`${displayedPageWidth / 2}px`}
	style:--panel-top={`${panelTop}px`}
	style:--side-gutter={`${sideGutter}px`}
	style:--panel-gap={`${panelGap}px`}
	style:--panel-min-width={`${panelMinWidth}px`}
	style:--panel-max-width={`${panelMaxWidth}px`}
	style:min-height={`${workspaceHeight}px`}
>
	<div class="document-column" style:width={`${displayedPageWidth}px`}>
		<div
			class="document-stage"
			bind:this={documentStageElement}
			style:width={`${displayedPageWidth}px`}
			style:height={`${documentHeight}px`}
		>
			{@render documentContent()}
			{#if documentOverlayContent}{@render documentOverlayContent()}{/if}
		</div>
	</div>

	{#if contextPanelKind}
		<div class="context-panel-anchor">
			{@render contextPanelContent()}
		</div>
	{/if}
</div>

<style>
	.agreement-workspace-layout {
		--panel-content-scale: 0.85;
		--panel-content-inverse-scale: 1.176471;
		--panel-width: clamp(
			var(--panel-min-width),
			calc(
				100cqw - var(--side-gutter) - var(--page-width) - var(--panel-gap) -
					var(--side-gutter)
			),
			var(--panel-max-width)
		);
		--centered-page-left: calc(50cqw - var(--page-half-width));
		--right-anchored-page-left: calc(
			100cqw - var(--side-gutter) - var(--panel-width) - var(--panel-gap) -
				var(--page-width)
		);
		--page-left: min(var(--centered-page-left), var(--right-anchored-page-left));
		--page-shift: calc(
			var(--page-left) - var(--centered-page-left)
		);
		position: relative;
		width: 100%;
		container-type: inline-size;
	}

	.document-column {
		margin-inline: auto;
		transition: transform 180ms ease;
	}

	.document-stage {
		position: relative;
	}

	.context-panel-anchor {
		position: absolute;
		top: var(--panel-top);
		right: var(--panel-gap);
		z-index: 5;
		width: var(--panel-width);
		animation: panel-in 140ms ease both;
	}

	@container (width >= 900px) {
		.has-annotation-panel .document-column,
		.has-clause-panel .document-column {
			transform: translateX(var(--page-shift));
		}

		.has-annotation-panel .context-panel-anchor,
		.has-clause-panel .context-panel-anchor {
			right: auto;
			left: calc(var(--page-left) + var(--page-width) + var(--panel-gap));
		}

		.has-clause-panel .context-panel-anchor {
			width: calc(var(--panel-width) * var(--panel-content-inverse-scale));
			transform: scale(var(--panel-content-scale));
			transform-origin: top left;
			animation-name: compact-panel-in;
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(3px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes compact-panel-in {
		from {
			opacity: 0;
			transform: scale(var(--panel-content-scale)) translateY(3px);
		}
		to {
			opacity: 1;
			transform: scale(var(--panel-content-scale));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.document-column {
			transition: none;
		}

		.context-panel-anchor {
			animation: none;
		}
	}
</style>
