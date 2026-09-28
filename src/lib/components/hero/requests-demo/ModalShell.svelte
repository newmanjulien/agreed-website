<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import SquareIconButton from './SquareIconButton.svelte';

	let {
		title,
		onClose,
		placement = 'center',
		interactive = true,
		children
	}: {
		title: string;
		onClose: () => void;
		placement?: 'center' | 'right';
		interactive?: boolean;
		children?: Snippet;
	} = $props();

	let panelElement = $state<HTMLDivElement>();
	const titleId = $props.id();

	onMount(() => {
		if (!interactive) return;
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		panelElement?.focus({ preventScroll: true });

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				onClose();
				return;
			}
			if (event.key !== 'Tab' || !panelElement) return;

			const focusable = [...panelElement.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)].filter((element) => element.getClientRects().length > 0);
			const first = focusable[0];
			const last = focusable.at(-1);
			if (!first || !last) {
				event.preventDefault();
				panelElement.focus();
			} else if (!panelElement.contains(document.activeElement) || document.activeElement === panelElement) {
				event.preventDefault();
				(event.shiftKey ? last : first).focus();
			} else if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		window.addEventListener('keydown', onKey, true);
		return () => {
			window.removeEventListener('keydown', onKey, true);
			if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
		};
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) onClose();
	}
</script>

<div
	class={[
		'absolute inset-0 z-10 flex items-stretch p-4 text-ink',
		placement === 'right' ? 'justify-end bg-transparent' : 'justify-center bg-canvas/70'
	]}
	data-demo-hint-layer
	role="presentation"
	onclick={handleBackdropClick}
	onpointerdown={(event) => {
		if (event.target === event.currentTarget) event.stopPropagation();
	}}
>
	<div
		bind:this={panelElement}
		class={[
			'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-none',
			placement === 'right' ? 'max-w-[456px]' : 'max-w-[480px]'
		]}
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
			<h2 id={titleId} class="text-[17.5px] leading-tight font-medium text-ink">{title}</h2>
		</header>

		{#if children}
			<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
				{@render children()}
			</div>
		{/if}
	</div>
</div>
