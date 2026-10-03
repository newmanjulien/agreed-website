<script lang="ts">
  import '$lib/styles/marketing.css';
  import type { LayoutProps } from './$types';
  import CalendarButton from '$lib/components/site/CalendarButton.svelte';
  import DesktopHeaderActions from '$lib/components/site/DesktopHeaderActions.svelte';
  import DesktopSideMenu from '$lib/components/site/DesktopSideMenu.svelte';
  import Footer from '$lib/components/site/Footer.svelte';
  import MobileHeader from '$lib/components/site/MobileHeader.svelte';
  import LayoutProfileSurface from '$lib/components/contract-demo/components/document/LayoutProfileSurface.svelte';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://portal.overbase.app" />
</svelte:head>

<LayoutProfileSurface />

<div class="flex min-h-[100dvh] flex-col bg-[var(--site-bg)]">
  <DesktopSideMenu />
  <DesktopHeaderActions />
  <MobileHeader />
  <CalendarButton />

  <div class="flex-1">
    {@render children()}
  </div>

  <Footer />
</div>
