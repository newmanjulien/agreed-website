<script lang="ts">
	import MessageByline from '$lib/demo/components/document/MessageByline.svelte';

	let { text }: { text: string } = $props();
</script>

<div class="w-full overflow-hidden rounded-demo-widget border border-demo-line bg-demo-surface text-demo-ink shadow-none">
	<div class="p-3.5">
		<MessageByline />
		<p class="mt-2.5 mb-0 whitespace-pre-wrap text-[15px] leading-[1.5] text-demo-ink-secondary">
			{text}
		</p>
	</div>
</div>
