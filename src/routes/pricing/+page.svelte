<script lang="ts">
  import { CheckIcon } from 'phosphor-svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';

  const benefits = [
    'No credit card to start',
    'E-signature included.'
  ];

  const faqItems = [
    {
      question: 'How does the monthly free allowance work?',
      answer:
        "Your first 5 signed contracts each month are free. Each additional signed contract costs $30. Contracts that aren't signed cost nothing."
    },
    {
      question: 'Do I need to pay for Docusign on top of Agreed?',
      answer:
        'No. E-signatures are included at no extra cost.'
    },
    {
      question: 'What counts as a signed contract?',
      answer:
        "A contract counts as signed once both you and your buyer have signed it."
    },
    {
      question: "Do I pay if I send a contract that doesn't get signed?",
      answer:
        "No. You only pay for contracts that are signed."
    }
  ];
</script>

<svelte:head>
  <title>Pricing | Agreed</title>
</svelte:head>

<ContentMeasure>
  <section class="mx-auto max-w-[620px] px-[18px] pb-[150px] pt-[72px] sm:px-8 sm:pb-[190px]">
    <h1 class="font-heading text-[30px] leading-[1.05] text-ink">
      Pricing
    </h1>

    <p class="mt-[24px] text-[17px] font-book leading-[1.55] text-ink">
      Free for your first 5 signed contracts every month. No trial, no expiry. After that, only pay when a contract actually gets signed.
    </p>

    <!-- Pricing card -->
    <article
      class="mt-[36px] rounded-[11px] border border-line px-[24px] py-[28px]"
    >
      <div>
        <p class="font-heading text-[40px] leading-none text-ink">
          $30
        </p>

        <p class="mt-[6px] text-[15px] leading-none text-ink-muted">
          per signed contract
        </p>
      </div>

      <p
        class="mt-[26px] border-t border-line/70 pt-[22px] text-[16px] font-book leading-[1.55] text-ink-muted"
      >
        First 5 signed contracts each month are $0, then $30 each.
      </p>

      <div class="mt-[18px]">
        <ButtonLink
          href={createPortalAuthUrl('join', '/pricing')}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="large"
          fullWidth
        >
          Start for free
        </ButtonLink>
      </div>

      <ul
        class="mt-[25px] space-y-[16px] border-t border-line/70 pt-[24px]"
      >
        {#each benefits as benefit}
          <li
            class="flex items-center gap-[13px] text-[15px] font-book text-ink"
          >
            <CheckIcon size={14} weight="regular" class="shrink-0" />
            <span>{benefit}</span>
          </li>
        {/each}
      </ul>
    </article>

    <!-- Customer logos -->
    <section class="mt-[84px]" aria-label="Customers">
      <CustomerLogos
        count={10}
        columns={5}
        mobileColumns={2}
        align="left"
        animate={false}
      />
    </section>

    <!-- FAQ -->
    <section class="mt-[92px]">
      <h2 class="font-heading text-[26px] font-book leading-[1.18] text-ink">
        Frequently Asked Questions
      </h2>

      <div class="mt-[38px] flex flex-col gap-[32px]">
        {#each faqItems as item (item.question)}
          <article>
            <h3 class="font-heading text-[17px] font-book leading-[1.25] text-ink sm:text-[18px]">
              {item.question}
            </h3>

            <p class="mt-[12px] text-[14px] font-book leading-[1.55] text-ink-muted sm:text-[15px]">
              {item.answer}
            </p>
          </article>
        {/each}
      </div>
    </section>
  </section>
</ContentMeasure>
