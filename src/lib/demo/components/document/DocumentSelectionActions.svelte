<script lang="ts">
	import { onMount } from 'svelte';
	import ChatCenteredTextIcon from 'phosphor-svelte/lib/ChatCenteredTextIcon';
	import EraserIcon from 'phosphor-svelte/lib/EraserIcon';
	import SquareIconButton from '$lib/demo/components/ui/SquareIconButton.svelte';
	import { createTextAnchor } from '$lib/demo/document/annotations/text-anchor';
	import { compareTextPoints } from '$lib/demo/document/dom-text-index';
	import type { AnnotationKind, TextAnchor } from '$lib/demo/document/annotations/types';

	let {
		container,
		viewport,
		positioningContainer,
		eventRoot,
		onSelect
	}: {
		container: HTMLElement;
		viewport: HTMLElement;
		positioningContainer: HTMLElement;
		eventRoot: HTMLElement;
		onSelect: (selection: { kind: AnnotationKind; anchor: TextAnchor }) => void;
	} = $props();

	type SelectionPosition = {
		left: number;
		top: number;
		placement: 'above' | 'below';
	};

	const TOOLBAR_WIDTH = 58;
	const TOOLBAR_HEIGHT = 31;
	const VIEWPORT_PADDING = 8;
	const SELECTION_GAP = 10;
	const componentId = $props.id();
	const commentTooltipId = `${componentId}-comment-tooltip`;
	const changeTooltipId = `${componentId}-change-tooltip`;

	let position = $state<SelectionPosition | null>(null);
	let anchor = $state<TextAnchor | null>(null);
	let animationFrameId: number | null = null;
	let selectionPointerId: number | null = null;

	function clearActions() {
		position = null;
		anchor = null;
	}

	function cancelPositionUpdate() {
		if (animationFrameId === null) return;
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	function rangeContainsTextFromElement(range: Range, element: Element) {
		if (!range.intersectsNode(element)) return false;

		const elementRange = element.ownerDocument.createRange();
		elementRange.selectNodeContents(element);
		const intersection = range.cloneRange();
		const document = element.ownerDocument;
		if (
			compareTextPoints(
				document,
				{ node: range.startContainer, offset: range.startOffset },
				{ node: elementRange.startContainer, offset: elementRange.startOffset }
			) < 0
		) {
			intersection.setStart(elementRange.startContainer, elementRange.startOffset);
		}
		if (
			compareTextPoints(
				document,
				{ node: range.endContainer, offset: range.endOffset },
				{ node: elementRange.endContainer, offset: elementRange.endOffset }
			) > 0
		) {
			intersection.setEnd(elementRange.endContainer, elementRange.endOffset);
		}

		return Boolean(intersection.toString().trim());
	}

	function rangeIntersectsExcludedContent(range: Range, selectionContainer: HTMLElement) {
		return Array.from(selectionContainer.querySelectorAll('[data-annotation-excluded]')).some(
			(element) => rangeContainsTextFromElement(range, element)
		);
	}

	function updatePosition() {
		animationFrameId = null;
		if (selectionPointerId !== null) return;

		const selection = window.getSelection();
		const selectionContainer = container;
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
			clearActions();
			return;
		}

		const range = selection.getRangeAt(0);
		if (
			!selectionContainer.contains(range.startContainer) ||
			!selectionContainer.contains(range.endContainer) ||
			!selection.toString().trim() ||
			rangeIntersectsExcludedContent(range, selectionContainer)
		) {
			clearActions();
			return;
		}

		const nextAnchor = createTextAnchor(selectionContainer, range);
		if (!nextAnchor) {
			clearActions();
			return;
		}

		const rectangles = Array.from(range.getClientRects()).filter(
			(rectangle) => rectangle.width > 0 && rectangle.height > 0
		);
		if (rectangles.length === 0) {
			clearActions();
			return;
		}

		const firstRectangle = rectangles[0];
		const lastRectangle = rectangles.at(-1)!;
		const viewportBounds = viewport.getBoundingClientRect();
		const positioningBounds = positioningContainer.getBoundingClientRect();
		const horizontalBoundary = TOOLBAR_WIDTH / 2 + VIEWPORT_PADDING;
		const viewportLeft = viewportBounds.left + horizontalBoundary;
		const viewportRight = viewportBounds.right - horizontalBoundary;
		const clientLeft = Math.min(
			viewportRight,
			Math.max(viewportLeft, lastRectangle.left + lastRectangle.width / 2)
		);
		const fitsBelow =
			lastRectangle.bottom + SELECTION_GAP + TOOLBAR_HEIGHT + VIEWPORT_PADDING <=
			viewportBounds.bottom;

		position = {
			left: clientLeft - positioningBounds.left,
			top: fitsBelow
				? lastRectangle.bottom + SELECTION_GAP - positioningBounds.top
				: firstRectangle.top - SELECTION_GAP - positioningBounds.top,
			placement: fitsBelow ? 'below' : 'above'
		};
		anchor = nextAnchor;
	}

	function schedulePositionUpdate() {
		if (selectionPointerId !== null || animationFrameId !== null) return;
		animationFrameId = requestAnimationFrame(updatePosition);
	}

	function handlePointerDown(event: PointerEvent) {
		const selectionContainer = container;
		if (
			!event.isPrimary ||
			event.button !== 0 ||
			!(event.target instanceof Node) ||
			!selectionContainer.contains(event.target)
		) {
			return;
		}

		selectionPointerId = event.pointerId;
		cancelPositionUpdate();
		clearActions();
	}

	function handlePointerUp(event: PointerEvent) {
		if (event.pointerId !== selectionPointerId) return;
		selectionPointerId = null;
		schedulePositionUpdate();
	}

	function handlePointerCancel(event: PointerEvent) {
		if (event.pointerId !== selectionPointerId) return;
		selectionPointerId = null;
		cancelPositionUpdate();
		clearActions();
	}

	function handleWindowBlur() {
		selectionPointerId = null;
		cancelPositionUpdate();
		clearActions();
	}

	function preserveSelection(event: PointerEvent) {
		event.preventDefault();
	}

	function chooseAction(kind: AnnotationKind) {
		if (!anchor) return;
		onSelect({ kind, anchor });
		clearActions();
		window.getSelection()?.removeAllRanges();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !position) return;
		clearActions();
		window.getSelection()?.removeAllRanges();
	}

	onMount(() => {
		const observer = new ResizeObserver(schedulePositionUpdate);
		observer.observe(viewport);
		window.addEventListener('blur', handleWindowBlur);
		viewport.addEventListener('scroll', schedulePositionUpdate, { passive: true });
		eventRoot.addEventListener('pointerdown', handlePointerDown);
		eventRoot.addEventListener('pointerup', handlePointerUp);
		eventRoot.addEventListener('pointercancel', handlePointerCancel);
		document.addEventListener('selectionchange', schedulePositionUpdate);
		eventRoot.addEventListener('keydown', handleKeydown);

		return () => {
			observer.disconnect();
			cancelPositionUpdate();
			window.removeEventListener('blur', handleWindowBlur);
			viewport.removeEventListener('scroll', schedulePositionUpdate);
			eventRoot.removeEventListener('pointerdown', handlePointerDown);
			eventRoot.removeEventListener('pointerup', handlePointerUp);
			eventRoot.removeEventListener('pointercancel', handlePointerCancel);
			document.removeEventListener('selectionchange', schedulePositionUpdate);
			eventRoot.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if position}
	<div
		class="text-selection-actions"
		class:is-above={position.placement === 'above'}
		style:left={`${position.left}px`}
		style:top={`${position.top}px`}
		style:--toolbar-width={`${TOOLBAR_WIDTH}px`}
		style:--toolbar-height={`${TOOLBAR_HEIGHT}px`}
		role="group"
		aria-label="Text selection actions"
	>
		<div class="selection-action">
			<SquareIconButton
				type="button"
				aria-label="Add comment"
				aria-describedby={commentTooltipId}
				onpointerdown={preserveSelection}
				onclick={() => chooseAction('comment')}
			>
				<ChatCenteredTextIcon aria-hidden="true" size={20} weight="regular" />
			</SquareIconButton>
			<span id={commentTooltipId} role="tooltip">Add comment</span>
		</div>
		<div class="selection-action">
			<SquareIconButton
				type="button"
				aria-label="Propose change"
				aria-describedby={changeTooltipId}
				onpointerdown={preserveSelection}
				onclick={() => chooseAction('change')}
			>
				<EraserIcon aria-hidden="true" size={20} weight="regular" />
			</SquareIconButton>
			<span id={changeTooltipId} role="tooltip">Propose change</span>
		</div>
	</div>
{/if}

<style>
	.text-selection-actions {
		position: absolute;
		z-index: 60;
		display: flex;
		box-sizing: border-box;
		width: var(--toolbar-width);
		height: var(--toolbar-height);
		align-items: center;
		padding: 2px;
		border: 1px solid var(--color-demo-line);
		border-radius: var(--radius-demo-popover);
		background: var(--color-demo-surface);
		box-shadow: none;
		transform: translateX(-50%);
	}

	.text-selection-actions.is-above {
		transform: translate(-50%, -100%);
	}

	.selection-action {
		position: relative;
		display: flex;
	}

	.selection-action :global(button) {
		width: 26px;
		height: 25px;
	}

	.selection-action span {
		position: absolute;
		top: calc(100% + 7px);
		left: 50%;
		width: max-content;
		max-width: min(180px, calc(100cqw - 24px));
		padding: 8px 10px;
		border-radius: var(--radius-demo-control);
		background: var(--color-demo-ink-secondary);
		color: var(--color-demo-surface);
		font-size: 12px;
		line-height: 1.4;
		opacity: 0;
		pointer-events: none;
		transform: translateX(-50%);
		transition: opacity 100ms ease;
		visibility: hidden;
		white-space: nowrap;
	}

	.is-above .selection-action span {
		top: auto;
		bottom: calc(100% + 7px);
	}

	.selection-action:first-child span {
		left: 0;
		transform: none;
	}

	.selection-action:last-child span {
		right: 0;
		left: auto;
		transform: none;
	}

	.selection-action:hover span,
	.selection-action:focus-within span {
		opacity: 1;
		visibility: visible;
	}

	@media (prefers-reduced-motion: reduce) {
		.selection-action span {
			transition: none;
		}
	}
</style>
