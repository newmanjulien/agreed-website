<script lang="ts">
	let { approvalCount, highlighted = false }: { approvalCount: number; highlighted?: boolean } = $props();
</script>

<div class="contract-actions" data-contract-actions>
	<div class="action-buttons">
		<button type="button" tabindex="-1" data-animation-target="approval" disabled={approvalCount === 0} class:highlighted>Ask for approval</button>
		<button type="button" tabindex="-1" disabled={approvalCount > 0}>Send to buyer</button>
	</div>
	<p>{approvalCount === 0 ? 'None of your changes need approval' : approvalCount === 1 ? '1 of your changes needs approval' : `${approvalCount} of your changes need approval`}</p>
</div>

<style>
	.contract-actions { width: 816px; padding: 24px 0 16px; }
	.action-buttons { display: flex; justify-content: center; gap: 12px; }
	button { border: 1px solid var(--color-accent); border-radius: 8px; background: var(--color-accent); color: white; padding: 10px 20px; font: inherit; white-space: nowrap; }
	button.highlighted { border-color: var(--color-accent-hover); background: var(--color-accent-hover); }
	button:disabled { border-color: var(--color-line); background: var(--color-control-fill); color: var(--color-ink-muted); }
	p { margin: 12px 0 0; text-align: center; font-size: 14px; color: var(--color-line-strong); }
	:global(.product-animation.is-mobile) .contract-actions { width: 100%; font-size: 13px; }
	:global(.product-animation.is-mobile) button { padding: 10px 12px; }
</style>
