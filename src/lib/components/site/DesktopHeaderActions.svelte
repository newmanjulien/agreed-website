<script lang="ts">
  import { page } from '$app/state';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
</script>

<div class="z-layer-chrome fixed right-[42px] top-[31px] hidden items-center gap-[10px] lg:flex">
  <ButtonLink href={createPortalAuthUrl('login', page.url.pathname)} target="_blank" rel="noopener noreferrer" variant="secondary" size="small">Log in</ButtonLink>
  <ButtonLink href={createPortalAuthUrl('join', page.url.pathname)} target="_blank" rel="noopener noreferrer" variant="primary" size="small">Get started</ButtonLink>
</div>
