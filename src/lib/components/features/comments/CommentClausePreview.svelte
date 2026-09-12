<script lang="ts">
	import AgreementExcerptPreview from '../demo/AgreementExcerptPreview.svelte';
	import PreviewInlineContent from '../demo/PreviewInlineContent.svelte';
	import type { ScenePoint } from '../demo/tour-model';
	import type { CommentsFeaturePreviewContent } from '../feature-preview-content';
	import type { SelectionPhase } from './comments-tour';
	import SelectionActionsPreview from './SelectionActionsPreview.svelte';
	import {
		buildSelectionGeometry,
		deduplicateRects,
		rectRelativeTo,
		selectionFragmentProgress,
		selectionPointAt,
		type SelectionGeometry
	} from './selection-geometry';

	let {
		content,
		selectionPhase = 'none',
		selectionProgress = 0,
		wrapTransitionProgress = 0.075,
		sceneElement,
		cursorPoint = $bindable(),
		actionsOpen = false,
		registerTarget
	}: {
		content: CommentsFeaturePreviewContent;
		selectionPhase?: SelectionPhase;
		selectionProgress?: number;
		wrapTransitionProgress?: number;
		sceneElement?: HTMLDivElement;
		cursorPoint?: ScenePoint;
		actionsOpen?: boolean;
		registerTarget: (name: string, element: Element | null) => void;
	} = $props();

	let commentRow = $state<HTMLDivElement>();
	let selectionElement = $state<HTMLSpanElement>();
	let geometry = $state<SelectionGeometry>();

	function measureSelection() {
		if (!commentRow || !selectionElement || !sceneElement) {
			geometry = undefined;
			return;
		}

		const row = commentRow;
		const selection = selectionElement;
		const scene = sceneElement;
		const rowRect = row.getBoundingClientRect();
		const sceneRect = scene.getBoundingClientRect();
		const rects = deduplicateRects([...selection.getClientRects()]).map((rect) => ({
			row: rectRelativeTo(rect, rowRect, row.offsetWidth, row.offsetHeight),
			scene: rectRelativeTo(rect, sceneRect, scene.offsetWidth, scene.offsetHeight)
		}));

		geometry = buildSelectionGeometry(rects, wrapTransitionProgress);
	}

	$effect(() => {
		cursorPoint = geometry
			? selectionPhase === 'dragging'
				? selectionPointAt(geometry, selectionProgress)
				: selectionPhase === 'complete'
					? geometry.end
					: geometry.start
			: undefined;
	});

	$effect(() => {
		commentRow;
		selectionElement;
		sceneElement;
		let cancelled = false;
		const frame = requestAnimationFrame(measureSelection);
		const observer = new ResizeObserver(measureSelection);
		if (commentRow) observer.observe(commentRow);
		void document.fonts?.ready.then(() => {
			if (!cancelled) measureSelection();
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});
</script>

<AgreementExcerptPreview>
	<div class="excerpt-copy">
		<h2><PreviewInlineContent content={content.heading.content} /></h2>
		{#each content.paragraphsBeforeSelection as paragraph}
			<p><PreviewInlineContent content={paragraph.content} /></p>
		{/each}
		<div class="comment-row" bind:this={commentRow}>
			<div
				class="selection-highlight"
				aria-hidden="true"
			>
				{#each geometry?.segments ?? [] as segment}
					<span
						class="selection-fragment"
						style:left={`${segment.row.left}px`}
						style:top={`${segment.row.top}px`}
						style:width={`${segment.row.width}px`}
						style:height={`${segment.row.height}px`}
					>
						<span class="selection-fill" style:width={`${selectionFragmentProgress(segment, selectionProgress) * 100}%`}></span>
					</span>
				{/each}
			</div>
			<p>
				<PreviewInlineContent content={content.selectionParagraph.before} /><span class="comment-target" bind:this={selectionElement}><PreviewInlineContent
					content={content.selectionParagraph.selection}
				/></span><PreviewInlineContent
					content={content.selectionParagraph.after}
				/>
			</p>
			{#if actionsOpen && geometry}
				<div
					class="selection-actions-anchor"
					style:left={`${geometry.bounds.left + geometry.bounds.width / 2}px`}
					style:top={`${geometry.bounds.top + geometry.bounds.height}px`}
				>
					<SelectionActionsPreview {registerTarget} />
				</div>
			{/if}
		</div>
		{#each content.paragraphsAfterSelection as paragraph}
			<p><PreviewInlineContent content={paragraph.content} /></p>
		{/each}
	</div>
</AgreementExcerptPreview>

<style>
	.excerpt-copy :global(h2) { margin-bottom: 12px; }
	.excerpt-copy :global(p) {
		margin-bottom: 14px;
		line-height: 1.3;
	}
	.comment-row {
		position: relative;
		margin-bottom: 14px;
	}
	.comment-row :global(p) { position: relative; z-index: 1; margin-bottom: 0; }
	.selection-highlight { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
	.selection-fragment { position: absolute; overflow: hidden; border-radius: 2px; }
	.selection-fill {
		display: block;
		width: 0;
		height: 100%;
		background: var(--color-demo-comment-highlight);
	}
	.selection-actions-anchor {
		position: absolute;
		z-index: 5;
		transform: translate(-50%, 8px);
	}
</style>
