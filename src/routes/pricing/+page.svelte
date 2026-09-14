<script lang="ts">
  import { CheckIcon } from 'phosphor-svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';

  const benefits = [
    'Unlimited deals closed',
    'Unlimited e-signatures',
    'Dedicated legal ops manager'
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
      Unlimited agreements and e-signatures, with a legal ops manager handling the work for you.
    </p>

    <article
      class="mt-[55px] rounded-[18px] border border-stone-200 bg-white px-[26px] py-[28px] shadow-[0_1px_0_rgba(48,47,45,0.03)]"
    >
      <div>
        <p class="font-heading text-[40px] leading-none text-stone-900">
          $3,000
        </p>

        <p class="mt-[9px] text-[15px] leading-none text-stone-500">
          per year
        </p>
      </div>

      <p
        class="mt-[30px] border-t border-stone-200/70 pt-[30px] text-[16px] font-book leading-[1.55] text-stone-500"
      >
        Your first 100 deals are free. Then $3,000 per year for unlimited use.
      </p>

      <div class="mt-[30px]">
        <ButtonLink
          href="#"
          variant="primary"
          size="large"
          fullWidth
        >
          Start for free
        </ButtonLink>
      </div>

      <ul class="mt-[28px] space-y-[23px] border-t border-stone-200/70 pt-[28px]">
        {#each benefits as benefit}
          <li class="flex items-center gap-[13px] text-[15px] font-book text-stone-700">
            <CheckIcon size={14} weight="regular" class="shrink-0" />
            <span>{benefit}</span>
          </li>
        {/each}
      </ul>
    </article>
  </section>

  <section
    class="mx-auto mt-[66px] grid max-w-[620px] gap-[36px] border-t border-stone-200/70 pt-[48px] sm:grid-cols-[195px_1fr] sm:items-start"
  >
    <div class="overflow-hidden rounded-[16px] bg-stone-100">
      <img
        src="/ops.png"
        alt="Legal ops manager"
        class="aspect-[4/5] w-full object-cover"
        width="195"
        height="244"
      />
    </div>

    <div class="space-y-[16px] text-[16px] font-book leading-[1.6] text-stone-700">
      <p>
        Your plan includes a dedicated legal ops manager who works alongside your team.
      </p>

      <p>
        Your legal ops manager sets up agreements, keeps terms current, and continuously improves your process so deals close faster while keeping contractual protections in place.
      </p>
    </div>
  </section>
</ContentMeasure>