<script lang="ts">
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import RevealSection from './RevealSection.svelte';

  let {
    heading,
    paragraphs
  }: {
    heading: string;
    paragraphs: string[];
  } = $props();
</script>

<RevealSection class="px-[18px] sm:px-8">
  <ContentMeasure>
    <h2 class="font-heading text-[25px] font-book leading-[1.14] text-stone-750">
      {heading}
    </h2>

    <div class="mt-[8px] flex max-w-[720px] flex-col gap-[18px] text-[18px] font-book leading-[1.55] text-stone-500/80">
      {#each paragraphs as paragraph}
        <p>{paragraph}</p>
      {/each}
    </div>
  </ContentMeasure>
</RevealSection>