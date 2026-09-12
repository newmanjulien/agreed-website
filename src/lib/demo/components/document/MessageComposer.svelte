<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MessageComposerView from './MessageComposerView.svelte';

	let {
		text,
		title,
		placeholder,
		submitLabel,
		cancelLabel,
		submitOnEnter = false,
		pending = false,
		errorMessage = '',
		onTextChange,
		onCancel,
		onSubmit
	}: {
		text: string;
		title: string;
		placeholder: string;
		submitLabel: string;
		cancelLabel?: string;
		submitOnEnter?: boolean;
		pending?: boolean;
		errorMessage?: string;
		onTextChange: (text: string) => void;
		onCancel?: () => void;
		onSubmit: () => void;
	} = $props();

	let textareaElement = $state<HTMLTextAreaElement>();
	let canSubmit = $derived(Boolean(text.trim()));

	function handleInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
		onTextChange(event.currentTarget.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && onCancel) {
			event.preventDefault();
			event.stopPropagation();
			onCancel();
			return;
		}

		const shouldSubmit =
			event.key === 'Enter' &&
			!event.isComposing &&
			(submitOnEnter ? !event.shiftKey : event.metaKey || event.ctrlKey);

		if (shouldSubmit) {
			event.preventDefault();
			if (canSubmit && !pending) onSubmit();
		}
	}

	onMount(() => {
		// Annotation cards are hidden until their rail position is measured.
		let cancelled = false;
		let focusFrame: number | undefined;
		void tick().then(() => {
			if (cancelled) return;
			focusFrame = requestAnimationFrame(() => {
				if (!cancelled) textareaElement?.focus({ preventScroll: true });
			});
		});

		return () => {
			cancelled = true;
			if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
		};
	});
</script>

<MessageComposerView
	{text}
	{title}
	{placeholder}
	{submitLabel}
	{cancelLabel}
	{pending}
	{errorMessage}
	bind:textareaElement
	onInput={handleInput}
	onKeydown={handleKeydown}
	{onCancel}
	{onSubmit}
/>
