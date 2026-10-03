<script lang="ts">
  type Alignment = 'left' | 'center';

  type Props = {
    interactive?: boolean;
    animate?: boolean;
    class?: string;
  } & (
    | {
        layout?: 'default';
        count?: number;
        columns?: number;
        mobileColumns?: number;
        mobileCount?: number;
        align?: Alignment;
      }
    | {
        layout: 'demo';
        count?: never;
        columns?: never;
        mobileColumns?: never;
        mobileCount?: never;
        align?: never;
      }
  );

  let {
    count = 5,
    interactive = false,
    columns,
    mobileColumns,
    mobileCount,
    layout = 'default',
    align = 'center',
    animate = true,
    class: className = ''
  }: Props = $props();

  const brands = [
    {
      name: 'Oceans',
      src: '/logos/oceans.png',
      width: 496,
      height: 125,
      displayHeight: 'clamp(18px, 2vw, 24px)'
    },
    {
      name: 'Street Talk',
      src: '/logos/street-talk.png',
      width: 1103,
      height: 404,
      displayHeight: 'clamp(17px, 1.9vw, 23px)'
    },
    {
      name: 'Zensai',
      src: '/logos/zensai-color.png',
      width: 2640,
      height: 749,
      displayHeight: 'clamp(18px, 2vw, 24px)'
    },
    {
      name: 'Brex',
      src: '/logos/brex.png',
      width: 800,
      height: 211,
      displayHeight: 'clamp(15px, 1.6vw, 20px)'
    },
    {
      name: 'Vanta',
      src: '/logos/vanta.png',
      width: 716,
      height: 279,
      displayHeight: 'clamp(19px, 2.1vw, 25px)'
    }
  ] as const;

  const logoSlots = $derived(
    Array.from({ length: layout === 'demo' ? 8 : Math.max(0, Math.floor(count)) }, (_, index) => {
      const row = columns ? Math.floor(index / columns) : 0;
      const offset = row * 2;

      return brands[(index + offset) % brands.length];
    })
  );
</script>

<p class="sr-only">
  Customers since 2026 include {brands.map((brand) => brand.name).join(', ')}.
</p>

{#snippet logos()}
  <div
    class={[
      'customer-logos relative z-[2] mx-auto w-full max-w-[880px] items-center gap-[clamp(26px,calc(2.3vw+5px),36px)] px-2',
      columns !== undefined ? 'grid grid-cols-[repeat(var(--desktop-columns),minmax(0,1fr))] gap-y-2.5 max-md:grid-cols-[repeat(var(--mobile-columns),minmax(0,1fr))] max-md:gap-y-6' : 'flex',
      align === 'center' ? 'justify-center justify-items-center' : 'justify-start justify-items-start',
      layout === 'demo' ? 'lg:gap-[33px] max-lg:flex max-lg:justify-between max-lg:gap-[clamp(16px,2.5cqw,24px)] max-lg:max-w-none max-lg:px-0' : ['max-md:max-w-[420px] max-md:gap-[clamp(23px,calc(4.75vw+4px),31px)] max-md:px-0', className]
    ]}
    data-layout={layout}
    style={`--desktop-columns: ${columns ?? 1}; --mobile-columns: ${
      mobileColumns ?? columns ?? 1
    };`}
    aria-hidden="true"
  >
    {#each logoSlots as brand, index (`${brand.name}-${index}`)}
      <div
        class={[
          'logo-item group/logo relative grid h-9 min-w-0 place-items-center first:[--tooltip-anchor:0%] last:[--tooltip-anchor:100%]',
          layout === 'demo' ? 'lg:flex-none' : 'flex-none',
          animate && 'logo-enter motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none',
          layout === 'default' && mobileCount !== undefined && index >= mobileCount && 'max-md:hidden',
          layout === 'default' && mobileCount !== undefined && index === mobileCount - 1 && 'max-md:[--tooltip-anchor:100%]',
          layout === 'demo' && [
            index >= 4 && 'max-lg:@max-[440px]/customer-logos:hidden',
            index === 3 && 'max-lg:@max-[440px]/customer-logos:[--tooltip-anchor:100%]',
            index >= 5 && 'max-lg:@max-[560px]/customer-logos:hidden',
            index === 4 && 'max-lg:@max-[560px]/customer-logos:[--tooltip-anchor:100%]',
            index >= 6 && 'max-lg:@max-[704px]/customer-logos:hidden',
            index === 5 && 'max-lg:@max-[704px]/customer-logos:[--tooltip-anchor:100%]'
          ]
        ]}
        style:--logo-index={index}
        style={`--logo-ratio: ${brand.width / brand.height}; --logo-height: ${brand.displayHeight};`}
      >
        <span class={['block h-(--logo-height) aspect-(--logo-ratio) [transform:scale(0.9025)]', layout === 'demo' && 'max-lg:min-w-0 max-lg:h-auto max-lg:justify-self-stretch max-lg:transform-none']}>
          <img class="block h-full w-full object-contain" src={brand.src} alt="" width={brand.width} height={brand.height} />
        </span>

        {#if interactive}
          <span class="pointer-events-none absolute top-[calc(100%+7px)] left-[var(--tooltip-anchor,50%)] z-[1] w-max rounded-[7px] bg-ink px-2.5 py-[7px] text-[12px] font-[450] leading-none text-white whitespace-nowrap shadow-[0_6px_16px_color-mix(in_srgb,var(--color-ink)_18%,transparent)] opacity-0 [transform:translateX(calc(-1*var(--tooltip-anchor,50%)))] group-hover/logo:opacity-100">
            {brand.name} · Customer since 2026
          </span>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#if layout === 'demo'}
  <div class={`w-full @container/customer-logos ${className}`}>
    {@render logos()}
  </div>
{:else}
  {@render logos()}
{/if}

<style>
  @layer components {
    /* The parent can supply --logos-enter-delay for the staggered entrance. */
    .logo-enter {
      opacity: 0;
      transform: translateY(4px);
      animation: logo-enter 220ms cubic-bezier(0.22, 1, 0.36, 1)
        calc(var(--logos-enter-delay, 0ms) + var(--logo-index) * 70ms) both;
    }

    @keyframes logo-enter {
      to { opacity: 1; transform: translateY(0); }
    }

    @media (width < 1024px) {
      .customer-logos[data-layout='demo'] {
        /* Existing sizes remain usable without CSS typed division. */
        --demo-enlargement: 1;
      }

      .customer-logos[data-layout='demo'] .logo-item {
        /* Flex shrink applies the same proportion to every reference width. */
        flex: 0 1
          calc(var(--logo-height) * var(--logo-ratio) * 0.9025 * var(--demo-enlargement));
      }

      @supports (height: calc(1px * (1px / 1px))) {
        .customer-logos[data-layout='demo'] {
          /* Up to 25% larger through 704px, tapering to desktop size at 936px. */
          --demo-enlargement: clamp(
            1,
            calc(1.25 - (100cqw - 704px) / (936px - 704px) * 0.25),
            1.25
          );
        }
      }
    }
  }
</style>
