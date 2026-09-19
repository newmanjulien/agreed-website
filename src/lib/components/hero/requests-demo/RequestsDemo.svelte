<script lang="ts">
	import DemoHeader from './DemoHeader.svelte';
	import RequestProcessing from './RequestProcessing.svelte';
	import RequestReview from './RequestReview.svelte';
	import RequestUpload from './RequestUpload.svelte';

	const STAGE_HEIGHT = 800;
	const HINT_PAD = 4;
	const HINT_MS = 700;

	type Screen = 'upload' | 'processing' | 'review';
	type HintRect = { left: number; top: number; width: number; height: number };

	let screen = $state<Screen>('upload');
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
		hideHints();
	}

	$effect(() => {
		if (!hintsVisible) return;

		hintToken;
		const timer = window.setTimeout(hideHints, HINT_MS);
		return () => window.clearTimeout(timer);
	});
</script>

<div
	class="requests-demo relative h-full w-full overflow-hidden bg-demo-surface"
	role="presentation"
	bind:this={frameElement}
	bind:clientWidth={frameWidth}
	bind:clientHeight={frameHeight}
	onpointerdown={handlePointerDown}
>
	<div
		class="absolute left-0 flex flex-col overflow-hidden bg-demo-surface"
		style:width="{stageWidth}px"
		style:height="{STAGE_HEIGHT}px"
		style:top="{offsetY}px"
		style:transform="scale({scale})"
		style:transform-origin="top left"
	>
		<DemoHeader homeEnabled={screen === 'review'} onHome={() => goTo('upload')} />

		<div class="min-h-0 flex-1 overflow-hidden">
			{#if screen === 'upload'}
				<RequestUpload onStart={() => goTo('processing')} />
			{:else if screen === 'processing'}
				<RequestProcessing onFinished={() => goTo('review')} />
			{:else}
				<RequestReview />
			{/if}
		</div>
	</div>

	{#if hintsVisible}
		<div class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
			{#each hintRects as rect}
				<div
					class="absolute rounded-[10px] border-2 border-demo-accent bg-demo-accent/20"
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
		--app-header-height: 44px;
		--app-gutter: 32px;
	}
</style>
