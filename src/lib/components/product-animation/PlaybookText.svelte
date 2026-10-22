<script lang="ts">
	let { text }: { text: string } = $props();
</script>

{#each text
	.split(/\n\s*\n/u)
	.map((paragraph) => paragraph.trim())
	.filter(Boolean) as paragraph}
	<p class="m-0">{paragraph}</p>
{/each}
