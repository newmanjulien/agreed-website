<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { autosizeTextarea } from './textarea-autosize';

	let {
		id,
		text,
		pending = false,
		errorMessage = '',
		onTextChange,
		onCancel,
		onSubmit
	}: {
		id: string;
		text: string;
		pending?: boolean;
		errorMessage?: string;
		onTextChange: (text: string) => void;
		onCancel: () => void;
		onSubmit: () => void;
	} = $props();

	let rootElement = $state<HTMLDivElement>();
	let textareaElement = $state<HTMLTextAreaElement>();
	let hasFocus = $state(false);
	let canSubmit = $derived(Boolean(text.trim()));

	function handleFocusIn() {
		hasFocus = true;
	}

	function handleFocusOut(event: FocusEvent) {
		if (!rootElement?.contains(event.relatedTarget as Node | null)) hasFocus = false;
	}

	function handleInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
		onTextChange(event.currentTarget.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			onCancel();
			textareaElement?.blur();
			return;
		}

		const shouldSubmit =
			event.key === 'Enter' &&
			!event.shiftKey &&
			!event.isComposing;

		if (shouldSubmit) {
			event.preventDefault();
			if (canSubmit && !pending) onSubmit();
		}
	}

	onMount(() => {
		let cancelled = false;
		let focusFrame: number | undefined;
		void tick().then(() => {
			if (cancelled) return;
			focusFrame = requestAnimationFrame(() => {
				if (cancelled) return;
				textareaElement?.focus({ preventScroll: true });
			});
		});

		return () => {
			cancelled = true;
			if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
		};
	});
</script>

<div bind:this={rootElement} onfocusin={handleFocusIn} onfocusout={handleFocusOut}>
	<textarea
		{id}
		class="block min-h-10 w-full resize-none appearance-none overflow-y-hidden rounded-demo-field border border-demo-line bg-demo-surface px-3 py-2 text-sm leading-[1.45] text-demo-ink shadow-none placeholder:text-demo-ink-muted focus:border-demo-accent focus:outline-2 focus:outline-offset-1 focus:outline-demo-accent/18 disabled:cursor-wait"
		rows="1"
		value={text}
		use:autosizeTextarea={{ value: text, maxHeight: 160 }}
		placeholder="Reply…"
		aria-label="Write a reply"
		disabled={pending}
		bind:this={textareaElement}
		oninput={handleInput}
		onkeydown={handleKeydown}
	></textarea>
	{#if errorMessage}
		<p class="mt-2 mb-0 text-xs leading-[1.35] text-demo-danger" role="alert">{errorMessage}</p>
	{/if}
	{#if hasFocus}
		<div class="mt-3 flex justify-end">
			<button
				class="h-10 cursor-pointer rounded-demo-control border border-demo-line bg-demo-surface px-3.5 text-[15px] font-medium text-demo-ink-secondary hover:bg-demo-hover-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-line-strong disabled:cursor-default disabled:bg-demo-canvas disabled:text-demo-disabled"
				type="button"
				disabled={pending || !canSubmit}
				onclick={onSubmit}
			>
				Reply
			</button>
		</div>
	{/if}
</div>
