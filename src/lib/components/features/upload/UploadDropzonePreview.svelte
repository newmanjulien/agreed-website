<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	let {
		highlighted = false,
		registerTarget,
		dropzoneTarget
	}: {
		highlighted?: boolean;
		registerTarget?: (name: string, element: Element | null) => void;
		dropzoneTarget?: string;
	} = $props();

	const attachDropzone: Attachment = (node) => {
		if (!dropzoneTarget || !registerTarget) return;
		registerTarget(dropzoneTarget, node);
		return () => registerTarget(dropzoneTarget, null);
	};
</script>

<div class="flex h-full min-h-0 flex-col overflow-hidden bg-demo-surface px-(--app-gutter)">
	<section class="mx-auto flex min-h-0 w-full max-w-[777px] flex-1 flex-col pt-7 text-center">
		<h1 class="text-[21.5px] leading-[1.22] tracking-[-0.02em] text-demo-ink">
			Upload changes the buyer requested
		</h1>

		<p class="mx-auto mt-[13px] max-w-[438px] text-[15.5px] leading-[1.42] text-demo-ink-muted">
			We’ll show you what you can accept, what needs approval, and how to respond to anything we
			can’t accept.
		</p>

		<button
			type="button"
			class={[
				'relative mt-6 mb-7 grid min-h-0 w-full flex-1 place-items-center rounded-2xl border-0 px-[29.2px] text-center font-[inherit] text-[inherit] transition-colors',
				highlighted ? 'bg-demo-selection-highlight/28' : 'bg-demo-canvas/40'
			]}
			tabindex="-1"
			aria-disabled="true"
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
					stroke={highlighted ? 'var(--color-demo-accent)' : 'var(--color-demo-line)'}
					stroke-width="1.3"
					stroke-dasharray="7 5"
					class="transition-colors"
				/>
			</svg>

			<div class="relative flex flex-col items-center">
				<span class="max-w-[298px] text-[15.5px] leading-[1.5] text-demo-ink-muted">
					{highlighted
						? 'Drop to upload the buyer’s requested changes'
						: 'Drop a screenshot, recording, or redlined contract here'}
				</span>

				<span
					class="mt-[20px] inline-flex min-w-[92px] items-center justify-center rounded-full bg-demo-accent px-[22px] py-[11px] text-[15.5px] text-white"
				>
					Start
				</span>
			</div>
		</button>
	</section>
</div>
