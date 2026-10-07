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
    { id: 'intro', label: 'Your sales stall at the finish line' },
    { id: 'upload', label: 'Help reps understand every clause' },
    { id: 'accept', label: 'Give reps the confidence to negotiate' },
    { id: 'respond', label: 'Closed the deal quickly' },
    { id: 'customers', label: 'Testimonials' }
  ];
</script>

<svelte:head>
  <title>Agreed | Let sales reps get contracts signed and paid on their own</title>
  <meta name="description" content="Let sales reps get contracts signed and paid on their own" />
</svelte:head>

<SectionNav sections={pageSections} cover="cta" />

<main>
  <Hero id="overview" />

  <div class="flex flex-col gap-[150px] pt-[150px] sm:gap-[190px] sm:pt-[190px]">
    <ContentSection id="intro" title="Deals stall at the finish line">
      {#snippet body()}
        <p>Redlines trigger slow rounds with lawyers, and you're still chasing payment weeks after the deal is signed.</p>
        <p>With Agreed, reps negotiate within preapproved guardrails. Then signatures and billing run themselves.</p>
      {/snippet}
    </ContentSection>

    <ContentSection id="upload" title="Help reps understand every clause">
      {#snippet body()}
        <p>Explain each clause in plain English, and guide reps through negotiations on the clauses buyers often push back on.</p>
      {/snippet}
      <SummaryWidget />
    </ContentSection>

    <ContentSection id="accept" title="Give reps the confidence to negotiate">
      {#snippet body()}
        <p>Give reps the confidence to negotiate independently with preapproved changes they can safely make to your contract.</p>
      {/snippet}
      <AcceptChangesWidget />
    </ContentSection>

    <ContentSection id="respond" title="Get from approved to paid in one click">
      {#snippet body()}
        <p>Once terms are settled, one click sends the final contract out for signature. And Agreed collects payment when it's signed.</p>
      {/snippet}
      <ApprovalWidget />
    </ContentSection>

    <ContentSection id="customers" title="Customers stay with Agreed">
      {#snippet body()}
        <p>Our customer retention is high, and we spend most of our time building for the teams who already use Agreed. Here’s what they have to say.</p>
      {/snippet}
      <CustomerTestimonials />
    </ContentSection>

    <CtaSection id="cta" />
  </div>
</main>
