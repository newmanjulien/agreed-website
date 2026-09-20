<script lang="ts">
  import Hero from '$lib/components/hero/Hero.svelte';
  import CtaSection from '$lib/components/cta/CtaSection.svelte';
  import CustomerTestimonials from '$lib/components/features/CustomerTestimonials.svelte';
  import FeatureSection from '$lib/components/features/FeatureSection.svelte';
  import UploadChangesWidget from '$lib/components/features/UploadChangesWidget.svelte';
  import AcceptChangesWidget from '$lib/components/features/AcceptChangesWidget.svelte';
  import RequestApprovalWidget from '$lib/components/features/RequestApprovalWidget.svelte';
  import SectionNav from '$lib/components/site/SectionNav.svelte';

  const pageSections = [
    { id: 'overview', label: 'Back to the start' },
    { id: 'upload', label: 'Upload what the buyer changed' },
    { id: 'accept', label: 'Reps see what they can accept' },
    { id: 'respond', label: 'Reps know how to keep the deal moving' },
    { id: 'customers', label: 'See why teams stay with Agreed' },
    { id: 'get-started', label: 'Accelerate your sales cycle' }
  ];
</script>

<svelte:head>
  <title>Agreed | Lets sales reps get contracts signed on their own</title>
  <meta name="description" content="Agreed is a sales contract that explains itself" />
</svelte:head>

<SectionNav sections={pageSections} />

<main>
  <Hero id="overview" />

  <div class="flex flex-col gap-[150px] pt-[150px] sm:gap-[190px] sm:pt-[190px]">
    <FeatureSection id="upload" title="Upload what the buyer changed">
      {#snippet body()}
      Your reps upload the contract changes the buyer requested, and Agreed shows them what they can accept, what needs approval, and how to respond when they need to push back.      {/snippet}
      <UploadChangesWidget />
    </FeatureSection>

    <FeatureSection id="accept" title="Reps see what they can accept">
      {#snippet body()}
      Agreed checks each requested change against your approved positions, so reps can accept changes themselves when they are already approved.
      {/snippet}
      <AcceptChangesWidget />
    </FeatureSection>

    <FeatureSection id="respond" title="Reps know how to keep the deal moving">
      {#snippet body()}
        When a change cannot be accepted, reps get clear talking points to respond. When approval is needed, they can get it without slowing down the deal.
      {/snippet}
      <RequestApprovalWidget />
    </FeatureSection>

    <FeatureSection id="customers" title="See why teams stay with Agreed">
      {#snippet body()}
        Our retention is high. We spend most of our time building things for our existing customers. Here are some nice things they’ve said.
      {/snippet}
      <CustomerTestimonials />
    </FeatureSection>

    <CtaSection id="get-started" />
  </div>
</main>
