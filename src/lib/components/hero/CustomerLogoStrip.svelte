<script lang="ts">
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

  const logoSlots = Array.from({ length: 8 }, (_, index) => brands[index % brands.length]);
</script>

<p class="sr-only">Customers since 2026 include {brands.map((brand) => brand.name).join(', ')}.</p>
<div class="logo-strip" aria-hidden="true">
  {#each logoSlots as brand, index (`${brand.name}-${index}`)}
    <div class="logo-item">
      <span
        class="logo-art"
        style={`--logo-mask: url("${brand.maskSrc}"); --logo-ratio: ${brand.width / brand.height}; --logo-height: ${brand.displayHeight};`}
      >
        <img src={brand.colorSrc} alt="" width={brand.width} height={brand.height} />
      </span>
      <span class="logo-tooltip">{brand.name} · Customer since 2026</span>
    </div>
  {/each}
</div>

<style>
  .logo-strip {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(25px, calc(2.25vw + 5px), 35px);
    width: 100%;
    max-width: 880px;
    margin: 0 auto 14px;
    padding: 0 8px;
  }

  .logo-item {
    position: relative;
    display: grid;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
  }

  .logo-art {
    position: relative;
    display: block;
    height: var(--logo-height);
    aspect-ratio: var(--logo-ratio);
    transform: scale(0.95);
  }

  .logo-art::before {
    position: absolute;
    inset: 0;
    background: #aaa49b;
    content: '';
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
    opacity: 0;
  }

  .logo-item:hover .logo-art::before {
    opacity: 0;
  }

  .logo-item:hover .logo-art img {
    opacity: 1;
  }

  .logo-tooltip {
    --tooltip-x: -50%;
    position: absolute;
    top: calc(100% + 7px);
    left: 50%;
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

  .logo-item:hover .logo-tooltip {
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
    .logo-strip {
      gap: clamp(22px, calc(5vw + 5px), 29px);
      max-width: 420px;
      margin-bottom: 12px;
      padding: 0;
    }

    .logo-item:nth-child(n + 5) {
      display: none;
    }

    .logo-item:nth-child(4) .logo-tooltip {
      --tooltip-x: 0%;
      right: 0;
      left: auto;
    }
  }
</style>
