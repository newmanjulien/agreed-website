<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import type { Snippet } from 'svelte';
  import ContentMeasure from './ContentMeasure.svelte';

  let {
    title,
    body,
    children,
    id
  }: {
    title: string;
    body: Snippet;
    children?: Snippet;
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

<div class={['reveal-section will-change-[opacity] motion-reduce:transition-none', viewed ? 'visible opacity-100 is-viewed' : 'invisible opacity-0']} {@attach revealWhenViewed}>
<section {id} class={['px-[18px] sm:px-8', id && 'scroll-mt-[calc(var(--site-mobile-header-height)+18px)] lg:scroll-mt-12']}>
  <ContentMeasure>
    <h2 class="font-heading text-[25px] leading-[1.8] tracking-[0.2px] text-ink">
      {title}
    </h2>

    <div class="text-[17px] font-light leading-[1.55] tracking-[0.2px] text-ink-muted/80 [&>p+p]:mt-4">
      {@render body()}
    </div>

    {#if children}
      <div class="mt-[30px]">
        {@render children()}
      </div>
    {/if}
  </ContentMeasure>
</section>
</div>

<style>
  @layer components {
    .reveal-section {
      transition:
        opacity 700ms ease-out,
        visibility 0ms linear 700ms;
    }

    .reveal-section.is-viewed {
      transition:
        opacity 700ms ease-out 45ms,
        visibility 0ms linear 45ms;
    }
  }
</style>
