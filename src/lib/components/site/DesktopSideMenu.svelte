<script lang="ts">
  import { page } from '$app/state';
  import { productNavItems } from '$lib/data/navigation';

  const activePath = $derived(page.url.pathname);
</script>

<aside class="z-(--layer-chrome) fixed left-[54px] top-[36px] hidden lg:block" aria-label="Primary">
  <a href="/" class="mb-[22px] block h-[27.5px] w-fit" aria-label="Home">
    <img src="/logo.png" alt="" class="h-full w-auto" />
  </a>
  <nav class="flex flex-col gap-[15px] text-[14px] font-book leading-none text-ink">
    {#each productNavItems as link (link.href)}
      {@const isActive = activePath === link.href}
      <a href={link.href} class={['w-fit hover:text-ink', isActive && 'text-ink']} aria-current={isActive ? 'page' : undefined}>{link.label}</a>
    {/each}
  </nav>
</aside>
