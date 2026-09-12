<script lang="ts">
  import { page } from '$app/state';
  import { CaretRightIcon } from 'phosphor-svelte';
  import { industries } from '$lib/data/industries';
  import { productNavItems } from '$lib/data/navigation';

  const activePath = $derived(page.url.pathname);
</script>

<aside class="z-layer-chrome fixed left-[54px] top-[36px] hidden lg:block" aria-label="Primary">
  <a href="/" class="mb-[16px] block h-[32.1515625px] w-fit" aria-label="Home">
    <img src="/logo.png" alt="" class="h-full w-auto" />
  </a>
  <nav class="flex flex-col gap-[15px] text-[15px] font-book leading-none text-stone-700">
    <div class="group relative w-fit">
      <a href="/industries" class="flex items-center gap-[6px] outline-none hover:text-stone-900 focus-visible:text-stone-900" aria-haspopup="true">
        <span>Plugins</span>
        <CaretRightIcon class="transition-transform duration-150 group-hover:rotate-90 group-focus-within:rotate-90" size={13} weight="regular" aria-hidden="true" />
      </a>
      <div class="z-layer-chrome-popover pointer-events-none absolute left-0 top-full w-[214px] pt-[10px] opacity-0 transition delay-100 duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:delay-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:delay-0">
        <div class="flex flex-col gap-[14px] rounded-[8px] bg-stone-50 px-[14px] py-[13px] shadow-[0_4px_12px_rgba(28,25,23,0.035)] ring-1 ring-stone-200/60">
          {#each industries as link (link.href)}
            {@const isActive = activePath === link.href}
            <a href={link.href} class={['block text-[14px] font-book leading-none hover:text-stone-900 focus-visible:text-stone-900 focus-visible:outline-none', isActive && 'text-stone-900']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
          {/each}
        </div>
      </div>
    </div>
    {#each productNavItems as link (link.href)}
      {@const isActive = activePath === link.href}
      <a href={link.href} class={['w-fit hover:text-stone-900', isActive && 'text-stone-900']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
    {/each}
  </nav>
</aside>
