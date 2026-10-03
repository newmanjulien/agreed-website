<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { cubicOut } from 'svelte/easing';
  import { MediaQuery } from 'svelte/reactivity';
  import { slide } from 'svelte/transition';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { productNavItems } from '$lib/data/navigation';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';

  const lineClasses = 'absolute left-[3px] top-1/2 h-0.5 w-5 origin-center rounded-full bg-current rotate-0 transition-transform duration-[260ms] ease-[ease] group-aria-expanded:translate-y-0 motion-reduce:duration-[1ms]';
  let open = $state(false);
  const reduceMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  afterNavigate(() => { open = false; });
  const activePath = $derived(page.url.pathname);
</script>

<header class="z-(--layer-chrome) sticky top-0 flex h-[var(--site-mobile-header-height)] w-full items-center justify-between bg-[var(--site-bg)] px-[20px] lg:hidden">
  <a href="/" class="h-[30px] w-fit" aria-label="Home">
    <img src="/logo.png" alt="" class="h-full w-auto" />
  </a>
  <button
    type="button"
    class="group -mr-[4px] inline-flex h-[38px] w-[38px] items-center justify-center text-ink"
    aria-label={open ? 'Close menu' : 'Open menu'}
    aria-expanded={open}
    aria-controls="mobile-menu"
    onclick={() => (open = !open)}
  >
    <span class="relative block h-[26px] w-[26px]" aria-hidden="true">
      <span class={[lineClasses, '-translate-y-1 group-aria-expanded:rotate-45']}></span>
      <span class={[lineClasses, 'translate-y-1 group-aria-expanded:-rotate-45']}></span>
    </span>
  </button>

  {#if open}
    <nav
      id="mobile-menu"
      class="z-(--layer-chrome-popover) fixed bottom-0 left-0 right-0 top-[var(--site-mobile-header-height)] flex flex-col overflow-y-auto bg-[var(--site-bg)] pb-[28px]"
      aria-label="Mobile primary"
      transition:slide={{ duration: reduceMotion.current ? 0 : 380, axis: 'y', easing: cubicOut }}
    >
      <div class="flex flex-col px-[20px] pt-[26px]">
        <h2 class="mb-[14px] text-[12px] font-book uppercase leading-none tracking-[0.12em] text-ink-muted">Agreed</h2>
        {#each productNavItems as link (link.href)}
          {@const isActive = activePath === link.href}
          <a href={link.href} class={['py-[10px] text-[20px] leading-none', isActive ? 'text-ink' : 'text-ink-muted']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
        {/each}
      </div>
      <div class="mt-[30px] flex flex-col gap-[12px] border-t border-line px-[20px] pt-[24px]">
        <ButtonLink href={createPortalAuthUrl('login', activePath)} target="_blank" rel="noopener noreferrer" variant="soft" size="large" fullWidth>Log in</ButtonLink>
        <ButtonLink href={createPortalAuthUrl('join', activePath)} target="_blank" rel="noopener noreferrer" variant="primary" size="large" fullWidth>Get started</ButtonLink>
      </div>
    </nav>
  {/if}
</header>
