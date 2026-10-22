<script lang="ts">
	import { onMount } from 'svelte';
	import ProductAnimation from '$lib/components/product-animation/ProductAnimation.svelte';
	import type { AnimationStep } from '$lib/components/product-animation/model';
	let { tour, label }: { tour: readonly AnimationStep[]; label: string } = $props();
	let frame: HTMLDivElement;
	let mounted = $state(false);
	onMount(() => {
		if (typeof IntersectionObserver === 'undefined') { mounted = true; return; }
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) { mounted = true; observer.disconnect(); }
		}, { rootMargin: '600px' });
		observer.observe(frame);
		return () => observer.disconnect();
	});
</script>

<div class="relative h-[430px] overflow-hidden rounded-lg border border-[#ebebeb] bg-canvas/60 shadow-feature select-none" bind:this={frame} role={mounted ? undefined : 'img'} aria-label={mounted ? undefined : label}>
	{#if mounted}<ProductAnimation {tour} {label} />{:else}<noscript><ProductAnimation {tour} {label} /></noscript>{/if}
</div>
