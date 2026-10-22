<script lang="ts">
	import type { PreparedBlock, PreparedContract, AnimationState } from './model';
	let { contract, state }: { contract: PreparedContract; state: AnimationState } = $props();
	const snapshot = $derived(contract.states[state.contract]);
	const viewedTrigger = $derived(contract.panels.find((p) => p.id === state.clause)?.triggerId);
	const panelTrigger = $derived(contract.panels.find((p) => p.id === (state.box?.clause ?? state.clause))?.triggerId);
</script>

{#snippet content(block: PreparedBlock)}
	{#each block.runs ?? [] as run}
		{#if run.target || run.revision}
		<span
			data-highlight={run.target}
			class:highlight={Boolean(run.target) && !run.revision}
			class:selected={!run.revision && run.target === panelTrigger && Boolean(state.box)}
			class:hovered={!run.revision && run.target === viewedTrigger && state.hovered}
			class:added={run.revision === 'added'}
			class:removed={run.revision === 'removed'}
		>{run.text}</span>
		{:else}{run.text}{/if}
	{/each}
{/snippet}

<div class="contract-paper">
	{#each contract.pages as page, index}
		<article class="paper-page" data-page-number={index + 1}>
			<div class="page-content">
				{#each page as id (id)}
					{@const block = snapshot.patches[id] ?? contract.blocks[id]!}
					{#if block.kind === 'heading'}
						<svelte:element this={`h${block.level}`} class="paper-heading" class:main-heading={block.level === 1} data-block-key={id}>
							{@render content(block)}
						</svelte:element>
					{:else if block.kind === 'paragraph'}
						{#if block.runs?.length}<p class="paper-paragraph" data-block-key={id}>{@render content(block)}</p>{/if}
					{:else}
						<table class:signature={block.variant === 'signature'} data-block-key={id}>
							<thead>{#each block.rows?.slice(0, block.headerRowCount) ?? [] as row}<tr>{#each row as cell}<th>{cell}</th>{/each}</tr>{/each}</thead>
							<tbody>{#each block.rows?.slice(block.headerRowCount) ?? [] as row}<tr>{#each row as cell}<td>{cell}</td>{/each}</tr>{/each}</tbody>
						</table>
					{/if}
				{/each}
			</div>
			<span class="page-number">{index + 1}</span>
		</article>
	{/each}
</div>

<style>
	.contract-paper { width: 816px; display: flex; flex-direction: column; gap: 16px; }
	.paper-page { position: relative; min-height: 1056px; padding: 96px 96px 88px; background: white; border: 1px solid var(--color-line); }
	.paper-page:first-child { padding-top: 116px; }
	.page-content { color: #171717; }
	.paper-heading { margin: 34px 0 10px; font-size: 17px; line-height: 1.25; letter-spacing: -.25px; font-weight: bold; }
	.paper-heading.main-heading { margin: 0 0 24px; text-align: center; font-size: 20px; letter-spacing: -.4px; }
	.paper-paragraph { margin: 0 0 20px; text-align: justify; font-size: 15px; line-height: 1.46; }
	/* Revisions retain their own paint; transient clause states only color unchanged text. */
	.highlight, .added, .removed { box-decoration-break: clone; -webkit-box-decoration-break: clone; }
	.highlight { background: var(--document-highlight-trigger); }
	.highlight.hovered { background: var(--document-highlight-trigger-hover); }
	.highlight.selected { background: var(--document-highlight-trigger-selected); }
	.added { background: var(--document-highlight-revision-added); }
	.removed { background: var(--document-highlight-revision-removed); text-decoration: line-through; }
	table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; line-height: 1.4; margin: 12px 0 24px; }
	th, td { height: 44px; text-align: left; vertical-align: top; overflow-wrap: anywhere; border: .75px solid #babec3; padding: 8px; }
	th { background: var(--color-fill-subtle); }
	table.signature { table-layout: auto; margin: 30px 0; }
	.signature th, .signature td { border: 0; background: none; padding: 9px 12px 9px 0; }
	.page-number { position: absolute; bottom: 32px; right: 48px; color: #a3a3a3; font-size: 15px; }
	:global(.product-animation.is-mobile) .contract-paper { width: 100%; }
	:global(.product-animation.is-mobile) .paper-page { min-height: 540px; padding: 36px 24px 60px; }
	:global(.product-animation.is-mobile) .paper-paragraph { font-size: 14px; line-height: 1.5; text-align: left; }
	:global(.product-animation.is-mobile) .paper-heading { font-size: 16px; }
	:global(.product-animation.is-mobile) .main-heading { font-size: 18px; }
	:global(.product-animation.is-mobile) th, :global(.product-animation.is-mobile) td { font-size: 12px; padding: 5px; }
</style>
