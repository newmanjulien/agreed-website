<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import type { ChoiceSelectOption } from './choice-select';

	let {
		id,
		value,
		options,
		open,
		disabled = false,
		interactive = true,
		mobileInline = false,
		activeIndex = 0,
		describedBy,
		onTriggerClick,
		onTriggerKeydown,
		onOptionClick,
		onOptionHover,
		buttonElement = $bindable(),
		registerTarget,
		triggerTarget,
		optionTargets = {}
	}: {
		id: string;
		value: string;
		options: ReadonlyArray<ChoiceSelectOption>;
		open: boolean;
		disabled?: boolean;
		interactive?: boolean;
		mobileInline?: boolean;
		activeIndex?: number;
		describedBy?: string;
		onTriggerClick?: () => void;
		onTriggerKeydown?: (event: KeyboardEvent) => void;
		onOptionClick?: (value: string) => void;
		onOptionHover?: (index: number) => void;
		buttonElement?: HTMLButtonElement;
		registerTarget?: (name: string, element: Element | null) => void;
		triggerTarget?: string;
		optionTargets?: Readonly<Record<string, string>>;
	} = $props();

	let listboxId = $derived(`${id}-options`);
	let selectedIndex = $derived(options.findIndex((option) => option.value === value));
	let selectedLabel = $derived(options[selectedIndex]?.label ?? '');
	let activeOptionId = $derived(
		open && options[activeIndex] ? `${id}-option-${activeIndex}` : undefined
	);

	const attachTrigger: Attachment = (node) => {
		if (!triggerTarget || !registerTarget) return;
		registerTarget(triggerTarget, node);
		return () => registerTarget(triggerTarget, null);
	};

	function attachOption(value: string): Attachment {
		return (node) => {
			const targetName = optionTargets[value];
			if (!targetName || !registerTarget) return;
			registerTarget(targetName, node);
			return () => registerTarget(targetName, null);
		};
	}

	let optionAttachments = $derived(options.map((option) => attachOption(option.value)));
</script>

<div class="choice-select" class:mobile-inline={mobileInline}>
	<button
		bind:this={buttonElement}
		{@attach attachTrigger}
		{id}
		type="button"
		role="combobox"
		class="choice-select__control"
		class:is-open={open}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={listboxId}
		aria-activedescendant={activeOptionId}
		aria-describedby={describedBy}
		{disabled}
		tabindex={interactive ? 0 : -1}
		onclick={onTriggerClick}
		onkeydown={onTriggerKeydown}
	>
		<span>{selectedLabel}</span>
		<CaretDownIcon size={20} weight="regular" />
	</button>

	<div
		id={listboxId}
		class="choice-select__menu"
		class:is-visible={open}
		role="listbox"
		aria-hidden={!open}
	>
		{#each options as option, index (option.value)}
			<button
				{@attach optionAttachments[index]}
				id={`${id}-option-${index}`}
				type="button"
				class="choice-select__option"
				class:is-current={option.value === value}
				class:is-active={open && index === activeIndex}
				role="option"
				aria-selected={option.value === value}
				tabindex={-1}
				onpointerenter={() => onOptionHover?.(index)}
				onclick={() => onOptionClick?.(option.value)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.choice-select { position: relative; width: 100%; }
	.choice-select__control {
		display: flex; width: 100%; height: 48px; align-items: center; justify-content: space-between;
		gap: 8px; padding: 0 12px; border: 1px solid var(--color-demo-line);
		border-radius: var(--radius-demo-field); background: var(--color-demo-surface); font: inherit;
		font-size: 15px; text-align: left; color: var(--color-demo-ink); cursor: pointer;
		transition: border-color 140ms ease;
	}
	.choice-select__control:hover { border-color: var(--color-demo-line-strong); }
	.choice-select__control.is-open,
	.choice-select__control:focus-visible {
		border-color: var(--color-demo-accent);
		outline: 2px solid color-mix(in srgb, var(--color-demo-accent) 18%, transparent);
		outline-offset: 1px;
	}
	.choice-select__control:disabled { color: var(--color-demo-ink-muted); cursor: wait; background: var(--color-demo-canvas); }
	.choice-select__control :global(svg) { flex: none; color: var(--color-demo-ink-muted); }
	.choice-select__menu {
		position: absolute; top: calc(100% + 5px); left: 0; z-index: 10; width: 100%;
		max-height: 220px; overflow-y: auto; padding: 5px; border: 1px solid var(--color-demo-line);
		border-radius: 11px; background: var(--color-demo-surface);
		box-shadow: 0 12px 28px rgba(32, 33, 36, 0.14); opacity: 0; visibility: hidden;
		transform: translateY(-4px) scale(0.985); transform-origin: top;
		transition: opacity 140ms ease, visibility 0ms linear 140ms, transform 140ms ease;
	}
	.choice-select__menu.is-visible {
		opacity: 1; visibility: visible; transform: none;
		transition: opacity 140ms ease, visibility 0ms, transform 140ms ease;
	}
	.choice-select__option {
		display: block; width: 100%; min-height: 34px; padding: 7px 9px; overflow: hidden;
		border: 0; border-radius: 7px; background: transparent; font: inherit; font-size: 14px;
		line-height: 20px; text-align: left; color: var(--color-demo-ink-secondary);
		text-overflow: ellipsis; white-space: nowrap; cursor: pointer;
	}
	.choice-select__option.is-current,
	.choice-select__option.is-active,
	.choice-select__option:hover,
	.choice-select__option:focus-visible { background: var(--color-demo-hover-subtle); outline: none; }
	@media (prefers-reduced-motion: reduce) {
		.choice-select__control, .choice-select__menu { transition: none; }
	}

	@container (width < 900px) {
		.choice-select.mobile-inline .choice-select__menu {
			position: relative;
			top: auto;
			display: none;
			margin-top: 5px;
			transform: none;
		}
		.choice-select.mobile-inline .choice-select__menu.is-visible { display: block; }
	}
</style>
