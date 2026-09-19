<script module lang="ts">
	type Card = {
		title: string;
		description: string;
		illustration: 'screenshot' | 'layers';
		width: string;
	};

	const cards = [
		{
			title: 'Screenshot or recording',
			description:
				'Upload a screenshot if the buyer sent changes by email or text, or a recording if you discussed them in a conversation.',
			illustration: 'screenshot',
			width: '590px'
		},
		{
			title: 'Redlined contract',
			description:
				'Upload a redlined contract if the buyer made edits or comments directly in the document.',
			illustration: 'layers',
			width: '480px'
		}
	] satisfies Card[];
</script>

<script lang="ts">
	let { onStart }: { onStart?: () => void } = $props();
</script>

{#snippet resourceCard(card: Card)}
	<div class="flex w-full" style:max-width={card.width}>
		<div
			class="flex w-[108px] shrink-0 items-center justify-center rounded-l-2xl bg-demo-canvas/60"
			aria-hidden="true"
		>
			{#if card.illustration === 'screenshot'}
				{@render screenshotIllustration()}
			{:else}
				{@render layersIllustration()}
			{/if}
		</div>

		<div
			class="flex min-h-[108px] flex-1 flex-col justify-center rounded-r-2xl border border-l-0 border-demo-line/50 bg-demo-surface px-[18px] py-[12px] text-left"
		>
			<h2 class="text-[16.5px] leading-[1.35] font-medium tracking-[-0.01em] text-demo-ink">
				{card.title}
			</h2>

			<p class="mt-[7px] text-[14px] leading-[1.5] text-demo-ink-muted">
				{card.description}
			</p>
		</div>
	</div>
{/snippet}

{#snippet layersIllustration()}
	<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-[64px]">
		<path
			d="M17 55.5L47.8 72.5L79 57L48.2 40L17 55.5Z"
			fill="var(--color-demo-canvas)"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linejoin="round"
		/>

		<path
			d="M17 42.5L47.8 59.5L79 44L48.2 27L17 42.5Z"
			fill="var(--color-demo-canvas)"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linejoin="round"
		/>

		<path
			d="M17 29.5L47.8 46.5L79 31L48.2 14L17 29.5Z"
			fill="var(--color-demo-canvas)"
			stroke="var(--color-demo-accent)"
			stroke-width="3"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet screenshotIllustration()}
	<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-[64px]">
		<path
			d="M30 14H22C17.6 14 14 17.6 14 22V30"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M66 14H74C78.4 14 82 17.6 82 22V30"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M30 82H22C17.6 82 14 78.4 14 74V66"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M66 82H74C78.4 82 82 78.4 82 74V66"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<rect
			x="25"
			y="25"
			width="46"
			height="46"
			rx="11"
			fill="var(--color-demo-canvas)"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
		/>

		<path
			d="M27 60L41.5 45.5C42.3 44.7 43.7 44.7 44.5 45.5L53.5 54.5"
			stroke="var(--color-demo-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<path
			d="M48 66L59.5 54.5C60.3 53.7 61.7 53.7 62.5 54.5L69 61"
			stroke="var(--color-demo-accent)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<div class="h-full overflow-auto px-(--app-gutter)">
	<section
		class="mx-auto w-full max-w-[777px] pt-[70px] text-center"
		aria-labelledby="request-upload-title"
	>
		<h1
			id="request-upload-title"
			class="text-[21.5px] leading-[1.22] tracking-[-0.02em] text-demo-ink"
		>
			Upload changes the buyer requested
		</h1>

		<p class="mx-auto mt-[13px] max-w-[438px] text-[15.5px] leading-[1.42] text-demo-ink-muted">
			We’ll show you what you can accept, what needs approval, and how to respond to anything we
			can’t accept.
		</p>

		<button
			type="button"
			class="group relative mt-[40px] grid min-h-[283px] w-full cursor-pointer place-items-center rounded-2xl border-0 bg-demo-canvas/40 px-[29.2px] text-center font-[inherit] text-[inherit] transition-colors hover:bg-demo-canvas/70 focus-visible:bg-demo-canvas/60 focus-visible:ring-2 focus-visible:ring-demo-accent/40 focus-visible:ring-offset-2"
			data-demo-hit
			onclick={() => onStart?.()}
		>
			<svg
				class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
				aria-hidden="true"
			>
				<rect
					x="0.75"
					y="0.75"
					width="calc(100% - 1.5px)"
					height="calc(100% - 1.5px)"
					rx="15"
					fill="none"
					stroke="var(--color-demo-line)"
					stroke-width="1.3"
					stroke-dasharray="7 5"
					class="transition-colors group-hover:stroke-demo-ink-muted/30 group-focus-visible:stroke-demo-ink-muted/30"
				/>
			</svg>

			<div class="relative flex flex-col items-center">
				<span class="max-w-[298px] text-[15.5px] leading-[1.5] text-demo-ink-muted">
					Drop a screenshot, recording, or redlined contract here
				</span>

				<span
					class="mt-[20px] inline-flex min-w-[92px] items-center justify-center rounded-full bg-demo-accent px-[22px] py-[11px] text-[15.5px] text-white transition-[filter] group-hover:brightness-95 group-focus-visible:brightness-95"
				>
					Start
				</span>
			</div>
		</button>
	</section>

	<section class="mx-auto mt-[90px] w-full max-w-[1262px] pb-[80px]" aria-label="Helpful resources">
		<div class="flex flex-col gap-[20px] md:flex-row md:justify-between md:gap-[80px]">
			{#each cards as card}
				{@render resourceCard(card)}
			{/each}
		</div>
	</section>
</div>
