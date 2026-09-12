<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import DotsThreeVerticalIcon from 'phosphor-svelte/lib/DotsThreeVerticalIcon';

	import SquareIconButton from './SquareIconButton.svelte';

	let {
		label,
		menuLabel = label,
		rootClass = 'relative flex shrink-0 items-center',
		menuClass = 'top-[calc(100%+5px)] right-0 w-[180px]',
		iconSize = 22,
		children
	}: {
		label: string;
		menuLabel?: string;
		rootClass?: string;
		menuClass?: string;
		iconSize?: number;
		children: Snippet<[(restoreFocus?: boolean) => void]>;
	} = $props();

	const componentId = $props.id();
	const menuId = `${componentId}-menu`;
	let isOpen = $state(false);
	let rootElement = $state<HTMLDivElement>();
	let triggerElement = $state<HTMLButtonElement>();
	let menuElement = $state<HTMLDivElement>();

	function menuItems(): HTMLElement[] {
		return Array.from(
			menuElement?.querySelectorAll<HTMLElement>(
				'[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'
			) ?? []
		);
	}

	function closeMenu(restoreFocus = false) {
		isOpen = false;
		if (restoreFocus) {
			void tick().then(() => triggerElement?.focus({ preventScroll: true }));
		}
	}

	function openMenuAndFocusItem(position: 'first' | 'last') {
		isOpen = true;
		void tick().then(() => {
			const items = menuItems();
			items[position === 'first' ? 0 : items.length - 1]?.focus();
		});
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			openMenuAndFocusItem('first');
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			openMenuAndFocusItem('last');
		}
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		const items = menuItems();
		if (items.length === 0) return;

		event.preventDefault();
		const currentIndex = items.indexOf(document.activeElement as HTMLElement);
		let nextIndex: number;
		if (event.key === 'Home') nextIndex = 0;
		else if (event.key === 'End') nextIndex = items.length - 1;
		else if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
		else nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
		items[nextIndex]?.focus();
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (isOpen && !rootElement?.contains(event.target as Node)) closeMenu();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!isOpen || event.key !== 'Escape') return;
		event.preventDefault();
		closeMenu(true);
	}

	function handleFocusOut(event: FocusEvent) {
		if (isOpen && !rootElement?.contains(event.relatedTarget as Node | null)) closeMenu();
	}
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeydown} />

<div class={rootClass} bind:this={rootElement} onfocusout={handleFocusOut}>
	<SquareIconButton
		type="button"
		aria-label={label}
		aria-haspopup="menu"
		aria-expanded={isOpen}
		aria-controls={isOpen ? menuId : undefined}
		bind:element={triggerElement}
		onclick={() => (isOpen = !isOpen)}
		onkeydown={handleTriggerKeydown}
	>
		<DotsThreeVerticalIcon aria-hidden="true" size={iconSize} weight="regular" />
	</SquareIconButton>

	{#if isOpen}
		<div
			id={menuId}
			class={`absolute z-30 rounded-demo-popover border border-demo-line bg-demo-surface p-1 text-demo-ink shadow-none ${menuClass}`}
			role="menu"
			tabindex="-1"
			aria-label={menuLabel}
			bind:this={menuElement}
			onkeydown={handleMenuKeydown}
		>
			{@render children(closeMenu)}
		</div>
	{/if}
</div>
