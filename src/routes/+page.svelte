<script lang="ts">
  import Hero from '$lib/components/hero/Hero.svelte';
  import CtaSection from '$lib/components/cta/CtaSection.svelte';
  import CustomerTestimonials from '$lib/components/features/CustomerTestimonials.svelte';
  import ContentSection from '$lib/components/ui/ContentSection.svelte';
  import SummaryWidget from '$lib/components/features/SummaryWidget.svelte';
  import AcceptChangesWidget from '$lib/components/features/AcceptChangesWidget.svelte';
  import ApprovalWidget from '$lib/components/features/ApprovalWidget.svelte';
  import SectionNav from '$lib/components/site/SectionNav.svelte';

  const pageSections = [
    { id: 'overview', label: 'Back to the start' },
    { id: 'intro', label: 'Overwhelmed by redlined contracts' },
    { id: 'upload', label: 'Help reps understand every clause' },
    { id: 'accept', label: 'Negotiate with preapproved changes' },
    { id: 'respond', label: 'Always keep moving' },
    { id: 'customers', label: 'Testimonials' }
  ];
</script>

<svelte:head>
  <title>Let sales reps handle contract negotiation</title>
  <meta name="description" content="Let sales reps handle contract negotiation" />
</svelte:head>

<SectionNav sections={pageSections} cover="cta" />

<main>
  <Hero id="overview" />

  <div class="flex flex-col gap-[150px] pt-[150px] sm:gap-[190px] sm:pt-[190px]">
    <ContentSection id="intro" title="Your sales stall at the finish line">
      {#snippet body()}
        <p>When a buyer sends back a redlined contract, your reps are stuck waiting on legal. Deals that should be closing get caught in a slow and expensive review process.</p>
        <p>Give reps the guardrails to safely handle more of the contract process themselves and keep deals moving quickly toward signature.</p>
      {/snippet}
    </ContentSection>

    <ContentSection id="upload" title="Help reps understand every clause">
      {#snippet body()}
        <p>Explain each clause in plain English, and guide reps through negotiations on the clauses buyers often push back on.</p>
      {/snippet}
      <SummaryWidget />
    </ContentSection>

    <ContentSection id="accept" title="Negotiate with preapproved changes">
      {#snippet body()}
        <p>Reps can apply approved concessions directly to the contract and request approval for changes outside those limits.</p>
      {/snippet}
      <AcceptChangesWidget />
    </ContentSection>

    <ContentSection id="respond" title="Always keep moving">
      {#snippet body()}
        <p>When a change needs approval, make it easy for reps to get approval from the right person on your team.</p>
      {/snippet}
      <ApprovalWidget />
    </ContentSection>

    <ContentSection id="customers" title="Less time in review. More deals closed.">
      {#snippet body()}
        <p>See how sales teams use Agreed to handle more negotiations themselves and shorten their sales cycles.</p>
      {/snippet}
      <CustomerTestimonials />
    </ContentSection>

    <CtaSection id="cta" />
  </div>
</main>
