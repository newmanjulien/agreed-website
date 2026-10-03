<script lang="ts">
	import type { InlineToken } from '$lib/components/contract-demo/document/pagination/types';
	let { tokens }: { tokens: readonly InlineToken[] } = $props();
</script>

{#each tokens as token}<span
		data-contract-token=""
		data-source-start-key={token.source?.start.sourceKey}
		data-source-start-offset={token.source?.start.offset}
		data-source-end-key={token.source?.end.sourceKey}
		data-source-end-offset={token.source?.end.offset}
		data-visual-source={token.visualSource ? JSON.stringify(token.visualSource) : undefined}
		data-generated-offset={token.generatedOffset}
		data-source-kind={token.sourceKind}
		data-generated={token.generated}
		data-revision={token.revision}>{token.value}</span
	>{/each}
