<script lang="ts">
  import { page } from '$app/state';
  import { CaretRightIcon } from 'phosphor-svelte';
  import { plugins } from '$lib/data/plugins';
  import { productNavItems } from '$lib/data/navigation';

  const activePath = $derived(page.url.pathname);
</script>

<aside class="z-layer-chrome fixed left-[54px] top-[36px] hidden lg:block" aria-label="Primary">
  <a href="/" class="mb-[22px] block h-[27.5px] w-fit" aria-label="Home">
    <img src="/logo.png" alt="" class="h-full w-auto" />
  </a>
  <nav class="flex flex-col gap-[15px] text-[15px] font-book leading-none text-ink">
    <div class="group relative w-fit">
      <a href="/plugins" class="flex items-center gap-[6px] outline-none hover:text-ink focus-visible:text-ink" aria-haspopup="true">
        <span>Plugins</span>
        <CaretRightIcon class="transition-transform duration-150 group-hover:rotate-90 group-focus-within:rotate-90" size={13} weight="regular" aria-hidden="true" />
      </a>
      <div class="z-layer-chrome-popover pointer-events-none absolute left-0 top-full w-[214px] pt-[10px] opacity-0 transition delay-100 duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:delay-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:delay-0">
        <div class="flex flex-col gap-[14px] rounded-[7px] bg-canvas px-[14px] py-[13px] shadow-[0_4px_12px_rgba(32,33,36,0.035)] ring-1 ring-line/60">
          {#each plugins as link (link.href)}
            {@const isActive = activePath === link.href}
            <a href={link.href} class={['block text-[14px] font-book leading-none hover:text-ink focus-visible:text-ink focus-visible:outline-none', isActive && 'text-ink']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
          {/each}
        </div>
      </div>
    </div>
    {#each productNavItems as link (link.href)}
      {@const isActive = activePath === link.href}
      <a href={link.href} class={['w-fit hover:text-ink', isActive && 'text-ink']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
    {/each}
  </nav>
</aside>
