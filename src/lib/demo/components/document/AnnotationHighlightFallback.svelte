<script lang="ts">
	import { onMount } from 'svelte';
	import type { AnnotationSession } from '$lib/demo/document/annotations/annotation-session.svelte';
	import type { AnnotationKind } from '$lib/demo/document/annotations/types';
	import { customHighlightsSupported } from '$lib/demo/document/custom-highlights';

	let {
		session,
		container
	}: {
		session: AnnotationSession;
		container?: HTMLElement;
	} = $props();

	type HighlightRectangle = {
		kind: AnnotationKind;
		left: number;
		top: number;
		width: number;
		height: number;
	};

	let supported = $state(true);
	let mounted = false;
	let animationFrameId: number | null = null;
	let rectangles = $state<HighlightRectangle[]>([]);

	function cancelUpdate() {
		if (animationFrameId === null) return;
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	function updateRectangles() {
		animationFrameId = null;
		if (supported || !container) {
			rectangles = [];
			return;
		}

		const containerBounds = container.getBoundingClientRect();
		const highlights = [
			...session.resolvedAnnotations.map(({ annotation, ranges }) => ({
				kind: annotation.kind,
				ranges
			})),
			...(session.composer && session.creationRanges.length > 0
				? [{ kind: session.composer.kind, ranges: session.creationRanges }]
				: [])
		];

		rectangles = highlights.flatMap(({ kind, ranges }) =>
			ranges.flatMap((range) =>
				Array.from(range.getClientRects())
					.filter((rectangle) => rectangle.width > 0 && rectangle.height > 0)
						.map((rectangle) => ({
							kind,
							left: rectangle.left - containerBounds.left,
							top: rectangle.top - containerBounds.top,
							width: rectangle.width,
							height: rectangle.height
						}))
			)
		);
	}

	function scheduleUpdate() {
		if (!mounted || supported || animationFrameId !== null) return;
		animationFrameId = requestAnimationFrame(updateRectangles);
	}

	$effect(() => {
		container;
		session.resolvedAnnotations;
		session.creationRanges;
		session.composer;
		scheduleUpdate();
	});

	onMount(() => {
		mounted = true;
		supported = customHighlightsSupported();
		if (supported) return;

		const observer = new ResizeObserver(scheduleUpdate);
		if (container) observer.observe(container);
		window.addEventListener('resize', scheduleUpdate);
		scheduleUpdate();

		return () => {
			mounted = false;
			observer.disconnect();
			window.removeEventListener('resize', scheduleUpdate);
			cancelUpdate();
		};
	});
</script>

{#if !supported}
	<div class="annotation-highlight-fallback" aria-hidden="true">
		{#each rectangles as rectangle}
			<span
				class="annotation-highlight-rectangle"
				class:is-comment={rectangle.kind === 'comment'}
				class:is-change={rectangle.kind === 'change'}
				style:left={`${rectangle.left}px`}
				style:top={`${rectangle.top}px`}
				style:width={`${rectangle.width}px`}
				style:height={`${rectangle.height}px`}
			></span>
		{/each}
	</div>
{/if}

<style>
	.annotation-highlight-fallback {
		position: absolute;
		inset: 0;
		z-index: 4;
		pointer-events: none;
	}

	.annotation-highlight-rectangle {
		position: absolute;
		border-radius: 1px;
	}

	.annotation-highlight-rectangle.is-comment {
		background: rgba(168, 199, 250, 0.72);
		background: color-mix(in srgb, var(--color-demo-comment-highlight) 72%, transparent);
	}

	.annotation-highlight-rectangle.is-change {
		background: rgba(118, 118, 118, 0.1);
	}

	.annotation-highlight-rectangle.is-change::after {
		content: '';
		position: absolute;
		top: 50%;
		right: 0;
		left: 0;
		border-top: 1px solid var(--color-demo-ink-muted);
	}
</style>
