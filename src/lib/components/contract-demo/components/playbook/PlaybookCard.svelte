<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children, label }: { children: Snippet; label: string } = $props();
	function containOverflow(element: HTMLElement) {
		const observer = new ResizeObserver(() => {
			element.style.overscrollBehavior = element.scrollHeight > element.clientHeight + 1 ? 'contain' : 'auto';
		});
		observer.observe(element);
		observer.observe(element.firstElementChild!);
		return { destroy: () => observer.disconnect() };
	}
</script>

<aside
	aria-label={label}
	use:containOverflow
	class="max-h-[calc(var(--demo-viewport-height)-2*var(--document-viewport-gap))] overflow-y-auto min-w-0 w-full rounded-base border border-line bg-surface p-3.5 text-[15px] leading-[1.45] text-ink shadow-none"
>
	<div class="flex flex-col gap-3 [&>*]:min-w-0 [&>*]:w-full [&>*]:shrink-0">
		{@render children()}
	</div>
</aside>
