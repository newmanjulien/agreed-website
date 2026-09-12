<script lang="ts">
  import type { AgreementLoadResult } from '$lib/demo/agreement-source-result';
  import AgreementApp from '$lib/demo/components/document/AgreementApp.svelte';
  import AgreementSourceError from '$lib/demo/components/document/AgreementSourceError.svelte';

  let { agreementResult }: { agreementResult: AgreementLoadResult } = $props();
</script>

<div
  class="relative mx-auto h-[560px] w-full max-w-[936px] overflow-hidden rounded-[12px] border border-stone-200/90 bg-stone-100/70 p-[7px] shadow-[0_18px_45px_-24px_rgba(41,37,36,0.22)] sm:aspect-[1770/1112] sm:h-auto sm:rounded-[16px] sm:p-[9px]"
>
  <div
    class="agreement-demo-root relative h-full w-full overflow-hidden rounded-[7px] border border-stone-200 sm:rounded-[10px]"
    role="region"
    aria-label="Interactive Agreed agreement demo"
  >
    {#if agreementResult.ok}
      <AgreementApp agreement={agreementResult.agreement} />
    {:else}
      <AgreementSourceError kind={agreementResult.kind} issues={agreementResult.issues} />
    {/if}
  </div>
</div>
