<script lang="ts">
  type Appearance = 'muted' | 'color';
  type Alignment = 'left' | 'center';

  type Props = {
    count?: number;
    appearance?: Appearance;
    interactive?: boolean;
    columns?: number;
    mobileColumns?: number;
    mobileCount?: number;
    align?: Alignment;
    class?: string;
  };

  let {
    count = 5,
    appearance = 'color',
    interactive = false,
    columns,
    mobileColumns,
    mobileCount,
    align = 'center',
    class: className = ''
  }: Props = $props();

  const brands = [
    {
      name: 'Oceans',
      colorSrc: '/logos/oceans.png',
      maskSrc: '/logos/oceans.png',
      width: 496,
      height: 125,
      displayHeight: 'clamp(18px, 2vw, 24px)'
    },
    {
      name: 'Street Talk',
      colorSrc: '/logos/street-talk.png',
      maskSrc: '/logos/street-talk.png',
      width: 1103,
      height: 404,
      displayHeight: 'clamp(17px, 1.9vw, 23px)'
    },
    {
      name: 'Zensai',
      colorSrc: '/logos/zensai-color.png',
      maskSrc: '/logos/zensai-mask.png',
      width: 2640,
      height: 749,
      displayHeight: 'clamp(18px, 2vw, 24px)'
    },
    {
      name: 'Brex',
      colorSrc: '/logos/brex.png',
      maskSrc: '/logos/brex.png',
      width: 800,
      height: 211,
      displayHeight: 'clamp(15px, 1.6vw, 20px)'
    },
    {
      name: 'Vanta',
      colorSrc: '/logos/vanta.png',
      maskSrc: '/logos/vanta.png',
      width: 716,
      height: 279,
      displayHeight: 'clamp(19px, 2.1vw, 25px)'
    }
  ] as const;

  const logoSlots = $derived(
    Array.from(
      { length: Math.max(0, Math.floor(count)) },
      (_, index) => {
        const row = columns ? Math.floor(index / columns) : 0;
        const offset = row * 2;

        return brands[(index + offset) % brands.length];
      }
    )
  );
</script>

<p class="sr-only">
  Customers since 2026 include {brands.map((brand) => brand.name).join(', ')}.
</p>

<div
  class={`customer-logos ${className}`}
  class:grid={columns !== undefined}
  data-appearance={appearance}
  data-interactive={interactive}
  data-align={align}
  style={`--desktop-columns: ${columns ?? 1}; --mobile-columns: ${
    mobileColumns ?? columns ?? 1
  };`}
  aria-hidden="true"
>
  {#each logoSlots as brand, index (`${brand.name}-${index}`)}
    <div
      class="logo-item"
      class:hidden-mobile={mobileCount !== undefined && index >= mobileCount}
      class:mobile-last={mobileCount !== undefined && index === mobileCount - 1}
    >
      <span
        class="logo-art"
        style={`--logo-mask: url("${brand.maskSrc}"); --logo-ratio: ${
          brand.width / brand.height
        }; --logo-height: ${brand.displayHeight};`}
      >
        <img
          src={brand.colorSrc}
          alt=""
          width={brand.width}
          height={brand.height}
        />
      </span>

      {#if interactive}
        <span class="logo-tooltip">
          {brand.name} · Customer since 2026
        </span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .customer-logos {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(26px, calc(2.3vw + 5px), 36px);
    width: 100%;
    max-width: 880px;
    margin-inline: auto;
    padding-inline: 8px;
  }

  .customer-logos.grid {
    display: grid;
    grid-template-columns: repeat(
      var(--desktop-columns),
      minmax(0, 1fr)
    );
    row-gap: 10px;
  }

  .customer-logos[data-align='center'] {
    justify-content: center;
  }

  .customer-logos.grid[data-align='center'] {
    justify-items: center;
  }

  .customer-logos[data-align='left'] {
    justify-content: flex-start;
  }

  .customer-logos.grid[data-align='left'] {
    justify-items: start;
  }

  .logo-item {
    position: relative;
    display: grid;
    height: 36px;
    min-width: 0;
    flex: 0 0 auto;
    place-items: center;
  }

  .logo-art {
    position: relative;
    display: block;
    height: var(--logo-height);
    aspect-ratio: var(--logo-ratio);
    transform: scale(0.9025);
  }

  .logo-art::before {
    position: absolute;
    inset: 0;
    content: '';
    background: #aaa49b;
    -webkit-mask-image: var(--logo-mask);
    mask-image: var(--logo-mask);
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    mask-size: contain;
  }

  .logo-art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .customer-logos[data-appearance='muted'] .logo-art img {
    opacity: 0;
  }

  .customer-logos[data-appearance='color'] .logo-art::before {
    display: none;
  }

  .customer-logos[data-appearance='color'] .logo-art img {
    opacity: 1;
  }

  .customer-logos[data-interactive='true'][data-appearance='muted']
    .logo-item:hover
    .logo-art::before {
    opacity: 0;
  }

  .customer-logos[data-interactive='true'][data-appearance='muted']
    .logo-item:hover
    .logo-art
    img {
    opacity: 1;
  }

  .logo-tooltip {
    --tooltip-x: -50%;

    position: absolute;
    top: calc(100% + 7px);
    left: 50%;
    z-index: 1;
    width: max-content;
    padding: 7px 10px;
    border-radius: 7px;
    background: #1d1a16;
    color: #fff;
    font-size: 12px;
    font-weight: 450;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 6px 16px rgb(29 26 22 / 18%);
    opacity: 0;
    pointer-events: none;
    transform: translateX(var(--tooltip-x));
  }

  .customer-logos[data-interactive='true']
    .logo-item:hover
    .logo-tooltip {
    opacity: 1;
  }

  .logo-item:first-child .logo-tooltip {
    --tooltip-x: 0%;
    left: 0;
  }

  .logo-item:last-child .logo-tooltip {
    --tooltip-x: 0%;
    right: 0;
    left: auto;
  }

  @media (max-width: 767px) {
    .customer-logos {
      gap: clamp(23px, calc(4.75vw + 4px), 31px);
      max-width: 420px;
      padding-inline: 0;
    }

    .customer-logos.grid {
      grid-template-columns: repeat(
        var(--mobile-columns),
        minmax(0, 1fr)
      );
      row-gap: 24px;
    }

    .logo-item.hidden-mobile {
      display: none;
    }

    .logo-item.mobile-last .logo-tooltip {
      --tooltip-x: 0%;
      right: 0;
      left: auto;
    }
  }
</style>