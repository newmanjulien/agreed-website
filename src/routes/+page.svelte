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
    { id: 'accept', label: 'Give reps the confidence to negotiate' },
    { id: 'respond', label: 'Keep every deal moving' },
    { id: 'customers', label: 'Testimonials' }
  ];
</script>

<svelte:head>
  <title>Agreed | Lets sales reps get contracts signed on their own</title>
  <meta name="description" content="Agreed is a sales contract that explains itself" />
</svelte:head>

<SectionNav sections={pageSections} cover="cta" />

<main>
  <Hero id="overview" />

  <div class="flex flex-col gap-[150px] pt-[150px] sm:gap-[190px] sm:pt-[190px]">
    <ContentSection id="intro" title="Your sales process is gummed up">
      {#snippet body()}
        <p>Today, your reps are stuck waiting when a buyer sends back a redlined contract. Deals that should be closed are in a slow and expensive legal limbo instead.</p>
        <p>Make deals close fast by letting your reps get contracts signed on their own.</p>
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

    <ContentSection id="respond" title="Keep every deal moving">
      {#snippet body()}
        <p>When a change needs approval, make it easy for reps to get it from the right person on your team.</p>
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
