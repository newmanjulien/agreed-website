<script module lang="ts">
  export const CONTENT_MAX_WIDTH = 702;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className
  }: {
    children: Snippet;
    class?: string;
  } = $props();
</script>

<div class={['mx-auto w-full', className]} style:max-width={`${CONTENT_MAX_WIDTH}px`}>
  {@render children()}
</div>
