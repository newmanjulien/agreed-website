<script lang="ts">
  import type { Snippet } from 'svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import RevealSection from './RevealSection.svelte';

  let {
    title,
    body,
    children,
    id
  }: {
    title: string;
    body: Snippet;
    children: Snippet;
    id?: string;
  } = $props();

</script>

<RevealSection {id} class="px-[18px] sm:px-8">
  <ContentMeasure>
    <h2 class="font-heading text-[25px] leading-[1.8] tracking-[0.2px] text-ink">
      {title}
    </h2>

    <p class="text-[18px] font-light leading-[1.55] tracking-[0.2px] text-ink-muted/80">
      {@render body()}
    </p>

    <div class="mt-[30px]">
      {@render children()}
    </div>
  </ContentMeasure>
</RevealSection>
