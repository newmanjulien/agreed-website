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
	import type { Attachment } from 'svelte/attachments';

	let {
		onStart,
		highlighted = false,
		showResources = false,
		compact = false,
		registerTarget,
		dropzoneTarget
	}: {
		onStart?: () => void;
		highlighted?: boolean;
		showResources?: boolean;
		compact?: boolean;
		registerTarget?: (name: string, element: Element | null) => void;
		dropzoneTarget?: string;
	} = $props();

	const titleId = $props.id();
	const interactive = $derived(onStart !== undefined);

	const attachDropzone: Attachment = (node) => {
		if (!dropzoneTarget || !registerTarget) return;
		registerTarget(dropzoneTarget, node);
		return () => registerTarget(dropzoneTarget, null);
	};
</script>

{#snippet resourceCard(card: Card)}
	<div class="flex w-full" style:max-width={card.width}>
		<div
			class="flex w-[108px] shrink-0 items-center justify-center rounded-l-2xl bg-canvas/60"
			aria-hidden="true"
		>
			{#if card.illustration === 'screenshot'}
				{@render screenshotIllustration()}
			{:else}
				{@render layersIllustration()}
			{/if}
		</div>

		<div
			class="flex min-h-[108px] flex-1 flex-col justify-center rounded-r-2xl border border-l-0 border-line/50 bg-surface px-[18px] py-[12px] text-left"
		>
			<h2 class="text-[16.5px] leading-[1.35] font-medium tracking-[-0.01em] text-ink">
				{card.title}
			</h2>

			<p class="mt-[7px] text-[14px] leading-[1.5] text-ink-muted">
				{card.description}
			</p>
		</div>
	</div>
{/snippet}

{#snippet layersIllustration()}
	<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-[64px]">
		<path
			d="M17 55.5L47.8 72.5L79 57L48.2 40L17 55.5Z"
			fill="var(--color-canvas)"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linejoin="round"
		/>

		<path
			d="M17 42.5L47.8 59.5L79 44L48.2 27L17 42.5Z"
			fill="var(--color-canvas)"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linejoin="round"
		/>

		<path
			d="M17 29.5L47.8 46.5L79 31L48.2 14L17 29.5Z"
			fill="var(--color-canvas)"
			stroke="var(--color-accent)"
			stroke-width="3"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet screenshotIllustration()}
	<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-[64px]">
		<path
			d="M30 14H22C17.6 14 14 17.6 14 22V30"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M66 14H74C78.4 14 82 17.6 82 22V30"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M30 82H22C17.6 82 14 78.4 14 74V66"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<path
			d="M66 82H74C78.4 82 82 78.4 82 74V66"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
		/>

		<rect
			x="25"
			y="25"
			width="46"
			height="46"
			rx="11"
			fill="var(--color-canvas)"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
		/>

		<path
			d="M27 60L41.5 45.5C42.3 44.7 43.7 44.7 44.5 45.5L53.5 54.5"
			stroke="var(--color-ink-muted)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<path
			d="M48 66L59.5 54.5C60.3 53.7 61.7 53.7 62.5 54.5L69 61"
			stroke="var(--color-accent)"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<div
	class={[
		'bg-surface px-(--app-gutter)',
		compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'h-full overflow-auto'
	]}
>
	<section
		class={[
			'mx-auto w-full max-w-[777px] text-center',
			compact ? 'flex min-h-0 w-full flex-1 flex-col pt-7' : 'pt-[70px]'
		]}
		aria-labelledby={titleId}
	>
		<h1 id={titleId} class="text-[21.5px] leading-[1.22] tracking-[-0.02em] text-ink">
			Upload changes the buyer requested
		</h1>

		<p class="mx-auto mt-[13px] max-w-[438px] text-[15.5px] leading-[1.42] text-ink-muted">
			We’ll show you what you can accept, what needs approval, and how to respond to anything we
			can’t accept.
		</p>

		<button
			type="button"
			class={[
				'relative grid w-full place-items-center rounded-2xl border-0 px-[29.2px] text-center font-[inherit] text-[inherit] transition-colors',
				compact ? 'mt-6 mb-7 min-h-0 flex-1' : 'mt-[40px] min-h-[283px]',
				interactive &&
					'group cursor-pointer bg-canvas/40 hover:bg-canvas/70 focus-visible:bg-canvas/60 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
				!interactive && (highlighted ? 'bg-selection-highlight/28' : 'bg-canvas/40')
			]}
			tabindex={interactive ? undefined : -1}
			aria-disabled={interactive ? undefined : true}
			data-demo-hit={interactive ? true : undefined}
			onclick={() => onStart?.()}
			{@attach attachDropzone}
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
					stroke={highlighted ? 'var(--color-accent)' : 'var(--color-line)'}
					stroke-width="1.3"
					stroke-dasharray="7 5"
					class={[
						'transition-colors',
						interactive && 'group-hover:stroke-ink-muted/30 group-focus-visible:stroke-ink-muted/30'
					]}
				/>
			</svg>

			<div class="relative flex flex-col items-center">
				<span class="max-w-[298px] text-[15.5px] leading-[1.5] text-ink-muted">
					{highlighted
						? 'Drop to upload the buyer’s requested changes'
						: 'Drop a screenshot, recording, or redlined contract here'}
				</span>

				<span
					class={[
						'mt-[20px] inline-flex min-w-[92px] items-center justify-center rounded-full bg-accent px-[22px] py-[11px] text-[15.5px] text-white',
						interactive && 'transition-[filter] group-hover:brightness-95 group-focus-visible:brightness-95'
					]}
				>
					Start
				</span>
			</div>
		</button>
	</section>

	{#if showResources}
		<section class="mx-auto mt-[90px] w-full max-w-[1262px] pb-[80px]" aria-label="Helpful resources">
			<div class="flex flex-col gap-[20px] md:flex-row md:justify-between md:gap-[80px]">
				{#each cards as card}
					{@render resourceCard(card)}
				{/each}
			</div>
		</section>
	{/if}
</div>
