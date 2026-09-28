<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
	import { mockRequests } from './mock-requests';
	import type { AcceptRequest, ChangeRequest, DiscussionGuide } from './types';

	let {
		acceptedRequestIds = [],
		onToggleAccept,
		onDiscuss,
		onInfo,
		registerTarget,
		targetRequestId,
		targetName,
		compact = false
	}: {
		acceptedRequestIds?: ReadonlyArray<string>;
		onToggleAccept?: (request: AcceptRequest) => void;
		onDiscuss?: (guide: DiscussionGuide) => void;
		onInfo?: () => void;
		registerTarget?: (name: string, element: Element | null) => void;
		targetRequestId?: string;
		targetName?: string;
		compact?: boolean;
	} = $props();

	function isAccepted(request: ChangeRequest) {
		return request.decision === 'canAccept' && acceptedRequestIds.includes(request.id);
	}

	type ActionVariant = 'accept' | 'secondary' | 'remove';

	const actionBase =
		'h-8 w-[155px] rounded-full px-3 text-[14.5px] transition-colors disabled:cursor-default disabled:opacity-40';

	const actionStyles = {
		accept:
			'bg-ink/90 text-surface shadow-[0_1px_2px_rgba(0,0,0,0.10)] hover:bg-ink/88',
		secondary: 'border border-line/80 bg-surface/20 text-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-canvas disabled:hover:bg-surface/20',
		remove:
			'border border-danger/20 bg-danger/10 text-danger/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-danger/16'
	} satisfies Record<ActionVariant, string>;

	function rowAction(request: ChangeRequest): { variant: ActionVariant; label: string; disabled?: boolean; onclick?: () => void } {
		if (request.decision === 'canAccept' && isAccepted(request)) {
			return { variant: 'remove', label: 'Remove', onclick: onToggleAccept ? () => onToggleAccept(request) : undefined };
		}

		if (request.decision === 'canAccept') {
			return {
				variant: 'accept',
				label: `Accept (${request.points} ${request.points === 1 ? 'point' : 'points'})`,
				onclick: onToggleAccept ? () => onToggleAccept(request) : undefined
			};
		}

		if (request.decision === 'cannotAccept') {
			return { variant: 'secondary', label: 'How to discuss', onclick: onDiscuss ? () => onDiscuss(request.discussionGuide) : undefined };
		}

		return { variant: 'secondary', label: 'Ask for approval', disabled: true };
	}

	const attachTarget: Attachment = (node) => {
		if (!targetName || !registerTarget) return;
		registerTarget(targetName, node);
		return () => registerTarget(targetName, null);
	};
</script>

{#snippet requestTable()}
	<table class="w-full border-collapse" aria-label="Change requests">
		<tbody>
			{#each mockRequests as request (request.id)}
				{@const action = rowAction(request)}
				{@const requestAccepted = isAccepted(request)}

				<tr class="h-[55px] border-t border-line/60 first:border-t-0">
					<td class="w-full max-w-0 pr-3">
						<div class="flex min-w-0 items-center gap-2">
							{#if requestAccepted}
								<span
									class="grid size-5 shrink-0 place-items-center text-success"
									aria-hidden="true"
								>
									<CheckIcon size={16} weight="bold" />
								</span>
							{/if}

							<div
								class={[
									'min-w-0 truncate text-[15px] leading-snug',
									request.decision === 'cannotAccept' ? 'text-danger' : 'text-ink-muted'
								]}
								title={request.requestedChange}
							>
								{request.requestedChange}
							</div>
						</div>
					</td>

					<td class="text-right whitespace-nowrap">
						<button
							type="button"
							class={[actionBase, actionStyles[action.variant]]}
								tabindex={action.onclick ? undefined : -1}
								disabled={action.disabled}
								data-demo-hit={action.onclick ? true : undefined}
								onclick={action.onclick}
							{@attach request.id === targetRequestId ? attachTarget : undefined}
						>
							{action.label}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

<div class="h-full min-h-0 overflow-hidden bg-surface">
	<div class={['min-w-0 px-(--app-gutter)', !compact && 'h-full overflow-auto']}>
		<div class="px-2">
			<h1
				class={[
					'text-[23.5px] leading-[1.22] tracking-[-0.02em] text-ink',
					compact ? 'pt-[35px] pb-4' : 'pt-12 pb-4'
				]}
			>
				Review requests
			</h1>

			<p
				class={[
					'flex items-center gap-1.5 text-[14.5px] leading-relaxed text-ink-muted',
					compact ? 'pb-7' : 'pb-9'
				]}
			>
				<span>Accept pre-approved changes and reach out to Ben if you need approval</span>

					{#if onInfo}
					<button
						type="button"
						class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
						aria-label="How reviewing works"
						data-demo-hit
							onclick={onInfo}
					>
						<InfoIcon aria-hidden="true" size={18} weight="regular" />
					</button>
				{:else}
					<span
						class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-ink-muted"
						aria-hidden="true"
					>
						<InfoIcon size={18} weight="regular" />
					</span>
				{/if}
			</p>

			{#if compact}
				{@render requestTable()}
			{:else}
				<div class="overflow-x-auto pb-8">
					{@render requestTable()}
				</div>
			{/if}
		</div>
	</div>
</div>
