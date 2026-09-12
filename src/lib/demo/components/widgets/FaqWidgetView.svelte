<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { FaqItem } from '$lib/demo/document/agreement-model';

	let {
		widgetId,
		items,
		openItemId,
		interactive,
		onToggle,
		onClauseReference,
		registerTarget,
		itemTargets = {}
	}: {
		widgetId: string;
		items: ReadonlyArray<FaqItem>;
		openItemId: string | null;
		interactive?: boolean;
		onToggle?: (itemId: string) => void;
		onClauseReference?: (clauseId: string) => void;
		registerTarget?: (name: string, element: Element | null) => void;
		itemTargets?: Readonly<Record<string, string>>;
	} = $props();

	let isInteractive = $derived(interactive ?? onToggle !== undefined);

	function navigateToClause(event: MouseEvent, clauseId: string) {
		if (!onClauseReference) return;
		event.preventDefault();
		onClauseReference(clauseId);
	}

	function clauseHref(clauseId: string): string {
		return `#clause-${clauseId}`;
	}

	function attachItem(itemId: string): Attachment {
		return (node) => {
			const target = itemTargets[itemId];
			if (!target || !registerTarget) return;
			registerTarget(target, node);
			return () => registerTarget(target, null);
		};
	}
</script>

<div class="flex flex-col gap-2">
	{#each items as item}
		{@const answerId = `${widgetId}-answer-${item.id}`}
		<div>
			<button
				class="w-full rounded-demo-panel border-0 bg-demo-canvas px-3.5 py-3 text-left text-[15px] leading-[1.3] text-demo-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-accent"
				class:cursor-pointer={isInteractive}
				class:hover:bg-demo-hover-subtle={isInteractive}
				type="button"
				aria-expanded={openItemId === item.id}
				aria-controls={answerId}
				tabindex={isInteractive ? 0 : -1}
				onclick={() => isInteractive && onToggle?.(item.id)}
				{@attach attachItem(item.id)}
			>
				{item.question}
			</button>

			<div
				id={answerId}
				class="mt-2 mb-1 flex flex-col gap-3 px-1 text-[15px] leading-[1.45] text-demo-ink-subtle"
				hidden={openItemId !== item.id}
			>
				{#each item.answer as paragraph}
					<p class="m-0">
						{#each paragraph.parts as part}
							{#if part.type === 'clause-reference'}
								<a
									href={clauseHref(part.clauseId)}
									class="font-medium text-demo-accent underline-offset-2 hover:underline focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-accent"
									onclick={(event) => navigateToClause(event, part.clauseId)}
								>
									{part.text}
								</a>
							{:else}
								{part.text}
							{/if}
						{/each}
					</p>
				{/each}
			</div>
		</div>
	{/each}
</div>
