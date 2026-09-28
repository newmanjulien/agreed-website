<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className,
    id
  }: {
    children: Snippet;
    class?: string;
    id?: string;
  } = $props();

  let viewed = $state(true);

  const revealWhenViewed: Attachment = (node) => {
    viewed = false;

    const observer = new IntersectionObserver(
      (entries) => (viewed = entries.at(-1)!.isIntersecting),
      { rootMargin: '-8% 0px', threshold: 0.04 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  };
</script>

<section
  {id}
  class={['reveal-section', id && 'anchor-section', className]}
  class:is-viewed={viewed}
  {@attach revealWhenViewed}
>
  {@render children()}
</section>

<style>
  .reveal-section {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 700ms ease-out,
      visibility 0ms linear 700ms;
    will-change: opacity;
  }

  .reveal-section.is-viewed {
    opacity: 1;
    visibility: visible;
    transition:
      opacity 700ms ease-out 45ms,
      visibility 0ms linear 45ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal-section,
    .reveal-section.is-viewed {
      transition: none;
    }
  }
</style>
