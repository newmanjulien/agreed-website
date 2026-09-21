<script lang="ts">
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';

  let { id }: { id?: string } = $props();
</script>

<section {id} class="border-t border-line bg-white px-[18px] py-[72px] sm:px-8 sm:py-[90px]">
  <ContentMeasure class="flex flex-col items-center text-center">
    <h2 class="font-heading text-[26px] leading-[1.08] text-ink sm:text-[31px] sm:leading-[1.06]">
      Accelerate your sales cycle
    </h2>

    <p class="mt-[12px] max-w-[400px] text-[18px] font-book leading-[1.6] text-ink">
      CLose deals instead of waiting on contract review.
    </p>

    <ButtonLink
      href={createPortalAuthUrl('join', '/')}
      target="_blank"
      rel="noopener noreferrer"
      variant="primary"
      size="xlarge"
      shape="pill"
      class="mt-[33px]"
    >
      Start for free
    </ButtonLink>
  </ContentMeasure>
</section>
