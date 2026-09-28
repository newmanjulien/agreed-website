<script lang="ts">
	import DemoHeader from './DemoHeader.svelte';
	import { demoStartingPoints } from './demo-points';
	import { mockRequests } from './mock-requests';
	import RequestProcessing from './RequestProcessing.svelte';
	import RequestDiscussionModal from './RequestDiscussionModal.svelte';
	import RequestsInfoModal from './RequestsInfoModal.svelte';
	import ReviewScreen from './ReviewScreen.svelte';
	import UploadScreen from './UploadScreen.svelte';
	import type { AcceptRequest, DiscussionGuide } from './types';

	const STAGE_HEIGHT = 800;
	const HINT_PAD = 4;
	const HINT_MS = 700;

	type Screen = 'upload' | 'processing' | 'review';
	type HintRect = { left: number; top: number; width: number; height: number };

	let screen = $state<Screen>('upload');
	let acceptedRequestIds = $state<string[]>([]);
	let infoModalOpen = $state(false);
	let discussionGuide = $state<DiscussionGuide | null>(null);
	let pointsLeft = $derived(
		demoStartingPoints - mockRequests.reduce(
			(spent, request) => request.decision === 'canAccept' && acceptedRequestIds.includes(request.id)
				? spent + request.points : spent,
			0
		)
	);
	let frameWidth = $state(0);
	let frameHeight = $state(0);
	let frameElement = $state<HTMLDivElement>();
	let hintRects = $state<HintRect[]>([]);
	let hintsVisible = $state(false);
	let hintToken = $state(0);

	const scale = $derived(frameHeight > 0 ? Math.min(1, frameHeight / STAGE_HEIGHT) : 1);
	const stageWidth = $derived(frameWidth / scale);
	const offsetY = $derived((frameHeight - STAGE_HEIGHT * scale) / 2);

	function isDemoHit(event: Event) {
		return event
			.composedPath()
			.some((node) => node instanceof HTMLElement && node.hasAttribute('data-demo-hit'));
	}

	function hideHints() {
		hintsVisible = false;
	}

	function hintRoot() {
		return frameElement?.querySelector('[data-demo-hint-layer]') ?? frameElement;
	}

	function showHints() {
		const root = hintRoot();
		if (!root || !frameElement) return;

		const frameRect = frameElement.getBoundingClientRect();
		hintRects = [...root.querySelectorAll('[data-demo-hit]')].map((el) => {
			const rect = el.getBoundingClientRect();
			return {
				left: rect.left - frameRect.left - HINT_PAD,
				top: rect.top - frameRect.top - HINT_PAD,
				width: rect.width + HINT_PAD * 2,
				height: rect.height + HINT_PAD * 2
			};
		});

		if (hintRects.length === 0) {
			hideHints();
			return;
		}

		hintsVisible = true;
		hintToken += 1;
	}

	function handlePointerDown(event: PointerEvent) {
		if (isDemoHit(event)) {
			hideHints();
			return;
		}

		showHints();
	}

	function goTo(next: Screen) {
		screen = next;
		if (next === 'upload') {
			acceptedRequestIds = [];
			infoModalOpen = false;
			discussionGuide = null;
		}
		hideHints();
	}

	function toggleAccepted(request: AcceptRequest) {
		acceptedRequestIds = acceptedRequestIds.includes(request.id)
			? acceptedRequestIds.filter((id) => id !== request.id)
			: [...acceptedRequestIds, request.id];
	}

	$effect(() => {
		if (!hintsVisible) return;

		hintToken;
		const timer = window.setTimeout(hideHints, HINT_MS);
		return () => window.clearTimeout(timer);
	});
</script>

<div
	class="requests-demo relative h-full w-full overflow-hidden bg-surface"
	role="presentation"
	bind:this={frameElement}
	bind:clientWidth={frameWidth}
	bind:clientHeight={frameHeight}
	onpointerdown={handlePointerDown}
>
	<div
		class="absolute left-0 flex flex-col overflow-hidden bg-surface"
		style:width="{stageWidth}px"
		style:height="{STAGE_HEIGHT}px"
		style:top="{offsetY}px"
		style:transform="scale({scale})"
		style:transform-origin="top left"
	>
		<DemoHeader
			homeEnabled={screen === 'review'}
			onHome={() => goTo('upload')}
			pointsLeft={screen === 'review' ? pointsLeft : undefined}
		/>

		<div class="min-h-0 flex-1 overflow-hidden">
			{#if screen === 'upload'}
				<UploadScreen showResources onStart={() => goTo('processing')} />
			{:else if screen === 'processing'}
				<RequestProcessing onFinished={() => goTo('review')} />
			{:else}
				<ReviewScreen
					{acceptedRequestIds}
					onToggleAccept={toggleAccepted}
					onDiscuss={(guide) => (discussionGuide = guide)}
					onInfo={() => (infoModalOpen = true)}
				/>
			{/if}
		</div>
		{#if infoModalOpen}
			<RequestsInfoModal onClose={() => (infoModalOpen = false)} />
		{/if}
		{#if discussionGuide}
			<RequestDiscussionModal guide={discussionGuide} onClose={() => (discussionGuide = null)} />
		{/if}
	</div>

	{#if hintsVisible}
		<div class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
			{#each hintRects as rect}
				<div
					class="absolute rounded-[10px] border-2 border-accent bg-accent/20"
					style:left="{rect.left}px"
					style:top="{rect.top}px"
					style:width="{rect.width}px"
					style:height="{rect.height}px"
				></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.requests-demo {
		--app-header-height: 40px;
		--app-gutter: 32px;
	}
</style>
