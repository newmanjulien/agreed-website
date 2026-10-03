<script lang="ts">
	import { getContractContext } from '$lib/components/contract-demo/document/runtime/context';

	const { source, renderer } = getContractContext();
	const requiresApproval = $derived(source.items.some((item) =>
		item.concessions.some((concession) =>
			concession.id === renderer.snapshot?.concessions[item._id] && concession.requiresApproval
		)
	));
	const actionButtonClass =
		'cursor-pointer rounded-lg border border-accent bg-accent px-5 py-2.5 font-normal text-surface enabled:hover:border-accent-hover enabled:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent disabled:cursor-default disabled:border-line disabled:bg-control-fill disabled:text-ink-muted';
</script>

<div class="pt-6" data-workspace-actions role="group" aria-label="Contract actions">
	<div class="flex justify-center gap-3">
		<button
			type="button"
			data-contract-action="approval"
			class={actionButtonClass}
			disabled={!requiresApproval}
		>Ask for approval</button>
		<button type="button" class={actionButtonClass} disabled={requiresApproval}>Send to buyer</button>
	</div>
	<p class="mt-3 text-center text-[14px] text-line-strong" role="status">
		{requiresApproval ? '2 of your changes need approval' : 'None of your changes need approval'}
	</p>
</div>
