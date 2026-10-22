<script lang="ts">
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import ProductAnimation from '$lib/components/product-animation/ProductAnimation.svelte';
  import { heroTour, heroCompletedStep } from '$lib/components/product-animation/hero-tour';

  let { id }: { id?: string } = $props();
</script>

<section
  {id}
  class={[
    'px-[18px] pt-[calc(65px-var(--site-mobile-header-height))] sm:px-8 sm:pt-[calc(95px-var(--site-mobile-header-height))] lg:pt-[90px]',
    id && 'scroll-mt-[calc(var(--site-mobile-header-height)+18px)] lg:scroll-mt-12'
  ]}
>
  <ContentMeasure class="flex flex-col items-center text-center">
    <h1
      class="max-w-[590px] font-heading text-[45px] leading-[1.04] text-ink sm:max-w-none sm:text-[51px]"
    >
      Keep contracts moving
    </h1>

    <p
      class="hero-support mt-[8px] max-w-[550px] font-light text-[18px] leading-[1.40] text-ink-muted"
    >
    Let sales reps handle contract negotiation themselves.
    </p>

    <div class="hero-actions mt-[28px] flex flex-col items-center">
      <ButtonLink
        href={createPortalAuthUrl('join', '/')}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        size="xlarge"
        shape="pill"
        highlightSweep
        class="shadow-[0_5px_12px_rgba(32,33,36,0.2)] hover:-translate-y-[2px] hover:shadow-[0_8px_11px_rgba(32,33,36,0.28)]"
      >
        Start for free
      </ButtonLink>
    </div>
  </ContentMeasure>

  <div class="hero-graphic relative mx-auto mt-[80px] w-full max-w-[1320px]">
    <div class="mx-auto w-full max-w-[936px]">
      <CustomerLogos
        interactive
        layout="demo"
        class="mb-[12px] sm:mb-[14px]"
      />

      <div
        class="mx-auto h-[616px] w-[95%] overflow-hidden rounded-[12px] border border-line/90 bg-line/60 p-[6px] shadow-[0_18px_45px_-24px_rgba(32,33,36,0.28)] sm:aspect-[1682/1223] sm:h-auto sm:rounded-[14px] sm:p-[7px]"
      >
        <div
          class="h-full w-full overflow-hidden rounded-[6px] border border-line bg-surface sm:rounded-[8px]"
        >
          <ProductAnimation
            tour={heroTour}
            completedStep={heroCompletedStep}
            framing="hero"
            loop
            label="A guided contract negotiation: open Resale, Amendments to Statement of Work, the annual fee increase, Attorneys’ Fees, and Assignment. Explore the advice and apply three concessions, two requiring approval, then click Ask for approval. The walkthrough repeats."
          />
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  @layer components {
    section {
      --hero-ease: cubic-bezier(0.22, 1, 0.36, 1);
      --hero-content-duration: 320ms;
      --hero-content-delay: 690ms;
    }

    .hero-support,
    .hero-actions,
    .hero-graphic {
      opacity: 0;
      transform: translateY(4px);
      animation: hero-content-enter var(--hero-content-duration) var(--hero-ease)
        var(--hero-content-delay) both;
    }

    .hero-support {
      animation-delay: calc(var(--hero-content-delay) - 100ms);
    }

    .hero-actions {
      transform: translateY(10px);
      animation-duration: 620ms;
    }

    /*
     * CustomerLogos staggers each individual logo
     * from this base delay.
     */
    .hero-graphic {
      --logos-enter-delay: calc(var(--hero-content-delay) + 60ms);
    }

    @keyframes hero-content-enter {
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-support,
      .hero-actions,
      .hero-graphic {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
  }
</style>
