<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import SquareIconButton from './SquareIconButton.svelte';

	let {
		title,
		onClose,
		children
	}: {
		title: string;
		onClose: () => void;
		children?: Snippet;
	} = $props();

	let panelElement = $state<HTMLDivElement>();
	const titleId = $props.id();

	onMount(() => {
		panelElement?.focus({ preventScroll: true });

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			onClose();
		};

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) onClose();
	}
</script>

<div
	class="absolute inset-0 z-10 flex items-stretch justify-center bg-demo-canvas/70 p-4 text-demo-ink"
	data-demo-hint-layer
	role="presentation"
	onclick={handleBackdropClick}
	onpointerdown={(event) => {
		if (event.target === event.currentTarget) event.stopPropagation();
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') onClose();
	}}
>
	<div
		bind:this={panelElement}
		class="relative flex h-full min-h-0 w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-demo-line bg-demo-surface shadow-none"
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
	>
		<div class="absolute top-4 right-4 z-10">
			<SquareIconButton type="button" aria-label="Close modal" data-demo-hit onclick={onClose}>
				<XIcon aria-hidden="true" size={22} weight="regular" />
			</SquareIconButton>
		</div>

		<header class="min-w-0 px-4 py-4 pr-14">
			<h2 id={titleId} class="text-[17.5px] leading-tight font-medium text-demo-ink">{title}</h2>
		</header>

		{#if children}
			<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
				{@render children()}
			</div>
		{/if}
	</div>
</div>
