<script lang="ts">
	import MessageByline from './MessageByline.svelte';
	import { autosizeTextarea } from './textarea-autosize';

	let {
		text,
		title,
		placeholder,
		submitLabel,
		cancelLabel,
		pending = false,
		errorMessage = '',
		interactive = true,
		textareaElement = $bindable(),
		submitElement = $bindable(),
		onInput,
		onKeydown,
		onCancel,
		onSubmit
	}: {
		text: string;
		title: string;
		placeholder: string;
		submitLabel: string;
		cancelLabel?: string;
		pending?: boolean;
		errorMessage?: string;
		interactive?: boolean;
		textareaElement?: HTMLTextAreaElement;
		submitElement?: HTMLButtonElement;
		onInput?: (event: Event & { currentTarget: HTMLTextAreaElement }) => void;
		onKeydown?: (event: KeyboardEvent) => void;
		onCancel?: () => void;
		onSubmit?: () => void;
	} = $props();

	let canSubmit = $derived(Boolean(text.trim()));
</script>

<div class="mb-2.5">
	<MessageByline />
</div>
<textarea
	class="block min-h-10 w-full resize-none appearance-none overflow-y-hidden rounded-demo-field border border-demo-line/[58%] bg-demo-surface px-3 py-2 text-[15px] leading-[1.45] text-demo-ink shadow-none placeholder:text-demo-ink-muted focus:border-demo-accent focus:outline-2 focus:outline-offset-1 focus:outline-demo-accent/18"
	rows="1"
	value={text}
	use:autosizeTextarea={{ value: text, maxHeight: 160 }}
	{placeholder}
	aria-label={title}
	disabled={pending}
	readonly={!interactive}
	tabindex={interactive ? 0 : -1}
	bind:this={textareaElement}
	oninput={onInput}
	onkeydown={onKeydown}
></textarea>
{#if errorMessage}
	<p class="mt-2 mb-0 text-xs leading-[1.35] text-demo-danger" role="alert">{errorMessage}</p>
{/if}
<div class="mt-3 flex justify-end gap-2">
	{#if cancelLabel && onCancel}
		<button
			class="h-10 cursor-pointer rounded-demo-control border border-transparent bg-transparent px-3.5 text-[15px] font-medium text-demo-ink-muted hover:bg-demo-hover-subtle hover:text-demo-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-line-strong disabled:cursor-default disabled:text-demo-disabled"
			type="button"
			disabled={pending}
			tabindex={interactive ? 0 : -1}
			onclick={onCancel}
		>
			{cancelLabel}
		</button>
	{/if}
	<button
		class="h-10 cursor-pointer rounded-demo-control border border-demo-line bg-demo-surface px-3.5 text-[15px] font-medium text-demo-ink-secondary hover:bg-demo-hover-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-line-strong disabled:cursor-default disabled:bg-demo-canvas disabled:text-demo-disabled"
		type="button"
		disabled={pending || !canSubmit}
		tabindex={interactive ? 0 : -1}
		bind:this={submitElement}
		onclick={onSubmit}
	>
		{submitLabel}
	</button>
</div>
