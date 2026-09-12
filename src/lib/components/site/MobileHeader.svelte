<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { cubicOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { plugins } from '$lib/data/plugins';
  import { productNavItems } from '$lib/data/navigation';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';

  let open = $state(false);
  afterNavigate(() => { open = false; });
  const navSections = [
    { id: 'mobile-plugins-heading', label: 'Plugins', links: plugins },
    { id: 'mobile-site-heading', label: 'Overbase', links: productNavItems }
  ] as const;
  const activePath = $derived(page.url.pathname);
</script>

<header class="z-layer-chrome sticky top-0 flex h-[var(--site-mobile-header-height)] w-full items-center justify-between bg-white px-[20px] lg:hidden">
  <a href="/" class="h-[34.7236875px] w-fit" aria-label="Home">
    <img src="/logo.png" alt="" class="h-full w-auto" />
  </a>
  <button
    type="button"
    class="-mr-[4px] inline-flex h-[38px] w-[38px] items-center justify-center text-black"
    aria-label={open ? 'Close menu' : 'Open menu'}
    aria-expanded={open}
    aria-controls="mobile-menu"
    onclick={() => (open = !open)}
  >
    <span class="relative block h-[26px] w-[26px]" aria-hidden="true">
      <span class="line line-top"></span>
      <span class="line line-bottom"></span>
    </span>
  </button>

  {#if open}
    <nav
      id="mobile-menu"
      class="z-layer-chrome-popover fixed bottom-0 left-0 right-0 top-[var(--site-mobile-header-height)] flex flex-col overflow-y-auto bg-white pb-[28px]"
      aria-label="Mobile primary"
      transition:slide={{ duration: 380, axis: 'y', easing: cubicOut }}
    >
      <div class="flex flex-col gap-[30px] px-[20px] pt-[26px]">
        {#each navSections as section (section.id)}
          <section aria-labelledby={section.id}>
            <h2 id={section.id} class="mb-[14px] text-[12px] font-book uppercase leading-none tracking-[0.12em] text-stone-400">{section.label}</h2>
            <div class="flex flex-col">
              {#each section.links as link (link.href)}
                {@const isActive = activePath === link.href}
                <a href={link.href} class={['py-[10px] text-[20px] leading-none', isActive ? 'text-stone-900' : 'text-stone-600']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
              {/each}
            </div>
          </section>
        {/each}
      </div>
      <div class="mt-[30px] flex flex-col gap-[12px] border-t border-stone-200 px-[20px] pt-[24px]">
        <ButtonLink href={createPortalAuthUrl('login', activePath)} target="_blank" rel="noopener noreferrer" variant="soft" size="large" fullWidth>Log in</ButtonLink>
        <ButtonLink href={createPortalAuthUrl('join', activePath)} target="_blank" rel="noopener noreferrer" variant="primary" size="large" fullWidth>Get started</ButtonLink>
      </div>
    </nav>
  {/if}
</header>

<style>
  .line {
    position: absolute;
    left: 3px;
    top: 50%;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    transform-origin: center;
    transition: transform 260ms ease;
  }
  .line-top { transform: translateY(-4px) rotate(0deg); }
  .line-bottom { transform: translateY(4px) rotate(0deg); }
  button[aria-expanded='true'] .line-top { transform: translateY(0) rotate(45deg); }
  button[aria-expanded='true'] .line-bottom { transform: translateY(0) rotate(-45deg); }
  @media (prefers-reduced-motion: reduce) { .line { transition-duration: 1ms; } }
</style>
