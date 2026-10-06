<script lang="ts">
  import { CheckIcon } from 'phosphor-svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';

  const benefits = [
    'Contract negotiation software is built in.',
    'Payment processing and signatures at no extra cost.',
    "If a contract doesn't get signed and paid, you owe us nothing."
  ];

  const faqItems = [
    {
      question: "What exactly do I pay?",
      answer:
        "3.9% of the revenue we collect for you. That's the whole bill. If a contract isn't signed, or the money never arrives, you pay nothing. Every feature comes along at no extra cost."
    },
      {
      question: 'Do I need Stripe on top of Agreed?',
      answer:
        "No. Payments are built in, so there's nothing extra to set up or pay for."
    },
    {
      question: 'Do I need Docusign on top of Agreed?',
      answer:
        'No. Signing is built in too, with no add ons and no per envelope fees.'
    },
    {
      question: "What if I send a contract and it never gets signed?",
      answer:
        "Then it costs you nothing. We only charge on contracts that are signed and paid."
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
      What does Agreed cost? A small slice of the revenue we collect for you, and nothing else.
    </p>

    <!-- Pricing card -->
    <article
      class="mt-[36px] rounded-[11px] border border-line px-[24px] py-[28px]"
    >
      <div>
        <p class="font-heading text-[40px] leading-none text-ink">
          3,9%
        </p>

        <p class="mt-[6px] text-[15px] leading-none text-ink-muted">
          of revenue collected
        </p>
      </div>

      <p
        class="mt-[26px] border-t border-line/70 pt-[22px] text-[16px] font-book leading-[1.55] text-ink-muted"
      >
        We only get paid when you do. Negotiation, signatures, and payments are all part of the price.
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
