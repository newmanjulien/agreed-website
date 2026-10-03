<script lang="ts">
	import type { Snippet } from 'svelte';
	import { stageScale } from '$lib/components/contract-demo/document/document-viewport';

	let {
		text,
		label = text,
		children
	}: {
		text: string;
		label?: string;
		children: Snippet;
	} = $props();

	const componentId = $props.id();
	const tooltipId = `${componentId}-tooltip`;
	let trigger = $state<HTMLButtonElement>();
	let tooltip = $state<HTMLSpanElement>();
	let hovered = $state(false);
	let focused = $state(false);

	$effect(() => {
		const button = trigger, tip = tooltip;
		if (!button || !tip || !(hovered || focused)) return;
		const viewport = button.closest<HTMLElement>('[data-demo-viewport]')!;
		// The browser's top layer escapes the card's scroll clipping. Keep the demo's scale.
		tip.showPopover();
		const position = () => {
			const bounds = button.getBoundingClientRect();
			const frame = viewport.getBoundingClientRect();
			const scale = stageScale(button);
			const gap = 8 * scale;
			const width = tip.offsetWidth * scale, height = tip.offsetHeight * scale;
			const right = Math.min(frame.right - gap, Math.max(bounds.right, frame.left + gap + width));
			const below = bounds.bottom + gap;
			const top = below + height <= frame.bottom - gap ? below : bounds.top - gap - height;
			tip.style.right = `${window.innerWidth - right}px`;
			tip.style.top = `${Math.max(frame.top + gap, top)}px`;
			tip.style.transform = `scale(${scale})`;
		};
		position();
		window.addEventListener('scroll', position, true);
		const observer = new ResizeObserver(position);
		observer.observe(viewport);
		observer.observe(button.closest('.oceans-demo')!);
		return () => {
			window.removeEventListener('scroll', position, true);
			observer.disconnect();
			tip.hidePopover();
		};
	});
</script>

<span class="inline-flex">
	<button
		bind:this={trigger}
		type="button"
		class="inline-flex cursor-help items-center justify-center rounded-md border-0 bg-transparent p-0 text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
		aria-label={label}
		aria-describedby={tooltipId}
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
		onkeydowncapture={(event) => {
			if (event.key === 'Escape' && (hovered || focused)) {
				hovered = focused = false;
				event.stopPropagation();
			}
		}}
	>
		{@render children()}
	</button>
	<span
		bind:this={tooltip}
		id={tooltipId}
		role="tooltip"
		popover="manual"
		class="pointer-events-none fixed inset-auto m-0 w-max max-w-[18rem] origin-top-right rounded-base border-0 bg-ink-secondary px-2.5 py-2 text-left text-xs leading-[1.4] text-surface"
	>
		{text}
	</span>
</span>
