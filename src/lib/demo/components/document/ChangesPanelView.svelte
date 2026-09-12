<script lang="ts">
	import type { Snippet } from 'svelte';
	import ContextPanelSurface from './ContextPanelSurface.svelte';

	let {
		label,
		prompt,
		promptId,
		appliedMessage,
		appliedMessageId,
		showApplied = false,
		errorMessage = '',
		errorMessageId,
		onDismiss,
		element = $bindable(),
		control
	}: {
		label: string;
		prompt: string;
		promptId?: string;
		appliedMessage: string;
		appliedMessageId?: string;
		showApplied?: boolean;
		errorMessage?: string;
		errorMessageId?: string;
		onDismiss?: () => void;
		element?: HTMLElement;
		control: Snippet;
	} = $props();
</script>

<ContextPanelSurface
	{label}
	intro={prompt}
	introId={promptId}
	{onDismiss}
	bind:element
>
	{@render control()}

	{#if showApplied}
		<p id={appliedMessageId} class="mt-2.5 mb-0 text-sm leading-[1.45] text-demo-ink-subtle" role="status">
			{appliedMessage}
		</p>
	{/if}

	{#if errorMessage}
		<p id={errorMessageId} class="mt-2.5 mb-0 text-xs leading-[1.35] text-demo-danger" role="alert">
			{errorMessage}
		</p>
	{/if}
</ContextPanelSurface>
