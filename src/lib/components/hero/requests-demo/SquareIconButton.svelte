<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = Omit<HTMLButtonAttributes, 'class'> & {
		children: Snippet;
	};

	let { children, ...buttonAttributes }: Props = $props();
</script>

<button
	{...buttonAttributes}
	class="grid size-9 cursor-pointer place-items-center rounded-2xl border border-transparent bg-transparent p-0 text-ink-muted shadow-none hover:bg-hover focus-visible:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-default disabled:opacity-[0.36] disabled:hover:bg-transparent [&_svg]:pointer-events-none"
>
	{@render children()}
</button>
