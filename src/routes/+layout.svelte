<script lang="ts">
  import '$lib/styles/marketing.css';
  import type { LayoutProps } from './$types';
  import DesktopHeaderActions from '$lib/components/site/DesktopHeaderActions.svelte';
  import DesktopSideMenu from '$lib/components/site/DesktopSideMenu.svelte';
  import Footer from '$lib/components/site/Footer.svelte';
  import MobileHeader from '$lib/components/site/MobileHeader.svelte';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://portal.overbase.app" />
  <link
    rel="preload"
    href="/fonts/newsreader.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</svelte:head>

<div class="flex min-h-[100dvh] flex-col bg-[var(--site-bg)]">
  <DesktopSideMenu />
  <DesktopHeaderActions />
  <MobileHeader />

  <div class="flex-1">
    {@render children()}
  </div>

  <Footer />
</div>