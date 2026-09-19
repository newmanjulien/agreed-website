<script lang="ts">
  import ContentMeasure from '$lib/components/ui/ContentMeasure.svelte';
  import ButtonLink from '$lib/components/ui/ButtonLink.svelte';
  import { createPortalAuthUrl } from '$lib/utils/portal-auth';
</script>

<section class="border-t border-stone-200 bg-stone-50/60 px-[18px] py-[72px] sm:px-8 sm:py-[90px]">
  <ContentMeasure class="flex flex-col items-center text-center">
    <h2 class="font-heading text-[26px] leading-[1.08] text-stone-750 sm:text-[31px] sm:leading-[1.06]">
      Accelerate your sales cycle
    </h2>

    <p class="mt-[12px] max-w-[400px] text-[18px] font-book leading-[1.6] text-stone-700">
      Spend less time waiting on contract review and more time getting deals signed.
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
