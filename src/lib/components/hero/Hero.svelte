<script lang="ts">
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import type { AgreementLoadResult } from '$lib/demo/agreement-source-result';
  import CustomerLogoStrip from './CustomerLogoStrip.svelte';
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

  <div id="demo" class="hero-graphic mx-auto mt-[80px] w-full max-w-[1040px]">
    <CustomerLogoStrip />
    <ProductScreenshotFrame {agreementResult} />
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
    animation: hero-content-enter var(--hero-content-duration) var(--hero-ease) var(--hero-content-delay) both;
  }
  .hero-support { animation-delay: calc(var(--hero-content-delay) - 100ms); }
  .hero-actions { transform: translateY(10px); animation-duration: 620ms; }
  @keyframes hero-content-enter { to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .hero-support,
    .hero-actions,
    .hero-graphic { animation: none; opacity: 1; transform: none; }
  }
</style>
