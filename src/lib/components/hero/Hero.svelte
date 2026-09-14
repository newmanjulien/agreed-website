<script lang="ts">
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import type { AgreementLoadResult } from '$lib/demo/agreement-source-result';
  import ProductScreenshotFrame from './ProductScreenshotFrame.svelte';

  let { agreementResult }: { agreementResult: AgreementLoadResult } = $props();
</script>

<section class="px-[18px] pt-[calc(65px-var(--site-mobile-header-height))] sm:px-8 sm:pt-[calc(95px-var(--site-mobile-header-height))] lg:pt-[90px]">
  <ContentMeasure class="flex flex-col items-center text-center">
    <h1 class="max-w-[540px] font-heading text-[45px] leading-[1.04] text-stone-750 sm:max-w-none sm:text-[55px]">
      Close deals fast and easy
    </h1>

    <p class="hero-support mt-[2px] max-w-[430px] font-light text-[21px] leading-[1.40] text-stone-500">
      Agreed is a sales agreement that explains itself
    </p>

    <div class="hero-actions mt-[24px] flex flex-col items-center">
      <ButtonLink
        href={createPortalAuthUrl('join', '/')}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        size="xlarge"
        shape="pill"
        highlightSweep
        style="height: 57.76px; padding-inline: 25.27px; font-size: 17.1475px;"
        class="shadow-[0_5px_12px_rgba(41,37,36,0.2)] hover:-translate-y-[2px] hover:shadow-[0_8px_11px_rgba(41,37,36,0.28)]"
      >
        Start for free
      </ButtonLink>
    </div>
  </ContentMeasure>

  <!-- Wider stage gives the annotation its own gutter. -->
  <div
    id="demo"
    class="hero-graphic relative mx-auto mt-[80px] w-full max-w-[1320px]"
  >
    <div class="demo-content mx-auto w-full max-w-[1040px]">
      <CustomerLogos
        count={8}
        appearance="muted"
        interactive
        mobileCount={4}
        class="mb-[12px] sm:mb-[14px]"
      />

      <ProductScreenshotFrame {agreementResult} />
    </div>

    <div
      class="demo-callout pointer-events-none absolute right-[34px] top-[45px] z-10 hidden xl:block"
      aria-hidden="true"
    >
      <span class="demo-callout-text">
        try the product
      </span>

      <svg
        class="demo-callout-arrow"
        width="148"
        height="104"
        viewBox="0 0 148 104"
        fill="none"
        aria-hidden="true"
      >
        <!-- A loose loop flowing into a shorter leftward sweep. -->
        <path
          d="
            M122 8
            C134 30 126 53 108 54
            C88 56 79 32 93 27
            C113 20 121 52 95 69
            C74 86 48 84 14 80
          "
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Slightly curved, asymmetric pen strokes. -->
        <path
          d="
            M27 71
            Q19 75 14 80
            Q20 85 25 90
          "
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</section>

<style>
  section {
    --hero-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --hero-content-duration: 320ms;
    --hero-content-delay: 690ms;
  }

  .hero-title-lead {
    opacity: 0;
    transform: translateY(4px);
    animation: hero-content-enter 420ms var(--hero-ease) 220ms both;
  }

  .hero-title-rest {
    opacity: 0;
    transform: translateX(-10px);
    animation: hero-content-enter 420ms var(--hero-ease) 350ms both;
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

  .demo-callout {
    color: #77716a;
  }

  .demo-callout-text {
    display: block;
    font-family:
      'Bradley Hand',
      'Segoe Print',
      'Comic Sans MS',
      cursive;
    font-size: 18px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    letter-spacing: -0.2px;
    transform: rotate(-4deg);
    transform-origin: left center;
  }

  .demo-callout-arrow {
    display: block;
    width: 148px;
    height: 104px;
    margin-top: 5px;
    margin-left: -40px;
    overflow: visible;
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
</style>