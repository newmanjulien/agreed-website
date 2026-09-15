<script lang="ts">
  import Hero from '$lib/components/hero/Hero.svelte';
  import CustomerTestimonials from '$lib/components/features/CustomerTestimonials.svelte';
  import FeatureSection from '$lib/components/features/FeatureSection.svelte';
  import FlagChangesWidget from '$lib/components/features/FlagChangesWidget.svelte';
  import CannotChangeWidget from '$lib/components/features/CannotChangeWidget.svelte';
  import AlwaysKeepMovingWidget from '$lib/components/features/AlwaysKeepMovingWidget.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Agreed | Contract that explains itself</title>
  <meta name="description" content="Agreed is a sales contract that explains itself" />
</svelte:head>

<main>
  <Hero agreementResult={data.agreementResult} />

  <div class="flex flex-col gap-[150px] pt-[150px] sm:gap-[190px] sm:pt-[190px]">
    <FeatureSection title="Flag what can change">
      {#snippet body()}
        Give customers a contract that marks which terms are flexible and lets them pick from alternatives that worked for others.
      {/snippet}
      {#if data.featurePreviewContent}
        <FlagChangesWidget content={data.featurePreviewContent.flag} />
      {/if}
    </FeatureSection>

    <FeatureSection title="Explain what cannot change">
      {#snippet body()}
        For non-negotiables, the contract gives proven responses to each objection and helps customers address the concerns behind them.
      {/snippet}
      {#if data.featurePreviewContent}
        <CannotChangeWidget content={data.featurePreviewContent.nonNegotiable} />
      {/if}
    </FeatureSection>

    <FeatureSection title="Always keep moving">
      {#snippet body()}
        Built-in comments keep the workflow natural beyond the self-serve format, connecting customers with the right rep if their concerns aren’t addressed.
      {/snippet}
      {#if data.featurePreviewContent}
        <AlwaysKeepMovingWidget content={data.featurePreviewContent.comments} />
      {/if}
    </FeatureSection>

    <FeatureSection title="See why teams stay with Agreed">
      {#snippet body()}
        Our retention is high. We spend most of our time building things for our existing customers. Here are some nice things they’ve said.
      {/snippet}
      <CustomerTestimonials />
    </FeatureSection>
  </div>
</main>
