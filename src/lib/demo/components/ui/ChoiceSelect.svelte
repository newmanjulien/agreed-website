<script lang="ts">
	import { onMount } from 'svelte';
	import ChoiceSelectView from './ChoiceSelectView.svelte';
	import type { ChoiceSelectOption } from './choice-select';

	let {
		id,
		value,
		options,
		disabled = false,
		describedBy,
		onChange,
		buttonElement = $bindable()
	}: {
		id?: string;
		value: string;
		options: ReadonlyArray<ChoiceSelectOption>;
		disabled?: boolean;
		describedBy?: string;
		onChange: (value: string) => void;
		buttonElement?: HTMLButtonElement;
	} = $props();

	const generatedId = $props.id();
	let rootElement = $state<HTMLDivElement>();
	let open = $state(false);
	let activeIndex = $state(0);
	let controlId = $derived(id ?? `choice-select-${generatedId}`);
	let selectedIndex = $derived(Math.max(0, options.findIndex((option) => option.value === value)));

	function setOpen(nextOpen: boolean, restoreFocus = false) {
		if (disabled && nextOpen) return;
		open = nextOpen;
		if (nextOpen) activeIndex = selectedIndex;
		if (restoreFocus) buttonElement?.focus({ preventScroll: true });
	}

	function choose(nextValue: string) {
		if (disabled) return;
		open = false;
		onChange(nextValue);
		buttonElement?.focus({ preventScroll: true });
	}

	function moveActive(direction: number) {
		if (options.length === 0) return;
		activeIndex = (activeIndex + direction + options.length) % options.length;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case 'Escape':
				if (!open) return;
				event.preventDefault();
				event.stopPropagation();
				setOpen(false, true);
				break;
			case 'ArrowDown':
			case 'ArrowUp':
				event.preventDefault();
				if (!open) setOpen(true);
				else moveActive(event.key === 'ArrowDown' ? 1 : -1);
				break;
			case 'Home':
			case 'End':
				if (!open) return;
				event.preventDefault();
				activeIndex = event.key === 'Home' ? 0 : options.length - 1;
				break;
			case 'Enter':
			case ' ':
				if (!open) return;
				event.preventDefault();
				if (options[activeIndex]) choose(options[activeIndex].value);
				break;
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!open) return;
		if (!(event.relatedTarget instanceof Node) || !rootElement?.contains(event.relatedTarget)) {
			setOpen(false);
		}
	}

	$effect(() => {
		if (disabled) open = false;
	});

	onMount(() => {
		function handleOutsidePointer(event: PointerEvent) {
			if (rootElement && event.target instanceof Node && !rootElement.contains(event.target)) {
				setOpen(false);
			}
		}

		document.addEventListener('pointerdown', handleOutsidePointer);
		return () => document.removeEventListener('pointerdown', handleOutsidePointer);
	});
</script>

<div class="choice-select-controller" bind:this={rootElement} onfocusout={handleFocusOut}>
	<ChoiceSelectView
		id={controlId}
		{value}
		{options}
		{open}
		{disabled}
		mobileInline
		{activeIndex}
		{describedBy}
		onTriggerClick={() => setOpen(!open)}
		onTriggerKeydown={handleKeydown}
		onOptionClick={choose}
		onOptionHover={(index) => (activeIndex = index)}
		bind:buttonElement
	/>
</div>

<style>
	.choice-select-controller { width: 100%; }
</style>
