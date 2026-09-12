<script lang="ts">
	import type { FaqItem } from '$lib/demo/document/agreement-model';
	import FaqWidgetView from './FaqWidgetView.svelte';

	let {
		widgetId,
		items,
		onClauseReference
	}: {
		widgetId: string;
		items: ReadonlyArray<FaqItem>;
		onClauseReference: (clauseId: string) => void;
	} = $props();

	let openItemId = $state<string | null>(null);

	function toggleItem(itemId: string) {
		openItemId = openItemId === itemId ? null : itemId;
	}
</script>

<FaqWidgetView
	{widgetId}
	{items}
	{openItemId}
	{onClauseReference}
	onToggle={toggleItem}
/>
