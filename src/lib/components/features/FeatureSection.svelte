<script lang="ts">
  import type { Snippet } from 'svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import RevealSection from './RevealSection.svelte';

  let {
    title,
    body,
    children
  }: {
    title: string;
    body: Snippet;
    children: Snippet;
  } = $props();

</script>

<RevealSection class="px-[18px] sm:px-8">
  <ContentMeasure>
    <h2 class="font-heading text-[25px] font-book leading-[1.14] text-stone-750">
      {title}
    </h2>

    <p class="mt-[8px] max-w-[720px] text-[18px] font-book leading-[1.55] text-stone-500/80">
      {@render body()}
    </p>

    <div class="mt-[30px]">
      {@render children()}
    </div>
  </ContentMeasure>
</RevealSection>
