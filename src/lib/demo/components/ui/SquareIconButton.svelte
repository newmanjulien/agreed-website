<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = Omit<HTMLButtonAttributes, 'class'> & {
		children: Snippet;
		element?: HTMLButtonElement;
	};

	let {
		children,
		element = $bindable(),
		...buttonAttributes
	}: Props = $props();
</script>

<button
	bind:this={element}
	{...buttonAttributes}
	class="grid size-9 cursor-pointer place-items-center rounded-demo-control border border-transparent bg-transparent p-0 text-demo-ink-secondary shadow-none hover:bg-demo-hover focus-visible:bg-demo-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-accent aria-expanded:bg-demo-hover aria-pressed:bg-demo-accent aria-pressed:text-demo-surface aria-pressed:hover:bg-demo-accent-hover aria-pressed:focus-visible:bg-demo-accent-hover disabled:cursor-default disabled:opacity-[0.36] disabled:hover:bg-transparent [&_svg]:pointer-events-none"
>
	{@render children()}
</button>
