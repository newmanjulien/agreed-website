<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import ModalShell from './ModalShell.svelte';
	import type { DiscussionGuide, DiscussionItem } from './types';

	type Section = 'questions' | 'context';

	let {
		guide,
		onClose,
		interactive = true,
		expandedQuestionId,
		registerTarget,
		questionTargetName
	}: {
		guide: DiscussionGuide;
		onClose: () => void;
		interactive?: boolean;
		expandedQuestionId?: string;
		registerTarget?: (name: string, element: Element | null) => void;
		questionTargetName?: string;
	} = $props();

	let openItemBySection = $state<Record<Section, string | null>>({ questions: null, context: null });
	const panelIdPrefix = $props.id();

	function isOpen(section: Section, itemId: string) {
		return (section === 'questions' && expandedQuestionId === itemId) || openItemBySection[section] === itemId;
	}

	function toggleItem(section: Section, itemId: string) {
		openItemBySection[section] = openItemBySection[section] === itemId ? null : itemId;
	}

	const attachQuestion: Attachment = (node) => {
		if (!registerTarget || !questionTargetName) return;
		registerTarget(questionTargetName, node);
		return () => registerTarget(questionTargetName, null);
	};
</script>

{#snippet guideSection(section: Section, title: string, items: ReadonlyArray<DiscussionItem>)}
	{@const titleId = `${panelIdPrefix}-${section}-title`}
	<section aria-labelledby={titleId}>
		<h3 id={titleId} class="mb-3 text-[14.5px] font-medium text-ink">{title}</h3>
		<div class="flex flex-col gap-2">
			{#each items as item, index (item.id)}
				{@const answerId = `${panelIdPrefix}-${section}-${item.id}`}
				<div>
					<button
						class="w-full cursor-pointer rounded-xl border-0 bg-canvas px-3.5 py-3 text-left text-[14.5px] leading-[1.3] text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
						type="button"
						aria-expanded={isOpen(section, item.id)}
						aria-controls={answerId}
						data-demo-hit
						onclick={() => toggleItem(section, item.id)}
						{@attach section === 'questions' && index === 0 ? attachQuestion : undefined}
					>
						{item.prompt}
					</button>
					<div
						id={answerId}
						class="mt-2 mb-1 px-1 text-[14.5px] leading-[1.45] text-ink-muted"
						hidden={!isOpen(section, item.id)}
					>
						<p class="m-0">{item.answer}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/snippet}

<ModalShell title="How to discuss with buyers" placement="right" {onClose} {interactive}>
	<div class="flex flex-col gap-6 pt-1">
		<p class="m-0 text-[14.5px] leading-[1.45] text-ink-muted">{guide.explanation}</p>
		{@render guideSection('questions', 'Questions to ask buyers', guide.questions)}
		{@render guideSection('context', 'Context', guide.context)}
	</div>
</ModalShell>
