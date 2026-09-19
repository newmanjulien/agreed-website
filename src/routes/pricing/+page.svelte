<script lang="ts">
  import { CheckIcon } from 'phosphor-svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';

  const benefits = [
    "Pay nothing for contracts that don't get signed.",  
    'E-signature included.'
  ];

  const faqItems = [
    {
      question: "Wait, what's your price again?",
      answer:
        "Agreed's pricing is based on the number of contracts we help you get signed. Pay nothing if the contract isn't signed."
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
  <section class="mx-auto max-w-[620px] pb-[150px] pt-[72px] sm:pb-[190px]">
    <h1 class="font-heading text-[30px] leading-[1.05] text-stone-900">
      Pricing
    </h1>

    <p class="mt-[24px] text-[17px] font-book leading-[1.55] text-stone-700">
      How much does Agreed cost? You pay a small fee per contract, and only if the contract is signed.
    </p>

    <!-- Pricing card -->
    <article
      class="mt-[36px] rounded-[18px] border border-stone-200 bg-white px-[24px] py-[28px] shadow-[0_1px_0_rgba(48,47,45,0.03)]"
    >
      <div>
        <p class="font-heading text-[40px] leading-none text-stone-900">
          $30
        </p>

        <p class="mt-[6px] text-[15px] leading-none text-stone-500">
          per contract
        </p>
      </div>

      <p
        class="mt-[26px] border-t border-stone-200/70 pt-[22px] text-[16px] font-book leading-[1.55] text-stone-500"
      >
        3 contracts per month for free. Then $30 per contract that's signed.
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