<script lang="ts">
	import UserIcon from 'phosphor-svelte/lib/UserIcon';
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-demo-hover-subtle text-demo-ink-muted ring-1 ring-demo-line"
		aria-hidden="true"
	>
		<UserIcon size={19} weight="regular" />
	</span>
	<span class="author-name min-w-0 truncate text-[13px] leading-[1.2] text-demo-ink">You</span>
</div>

<style>
	.author-name {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		font-weight: 550;
	}
</style>
