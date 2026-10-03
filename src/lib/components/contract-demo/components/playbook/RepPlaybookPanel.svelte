<script lang="ts">
	import { untrack } from 'svelte';
	import type { PlaybookItemRecord } from '$lib/components/contract-demo/playbook/model';
	import { instructionsFields } from '$lib/components/contract-demo/playbook/instructions-fields';
	import InlineAction from './InlineAction.svelte';
	import PlaybookCard from './PlaybookCard.svelte';
	import PlaybookSection from './PlaybookSection.svelte';
	import PlaybookText from './PlaybookText.svelte';
	let {
		item,
		selected,
		open = $bindable(null),
		conflicts = {},
		disabled = false,
		onToggle
	}: {
		item: PlaybookItemRecord;
		selected?: string;
		open?: string | null;
		conflicts?: Record<string, string>;
		disabled?: boolean;
		onToggle?: (id: string) => void;
	} = $props();
	let previousItemId = untrack(() => item._id);
	const panelId = $props.id();
	const hasSummary = $derived(Boolean(item.instructions?.summary?.trim()));
	const hasSections = $derived(
		Boolean(
			item.concessions.length ||
			instructionsFields.slice(1).some((field) => item.instructions?.[field.key]?.trim())
		)
	);
	$effect(() => {
		if (item._id !== previousItemId) {
			previousItemId = item._id;
			open = null;
		}
	});
</script>

<PlaybookCard label="Instruction box">
	{#if hasSummary}
		<div class="text-ink-muted"><PlaybookText text={item.instructions?.summary ?? ''} /></div>
	{/if}
	{#if hasSections}
		<div class="flex flex-col gap-2">
			{#if item.instructions}
				{#each instructionsFields.slice(1) as field}
					{#if item.instructions[field.key]?.trim()}
						<PlaybookSection value={field.key} label={field.label} bind:open>
							<PlaybookText text={item.instructions[field.key] ?? ''} />
						</PlaybookSection>
					{/if}
				{/each}
			{/if}
			{#each ['preferred', 'rare'] as tier}
				{@const concessions = item.concessions.filter((concession) => concession.tier === tier)}
				{#if concessions.length}
					<PlaybookSection
						value={tier}
						label={`${tier === 'preferred' ? 'Preferred' : 'Rare'} ${concessions.length === 1 ? 'concession' : 'concessions'}`}
						danger={tier === 'rare'}
						important={tier === 'preferred' && item.importantToNegotiate}
						bind:open
					>
						{#each concessions as concession, i (concession.id)}
							{@const applied = selected === concession.id}
							{@const conflict = !applied && conflicts[concession.id]}
							{@const descriptionId = `${panelId}-concession-${concession.id}-description`}
							<p class="m-0">
								<span id={descriptionId}>{concession.description}</span>{' '}
								{#if onToggle}<InlineAction
									danger={applied}
									concessionId={concession.id}
									disabled={disabled || Boolean(conflict)}
									label={concessions.length > 1
										? `${applied ? 'Remove' : 'Apply'} concession ${i + 1} of ${concessions.length}`
										: undefined}
									describedBy={conflict
										? `${descriptionId} ${descriptionId}-conflict`
										: descriptionId}
									onclick={() => onToggle?.(concession.id)}
									>{applied ? 'Remove concession' : 'Apply concession'}</InlineAction
								>{/if}
							</p>
							{#if conflict}<p id={`${descriptionId}-conflict`} class="m-0 text-sm text-danger">
									{conflict}
								</p>{/if}
						{/each}
					</PlaybookSection>
				{/if}
			{/each}
		</div>
	{/if}
</PlaybookCard>
