<script lang="ts">
	import type { AnnotationKind } from '$lib/demo/document/annotations/types';
	import ContextPanelSurface from './ContextPanelSurface.svelte';
	import MessageComposer from './MessageComposer.svelte';

	let {
		kind,
		text,
		onTextChange,
		onCancel,
		onSubmit
	}: {
		kind: AnnotationKind;
		text: string;
		onTextChange: (text: string) => void;
		onCancel: () => void;
		onSubmit: () => void;
	} = $props();

	let title = $derived(kind === 'change' ? 'Propose change' : 'Add comment');
	let placeholder = $derived(
		kind === 'change' ? 'Write the proposed wording or change…' : 'Write a comment…'
	);
	let submitLabel = $derived(
		kind === 'change' ? 'Propose change' : 'Comment'
	);
</script>

<ContextPanelSurface
	label={title}
	onDismiss={onCancel}
	closeLabel="Cancel annotation"
	responsiveMode="annotation"
	compact
>
	<MessageComposer
		{text}
		{title}
		{placeholder}
		{submitLabel}
		submitOnEnter
		{onTextChange}
		{onCancel}
		{onSubmit}
	/>
</ContextPanelSurface>
