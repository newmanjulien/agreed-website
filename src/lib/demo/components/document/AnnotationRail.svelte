<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import type { AgreementClauseProposals } from '$lib/demo/document/agreement-control-values';
	import type { AnnotationSession } from '$lib/demo/document/annotations/annotation-session.svelte';
	import type {
		AnnotationComposerState,
		DocumentAnnotation
	} from '$lib/demo/document/annotations/types';
	import type { DiscussionSession } from '$lib/demo/document/discussions/discussion-session.svelte';
	import type {
		DiscussionTarget,
		DiscussionThreadAction
	} from '$lib/demo/document/discussions/types';
	import { getDocumentViewportMetrics } from '$lib/demo/document/document-viewport';
	import AnnotationComposer from './AnnotationComposer.svelte';
	import {
		packAnnotationRail,
		type AnnotationRailLayoutItem
	} from './annotation-rail-layout';
	import DiscussionThread from './DiscussionThread.svelte';

	type StoredAnnotationCard = {
		type: 'stored-annotation';
		id: string;
		annotation: DocumentAnnotation;
		ranges: Range[];
		order: number;
	};
	type CreationComposerCard = {
		type: 'creation-composer';
		id: string;
		composer: AnnotationComposerState;
		ranges: Range[];
		order: number;
	};
	type ClauseProposalCard = {
		type: 'clause-proposal';
		id: string;
		clauseId: string;
		proposal: AgreementClauseProposals[string];
		order: number;
	};
	type RailCard = StoredAnnotationCard | CreationComposerCard | ClauseProposalCard;
	type AnnotationRangeMeasurement = {
		top: number;
		center: number;
	};
	type MeasuredAnnotationCard = AnnotationRailLayoutItem & {
		targetTop: number;
	};

	const CREATION_COMPOSER_CARD_ID = 'annotation-creation-composer';

	let {
		session,
		discussion,
		clauseProposals,
		documentStageElement,
		viewport,
		onCancelComposer,
		onSubmitComposer,
		onDiscussionAction,
		bottom = $bindable(0)
	}: {
		session: AnnotationSession;
		discussion: DiscussionSession;
		clauseProposals: Readonly<AgreementClauseProposals>;
		documentStageElement?: HTMLElement;
		viewport: HTMLElement;
		onCancelComposer: () => void;
		onSubmitComposer: () => void;
		onDiscussionAction: (target: DiscussionTarget, action: DiscussionThreadAction) => void;
		bottom?: number;
	} = $props();

	let railElement = $state<HTMLDivElement>();
	let placements = $state<Record<string, number>>({});
	let previouslyPlacedCardIds = $state<Set<string>>(new Set());
	let cards = $derived.by<RailCard[]>(() => {
		const creationComposer = session.composer;
		return [
			...session.resolvedAnnotations.map(({ annotation, ranges }, order) => ({
				type: 'stored-annotation' as const,
				id: annotation.id,
				annotation,
				ranges,
				order
			})),
			...(creationComposer && session.creationRanges.length > 0
				? [
						{
							type: 'creation-composer' as const,
							id: CREATION_COMPOSER_CARD_ID,
							ranges: session.creationRanges,
							order: session.annotations.length,
							composer: creationComposer
						}
					]
				: []),
			...Object.entries(clauseProposals).map(([clauseId, proposal], index) => ({
				type: 'clause-proposal' as const,
				id: proposalCardId(clauseId),
				clauseId,
				proposal,
				order: session.annotations.length + 1 + index
			}))
		];
	});
	let activeCardId = $derived.by(() => {
		if (session.composer) return CREATION_COMPOSER_CARD_ID;
		const target = discussion.composer?.target ?? discussion.rootDeletion?.target;
		if (!target) return null;
		return target.kind === 'annotation' ? target.id : proposalCardId(target.id);
	});

	function proposalCardId(clauseId: string) {
		return `clause-proposal:${clauseId}`;
	}

	function clauseRanges(clauseId: string): Range[] {
		if (!documentStageElement) return [];
		return Array.from(
			documentStageElement.querySelectorAll<HTMLElement>('[data-clause-id]')
		)
			.filter((element) => element.dataset.clauseId === clauseId)
			.map((element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				return range;
			});
	}

	function cardRanges(card: RailCard): Range[] {
		return card.type === 'clause-proposal' ? clauseRanges(card.clauseId) : card.ranges;
	}

	function measureFirstAnchor(ranges: Range[]): AnnotationRangeMeasurement | undefined {
		for (const range of ranges) {
			const rectangles = Array.from(range.getClientRects()).filter(
				(rectangle) => rectangle.width > 0 || rectangle.height > 0
			);
			if (rectangles.length === 0) continue;
			const top = Math.min(...rectangles.map((rectangle) => rectangle.top));
			const bottom = Math.max(...rectangles.map((rectangle) => rectangle.bottom));
			return { top, center: (top + bottom) / 2 };
		}
	}

	function isDesktopRail() {
		return viewport.clientWidth >= 900;
	}

	function updateLayout() {
		if (!documentStageElement || !railElement || !isDesktopRail()) {
			placements = {};
			previouslyPlacedCardIds = new Set();
			bottom = 0;
			return;
		}

		const stageTop = documentStageElement.getBoundingClientRect().top;
		const cardElements = new Map(
			Array.from(railElement.querySelectorAll<HTMLElement>('[data-annotation-card-content]')).map(
				(element) => [element.dataset.annotationCardContent!, element]
			)
		);
		const measuredCards = cards
			.map((card) => {
				const anchor = measureFirstAnchor(cardRanges(card));
				const element = cardElements.get(card.id);
				if (!anchor || !element) return null;
				const height = element.getBoundingClientRect().height;
				return {
					id: card.id,
					anchorTop: anchor.top - stageTop,
					height,
					order: card.order,
					targetTop: anchor.center - stageTop - height / 2
				};
			})
			.filter((card): card is MeasuredAnnotationCard => card !== null);
		const activeCard = measuredCards.find((card) => card.id === activeCardId);

		const layout = packAnnotationRail(
			measuredCards,
			activeCard ? { id: activeCard.id, targetTop: activeCard.targetTop } : null
		);
		previouslyPlacedCardIds = new Set(Object.keys(placements));
		placements = layout.placements;
		bottom = layout.bottom;
	}

	function handleStoredDiscussionAction(
		target: DiscussionTarget,
		action: DiscussionThreadAction,
		card: RailCard
	) {
		onDiscussionAction(target, action);
		if (action.type === 'activate') void scrollAnchorIntoView(cardRanges(card));
	}

	function discussionTarget(card: StoredAnnotationCard | ClauseProposalCard): DiscussionTarget {
		return card.type === 'stored-annotation'
			? { kind: 'annotation', id: card.id }
			: { kind: 'clause-proposal', id: card.clauseId };
	}

	async function scrollAnchorIntoView(ranges: Range[]) {
		await tick();

		if (isDesktopRail()) return;

		const anchor = measureFirstAnchor(ranges);
		const viewportBounds = viewport.getBoundingClientRect();
		const sheetTop = railElement?.getBoundingClientRect().top ?? viewportBounds.bottom;
		if (!anchor) return;

		const viewportMetrics = getDocumentViewportMetrics(viewport);
		const availableBottom = Math.max(viewportMetrics.top, sheetTop - viewportMetrics.gap);
		const visibleCenter = (viewportMetrics.top + availableBottom) / 2;
		viewport.scrollBy({
			top: anchor.center - visibleCenter,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'auto'
				: 'smooth'
		});
	}

	$effect(() => {
		const currentCards = cards;
		const rail = railElement;
		if (!rail || currentCards.length === 0 || typeof ResizeObserver === 'undefined') {
			placements = {};
			previouslyPlacedCardIds = new Set();
			bottom = 0;
			return;
		}

		let cancelled = false;
		let observer: ResizeObserver | undefined;
		void tick().then(() => {
			if (cancelled) return;
			observer = new ResizeObserver(updateLayout);
			observer.observe(rail);
			for (const card of rail.querySelectorAll<HTMLElement>('[data-annotation-card-id]')) {
				observer.observe(card);
			}
			updateLayout();
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	});

	$effect(() => {
		const currentActiveCardId = activeCardId;
		if (!railElement) return;
		let cancelled = false;
		void tick().then(() => {
			if (!cancelled && currentActiveCardId === activeCardId) updateLayout();
		});
		return () => {
			cancelled = true;
		};
	});

	onMount(() => {
		const observer = new ResizeObserver(updateLayout);
		observer.observe(viewport);
		return () => {
			observer.disconnect();
		};
	});

	onDestroy(() => {
		bottom = 0;
	});
</script>

{#snippet composerEditor(composer: AnnotationComposerState)}
	<AnnotationComposer
		kind={composer.kind}
		text={composer.text}
		onTextChange={(text) => session.updateComposerText(text)}
		onCancel={onCancelComposer}
		onSubmit={onSubmitComposer}
	/>
{/snippet}

<div class="annotation-rail" bind:this={railElement}>
	{#each cards as card (card.id)}
		<div
			class="annotation-card"
			class:is-mobile-visible={card.type === 'creation-composer' ||
				card.id === activeCardId}
			class:is-positioned={placements[card.id] !== undefined}
			class:was-positioned={previouslyPlacedCardIds.has(card.id)}
			data-annotation-card-id={card.id}
			style:transform={`translateY(${placements[card.id] ?? 0}px)`}
		>
			<div class="annotation-card-content" data-annotation-card-content={card.id}>
				{#if card.type === 'creation-composer'}
					{@render composerEditor(card.composer)}
				{:else}
					{@const target = discussionTarget(card)}
					{@const root = card.type === 'stored-annotation' ? card.annotation : card.proposal}
					<DiscussionThread
						{root}
						{target}
						composer={discussion.isActive(target) ? discussion.composer : null}
						rootDeletion={discussion.rootDeletion}
						onAction={(action) => handleStoredDiscussionAction(target, action, card)}
					/>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.annotation-rail {
		position: relative;
		width: 100%;
	}

	.annotation-card {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		visibility: hidden;
	}

	.annotation-card.is-positioned {
		visibility: visible;
	}

	.annotation-card:has(:global([aria-haspopup='menu'][aria-expanded='true'])) {
		z-index: 1;
	}

	.annotation-card.was-positioned {
		transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	@container (width >= 900px) {
		.annotation-card-content {
			width: calc(100% * var(--panel-content-inverse-scale));
			transform: scale(var(--panel-content-scale));
			transform-origin: top left;
		}
	}

	@container (width < 900px) {
		.annotation-card {
			display: none;
			position: relative;
			transform: none !important;
			visibility: visible;
		}

		.annotation-card.is-mobile-visible {
			display: block;
		}

		.annotation-card :global(.discussion-thread) {
			padding-bottom: env(safe-area-inset-bottom);
			border-width: 1px 0 0;
			border-radius: var(--radius-demo-widget) var(--radius-demo-widget) 0 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.annotation-card.was-positioned {
			transition: none;
		}
	}
</style>
