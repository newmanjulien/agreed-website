<script lang="ts">
	import { PAGE_FORMAT } from '$lib/demo/document/pagination/page-format';

	let { element = $bindable() }: { element?: HTMLDivElement } = $props();
</script>

<div
	class="measurement-surface agreement-document agreement-flow"
	aria-hidden="true"
	inert
	bind:this={element}
	style:--agreement-content-width={`${PAGE_FORMAT.contentWidth}px`}
></div>
