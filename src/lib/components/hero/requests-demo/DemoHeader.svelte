<script lang="ts">
	let {
		homeEnabled = false,
		onHome,
		pointsLeft
	}: {
		homeEnabled?: boolean;
		onHome?: () => void;
		pointsLeft?: number;
	} = $props();
</script>

<header class="h-[var(--app-header-height)] shrink-0 border-b border-line/60 bg-surface">
	<div class="demo-header-bar flex h-full w-full items-center px-1.5 sm:px-2.5 md:px-4">
		{#if homeEnabled}
			<button
				type="button"
				class="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0"
				aria-label="Agreed"
				data-demo-hit
				onclick={() => onHome?.()}
			>
				<img src="/logo.png" alt="" width="68" height="122" class="h-[22px] w-auto md:h-[26px]" />
			</button>
		{:else}
			<div class="flex shrink-0 items-center" aria-hidden="true">
				<img src="/logo.png" alt="" width="68" height="122" class="h-[22px] w-auto md:h-[26px]" />
			</div>
		{/if}

		<div class="ml-auto flex items-center gap-2.5 sm:gap-3">
			{#if pointsLeft !== undefined}
				<p
					class="text-[12px] leading-none text-ink-muted sm:text-[13px]"
					role="status"
					aria-label="{pointsLeft} points left"
				>
					<span class="font-medium tabular-nums text-ink">{pointsLeft}</span>
					<span> points left</span>
				</p>
			{/if}

			<div
				class="grid size-[26px] shrink-0 place-items-center rounded-full bg-selection-highlight text-[10.5px] font-medium text-accent"
				role="img"
				aria-label="User avatar"
			>
				JN
			</div>
		</div>
	</div>
</header>
