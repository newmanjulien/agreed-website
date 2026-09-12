<script lang="ts">
	import type { AgreementSourceIssue } from '$lib/demo/agreement-source-result';

	let {
		kind,
		issues
	}: {
		kind: 'source' | 'internal';
		issues: readonly AgreementSourceIssue[];
	} = $props();
	const issueLimit = 20;
	let visibleIssues = $derived(issues.slice(0, issueLimit));
	let hiddenIssueCount = $derived(Math.max(0, issues.length - issueLimit));
</script>

<div
	class="flex min-h-full items-center justify-center bg-demo-canvas px-5 py-12 text-demo-ink"
	aria-label="Agreement source error"
>
	<section class="w-full max-w-[680px] rounded-demo-panel border border-demo-line bg-demo-surface p-6" role="alert">
		<h1 class="m-0 text-xl font-semibold">
			{kind === 'internal' ? 'We couldn’t prepare this agreement' : 'The agreement needs attention'}
		</h1>
		<p class="mt-2 mb-0 text-sm leading-[1.5] text-demo-ink-muted">
			{kind === 'internal'
				? 'The interactive demo is temporarily unavailable. Please try again later.'
				: 'Correct the source below and save it again. The application will recover automatically.'}
		</p>
		<ul class="mt-5 mb-0 space-y-2 pl-5 text-sm leading-[1.5]">
			{#each visibleIssues as issue}
				<li>
					<span class="font-medium">
						{issue.line && issue.column
							? `Line ${issue.line}, column ${issue.column}:`
							: 'Document:'}
					</span>
					{issue.message}
				</li>
			{/each}
			{#if hiddenIssueCount}
				<li>{hiddenIssueCount} additional issue{hiddenIssueCount === 1 ? '' : 's'} not shown.</li>
			{/if}
		</ul>
	</section>
</div>
