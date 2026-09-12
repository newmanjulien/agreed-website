<script lang="ts">
	import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
	import TrashIcon from 'phosphor-svelte/lib/TrashIcon';

	import OverflowMenu from '$lib/demo/components/ui/OverflowMenu.svelte';
	import type {
		DiscussionComposerState,
		DiscussionRoot,
		DiscussionRootDeletionState,
		DiscussionTarget,
		DiscussionThreadAction
	} from '$lib/demo/document/discussions/types';
	import {
		discussionTargetKey,
		discussionTargetsEqual
	} from '$lib/demo/document/discussions/types';
	import MessageByline from './MessageByline.svelte';
	import MessageComposer from './MessageComposer.svelte';
	import ReplyComposer from './ReplyComposer.svelte';

	let { root, target, composer, rootDeletion, onAction }: {
		root: DiscussionRoot;
		target: DiscussionTarget;
		composer: DiscussionComposerState | null;
		rootDeletion: DiscussionRootDeletionState | null;
		onAction: (action: DiscussionThreadAction) => void;
	} = $props();

	let replyFieldId = $derived(
		`discussion-reply-${encodeURIComponent(discussionTargetKey(target))}`
	);
	let submissionPending = $derived(composer?.submission.status === 'pending');
	let submissionError = $derived(
		composer?.submission.status === 'error' ? composer.submission.message : ''
	);
	let deletionTargetsThread = $derived(
		Boolean(rootDeletion && discussionTargetsEqual(rootDeletion.target, target))
	);
	let deletionPending = $derived(rootDeletion?.status === 'pending');
	let threadBusy = $derived(deletionPending && deletionTargetsThread);
	let deletionError = $derived(
		rootDeletion?.status === 'error' && deletionTargetsThread
			? rootDeletion.message
			: ''
	);

	function activate() {
		onAction({ type: 'activate' });
	}
</script>

{#snippet actionMenu(
	onEdit: () => void,
	onDelete: () => void,
	noun: string,
	editDisabled = false,
	deleteDisabled = false,
	deleting = false
)}
	<OverflowMenu
		label={`Open ${noun} actions`}
		menuLabel={`${noun} actions`}
		rootClass="discussion-action-menu absolute top-2 right-2 z-10"
		menuClass="top-[calc(100%+5px)] right-0 w-32"
		iconSize={20}
	>
		{#snippet children(closeMenu)}
			<button
				type="button"
				class="flex min-h-9 w-full cursor-pointer items-center justify-between gap-4 rounded-demo-sm border-0 bg-transparent px-2.5 py-2 text-left text-sm leading-[1.25] text-demo-ink shadow-none hover:bg-demo-hover focus-visible:bg-demo-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-demo-accent disabled:cursor-wait disabled:text-demo-disabled disabled:hover:bg-transparent"
				role="menuitem"
				disabled={editDisabled}
				onclick={() => {
					closeMenu();
					onEdit();
				}}
			>
				<span>Edit</span>
				<PencilSimpleIcon aria-hidden="true" class="shrink-0 text-demo-ink-muted" size={16} />
			</button>
			<button
				type="button"
				class="flex min-h-9 w-full cursor-pointer items-center justify-between gap-4 rounded-demo-sm border-0 bg-transparent px-2.5 py-2 text-left text-sm leading-[1.25] text-demo-ink shadow-none hover:bg-demo-hover focus-visible:bg-demo-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-demo-accent disabled:cursor-wait disabled:text-demo-disabled disabled:hover:bg-transparent"
				role="menuitem"
				disabled={deleteDisabled}
				onclick={() => {
					closeMenu();
					onDelete();
				}}
			>
				<span>{deleting ? 'Deleting…' : 'Delete'}</span>
				<TrashIcon aria-hidden="true" class="shrink-0 text-demo-ink-muted" size={16} />
			</button>
		{/snippet}
	</OverflowMenu>
{/snippet}

<div
	class="discussion-thread w-full overflow-visible rounded-demo-widget border border-demo-line bg-demo-surface text-demo-ink shadow-none"
	class:is-active={composer !== null}
	aria-busy={threadBusy}
	data-context-panel
>
	<div class="discussion-segment relative">
		{#if composer?.mode === 'edit-root'}
			<div class="discussion-segment-surface p-3.5">
				<MessageComposer
					text={composer.text}
					title="Edit message"
					placeholder="Write a message…"
					submitLabel="Save"
					cancelLabel="Cancel"
					pending={submissionPending || threadBusy}
					errorMessage={submissionError}
					onTextChange={(text) => onAction({ type: 'text-change', text })}
					onCancel={() => onAction({ type: 'cancel' })}
					onSubmit={() => onAction({ type: 'submit' })}
				/>
			</div>
		{:else}
			<button
				class="discussion-segment-surface w-full cursor-pointer appearance-none border-0 bg-transparent p-3.5 pr-11 text-left text-demo-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-accent disabled:cursor-wait"
				type="button"
				aria-controls={replyFieldId}
				aria-expanded={composer?.mode === 'reply'}
				disabled={threadBusy}
				onclick={activate}
			>
				<span class="sr-only">Show reply field. </span>
				<MessageByline />
				<p class="discussion-message-text mt-2.5 mb-0 whitespace-pre-wrap text-[15px] leading-[1.5] text-demo-ink-secondary">
					{root.text}
				</p>
			</button>
			{@render actionMenu(
				() => onAction({ type: 'edit-root' }),
				() => onAction({ type: 'delete-root' }),
				'Message',
				threadBusy,
				deletionPending,
				threadBusy
			)}
		{/if}
		{#if deletionError}
			<p
				class="discussion-segment-surface m-0 px-3.5 pb-3.5 text-xs leading-[1.35] text-demo-danger"
				role="alert"
			>
				{deletionError}
			</p>
		{/if}
	</div>

	{#each root.replies as reply (reply.id)}
		<div class="discussion-segment relative">
			{#if composer?.mode === 'edit-reply' && composer.replyId === reply.id}
				<div class="discussion-segment-surface p-3.5 pl-5">
					<MessageComposer
						text={composer.text}
						title="Edit reply"
						placeholder="Write a reply…"
						submitLabel="Save"
						cancelLabel="Cancel"
						pending={submissionPending || threadBusy}
						errorMessage={submissionError}
						onTextChange={(text) => onAction({ type: 'text-change', text })}
						onCancel={() => onAction({ type: 'cancel' })}
						onSubmit={() => onAction({ type: 'submit' })}
					/>
				</div>
			{:else}
				<button
					class="discussion-segment-surface w-full cursor-pointer appearance-none border-0 bg-transparent p-3.5 pr-11 pl-5 text-left text-demo-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-demo-accent disabled:cursor-wait"
					type="button"
					aria-controls={replyFieldId}
					aria-expanded={composer?.mode === 'reply'}
					disabled={threadBusy}
					onclick={activate}
				>
					<span class="sr-only">Show reply field. </span>
					<MessageByline />
					<p class="discussion-message-text mt-2.5 mb-0 whitespace-pre-wrap text-[15px] leading-[1.5] text-demo-ink-secondary">
						{reply.text}
					</p>
				</button>
				{@render actionMenu(
					() => onAction({ type: 'edit-reply', reply }),
					() => onAction({ type: 'delete-reply', replyId: reply.id }),
					'Reply',
					threadBusy,
					threadBusy
				)}
			{/if}
		</div>
	{/each}

	{#if composer?.mode === 'reply'}
		<div class="discussion-segment">
			<div class="discussion-segment-surface p-3.5">
				{#key composer.id}
					<ReplyComposer
						id={replyFieldId}
						text={composer.text}
						pending={submissionPending || threadBusy}
						errorMessage={submissionError}
						onTextChange={(text) => onAction({ type: 'text-change', text })}
						onCancel={() => onAction({ type: 'cancel' })}
						onSubmit={() => onAction({ type: 'submit' })}
					/>
				{/key}
			</div>
		</div>
	{/if}
</div>

<style>
	.discussion-segment {
		border-radius: 0;
	}

	.discussion-segment:first-child {
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
	}

	.discussion-segment:last-child {
		border-bottom-right-radius: inherit;
		border-bottom-left-radius: inherit;
	}

	.discussion-segment-surface {
		border-radius: inherit;
	}

	.discussion-message-text {
		overflow-wrap: anywhere;
	}

	:global(.discussion-action-menu) {
		opacity: 0;
		pointer-events: none;
		transition: opacity 120ms ease;
	}

	.discussion-thread:hover :global(.discussion-action-menu),
	.discussion-thread:focus-within :global(.discussion-action-menu),
	.discussion-thread.is-active :global(.discussion-action-menu) {
		opacity: 1;
		pointer-events: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.discussion-action-menu) {
			transition: none;
		}
	}
</style>
