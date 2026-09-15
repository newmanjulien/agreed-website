<script lang="ts">
  import { CheckIcon } from 'phosphor-svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';

  const benefits = [
    'Access to legal ops managers',
    'E-signature at no extra cost'
  ];

  const faqItems = [
    {
      question: "Wait, what's your price again?",
      answer:
        "Agreed's pricing is based on the number of deals we help you close. Pay a small fee each time we help you close a deal. Pay nothing if the deal doesn't close."
    },
    {
      question: 'Do I need to pay for Docusign on top of Agreed?',
      answer:
        'No. E-signatures are included at no extra cost.'
    },

    {
      question: 'What counts as a closed deal?',
      answer:
        "When all the agreements are signed. For example, a deal might include an MSA and an Order Form. You'd only pay when both are signed."
    },
    {
      question: 'Are legal ops managers included?',
      answer:
        "Yes. You always get access to our team of legal ops managers. Even with the free deals."
    },
    {
      question: 'How do I talk to the legal ops managers?',
      answer:
        'You do an introductory Zoom. Then you mostly collaborate over chat and email.'
    }
  ];
</script>

<svelte:head>
  <title>Pricing | Agreed</title>
</svelte:head>

<ContentMeasure>
  <section class="mx-auto max-w-[620px] pt-[72px]">
    <h1 class="font-heading text-[30px] leading-[1.05] text-stone-900">
      Pricing
    </h1>

    <p class="mt-[24px] text-[17px] font-book leading-[1.55] text-stone-700">
      Pay a small fee per deal we help you close, with a team of legal ops managers handling the work for you.
    </p>

    <!-- Legal ops manager -->
    <section class="mt-[30px]">
      <div class="overflow-hidden rounded-[18px] bg-stone-100">
        <img
          src="/ops.jpg"
          alt="Legal ops manager"
          class="aspect-[8/5] w-full object-cover object-[center_35%]"
          width="620"
          height="310"
        />
      </div>

      <p class="mt-[22px] text-[16px] font-book leading-[1.65] text-stone-700">
        Our team of legal ops managers set up your agreements, keep your terms current, and continuously improve
        your process so deals close faster without giving up contractual protections.
      </p>
    </section>

    <!-- Pricing card -->
    <article
      class="mt-[77px] rounded-[18px] border border-stone-200 bg-white px-[24px] py-[28px] shadow-[0_1px_0_rgba(48,47,45,0.03)]"
    >
      <div>
        <p class="font-heading text-[40px] leading-none text-stone-900">
          $20
        </p>

        <p class="mt-[6px] text-[15px] leading-none text-stone-500">
          per deal
        </p>
      </div>

      <p
        class="mt-[26px] border-t border-stone-200/70 pt-[22px] text-[16px] font-book leading-[1.55] text-stone-500"
      >
        First 10 deals are free. Then $20 per deal we help you close.
      </p>

      <div class="mt-[18px]">
        <ButtonLink
          href="#"
          variant="primary"
          size="large"
          fullWidth
        >
          Start for free
        </ButtonLink>
      </div>

      <ul
        class="mt-[25px] space-y-[16px] border-t border-stone-200/70 pt-[24px]"
      >
        {#each benefits as benefit}
          <li
            class="flex items-center gap-[13px] text-[15px] font-book text-stone-700"
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
        appearance="color"
        columns={5}
        mobileColumns={2}
        align="left"
        animate={false}
      />
    </section>

    <!-- FAQ -->
    <section class="mt-[92px]">
      <h2 class="font-heading text-[26px] font-book leading-[1.18] text-stone-750">
        Frequently Asked Questions
      </h2>

      <div class="mt-[38px] flex flex-col gap-[32px]">
        {#each faqItems as item (item.question)}
          <article>
            <h3 class="font-heading text-[17px] font-book leading-[1.25] text-stone-750 sm:text-[18px]">
              {item.question}
            </h3>

            <p class="mt-[12px] text-[14px] font-book leading-[1.55] text-stone-500 sm:text-[15px]">
              {item.answer}
            </p>
          </article>
        {/each}
      </div>
    </section>
  </section>
</ContentMeasure>