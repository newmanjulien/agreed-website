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

<div class={['mx-auto w-full max-w-[702px]', className]}>
  {@render children()}
</div>
