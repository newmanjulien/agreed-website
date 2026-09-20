<script lang="ts">
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import CustomerLogos from '$lib/components/marketing/CustomerLogos.svelte';
  import RequestsDemo from './requests-demo/RequestsDemo.svelte';

  let { id }: { id?: string } = $props();
</script>

<section
  {id}
  class={[
    'px-[18px] pt-[calc(65px-var(--site-mobile-header-height))] sm:px-8 sm:pt-[calc(95px-var(--site-mobile-header-height))] lg:pt-[90px]',
    id && 'anchor-section'
  ]}
>
  <ContentMeasure class="flex flex-col items-center text-center">
    <h1
      class="max-w-[590px] font-heading text-[45px] leading-[1.04] text-ink sm:max-w-none sm:text-[50px]"
    >
      Close deals. Skip the wait
    </h1>

    <p
      class="hero-support mt-[8px] max-w-[550px] font-light text-[17px] leading-[1.40] text-ink-muted"
    >
    Agreed lets sales reps safely get contracts signed on their own.
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
        class="shadow-[0_5px_12px_rgba(32,33,36,0.2)] hover:-translate-y-[2px] hover:shadow-[0_8px_11px_rgba(32,33,36,0.28)]"
      >
        Start for free
      </ButtonLink>
    </div>
  </ContentMeasure>

  <div class="hero-graphic relative mx-auto mt-[80px] w-full max-w-[1320px]">
    <div class="mx-auto w-full max-w-[1040px]">
      <CustomerLogos
        count={8}
        interactive
        mobileCount={4}
        class="mb-[12px] sm:mb-[14px]"
      />

      <div
        class="mx-auto h-[560px] w-full max-w-[936px] overflow-hidden rounded-[12px] border border-line/90 bg-line/60 p-[6px] shadow-[0_18px_45px_-24px_rgba(32,33,36,0.22)] sm:aspect-[1770/1112] sm:h-auto sm:rounded-[14px] sm:p-[7px]"
      >
        <div
          class="h-full w-full overflow-hidden rounded-[6px] border border-line bg-surface sm:rounded-[8px]"
        >
          <RequestsDemo />
        </div>
      </div>
    </div>

    <div
      class="demo-callout pointer-events-none absolute right-[48px] top-[45px] z-10 hidden xl:block"
      aria-hidden="true"
    >
      <span class="demo-callout-text">click to try</span>

      <svg
        class="demo-callout-arrow"
        width="130"
        height="104"
        viewBox="0 0 130 104"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="
            M110 8
            C122 30 114 53 98 54
            C80 56 72 32 85 27
            C103 20 110 52 87 69
            C68 86 49 84 30 80
          "
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <path
          d="
            M43 71
            Q35 75 30 80
            Q36 85 41 90
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
    color: color-mix(in srgb, var(--color-ink) 80%, transparent);
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
    width: 130px;
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