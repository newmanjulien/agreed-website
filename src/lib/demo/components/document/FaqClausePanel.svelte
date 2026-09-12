<script lang="ts">
	import ContextPanelSurface from './ContextPanelSurface.svelte';
	import FaqWidget from '$lib/demo/components/widgets/FaqWidget.svelte';
	import type { FaqWidgetDefinition } from '$lib/demo/document/agreement-model';

	let {
		clauseId,
		title,
		definition,
		onDismiss,
		onClauseReference,
		element = $bindable()
	}: {
		clauseId: string;
		title: string;
		definition: FaqWidgetDefinition;
		onDismiss: () => void;
		onClauseReference: (clauseId: string) => void;
		element?: HTMLElement;
	} = $props();

	let widgetId = $derived(`clause-widget-${clauseId}`);
</script>

<ContextPanelSurface label={title} intro={definition.intro} {onDismiss} bind:element>
	<FaqWidget {widgetId} items={definition.items} {onClauseReference} />
</ContextPanelSurface>
