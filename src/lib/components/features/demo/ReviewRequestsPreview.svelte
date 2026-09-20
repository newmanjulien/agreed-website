<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
	import { mockRequests } from '$lib/components/hero/requests-demo/mock-requests';
	import type { ChangeRequest, ChangeRequestType } from '$lib/components/hero/requests-demo/types';

	let {
		acceptedRequestId,
		registerTarget,
		targetRequestId,
		targetName
	}: {
		acceptedRequestId?: string;
		registerTarget?: (name: string, element: Element | null) => void;
		targetRequestId?: string;
		targetName?: string;
	} = $props();

	type ActionVariant = 'accept' | 'add' | 'remove';

	const actionBase =
		'h-8 min-w-[99px] cursor-pointer rounded-full px-3 text-[14.5px] transition-colors';

	const actionStyles = {
		accept:
			'bg-ink/90 text-surface shadow-[0_1px_2px_rgba(0,0,0,0.10)] hover:bg-ink/88',
		add: 'border border-line/80 bg-surface/20 text-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-canvas',
		remove:
			'border border-danger/20 bg-danger/10 text-danger/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-danger/16'
	} satisfies Record<ActionVariant, string>;

	function rowAction(request: ChangeRequest): { variant: ActionVariant; label: string } {
		if (acceptedRequestId === request.id) {
			return { variant: 'remove', label: 'Remove' };
		}

		if (request.action === 'Accept') {
			return { variant: 'accept', label: `Accept (${request.points ?? 0})` };
		}

		return { variant: 'add', label: request.action };
	}

	const attachTarget: Attachment = (node) => {
		if (!targetName || !registerTarget) return;
		registerTarget(targetName, node);
		return () => registerTarget(targetName, null);
	};

	const typeDotClasses = {
		'Can accept': 'bg-success',
		'Needs approval': 'bg-accent',
		"Can't accept": 'bg-danger'
	} satisfies Record<ChangeRequestType, string>;
</script>

<div class="h-full min-h-0 overflow-hidden bg-surface px-(--app-gutter)">
	<div class="px-2">
		<h1 class="pt-7 pb-4 text-[23.5px] leading-[1.22] tracking-[-0.02em] text-ink">
			Review requests
		</h1>

		<p class="flex items-center gap-1.5 pb-7 text-[14.5px] leading-relaxed text-ink-muted">
			<span>You need approval for all changes once points are used up</span>

			<span
				class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-ink-muted"
				aria-hidden="true"
			>
				<InfoIcon size={18} weight="regular" />
			</span>
		</p>

		<table class="w-full border-collapse" aria-label="Change requests">
			<thead>
				<tr class="h-11">
					<th class="w-full max-w-0 pr-3 text-left text-[14px] font-medium text-ink" scope="col">
						Requested changes
					</th>

					<th
						class="w-[1%] px-5 text-left text-[14px] font-medium whitespace-nowrap text-ink"
						scope="col"
					>
						Type
					</th>

					<th class="sr-only" scope="col">Action</th>
				</tr>
			</thead>

			<tbody>
				{#each mockRequests as request (request.id)}
					{@const dotClass = typeDotClasses[request.type]}
					{@const action = rowAction(request)}
					{@const requestAccepted = acceptedRequestId === request.id}

					<tr class="h-[55px] border-t border-line/60">
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
									class="min-w-0 truncate text-[15px] leading-snug text-ink-muted"
									title={request.requestedChange}
								>
									{request.requestedChange}
								</div>
							</div>
						</td>

						<td class="w-[1%] px-5">
							<div class="flex items-center gap-2">
								<span class={['size-2 shrink-0 rounded-full', dotClass]} aria-hidden="true"></span>

								<span class="text-[14px] whitespace-nowrap text-ink-muted">
									{request.type}
								</span>
							</div>
						</td>

						<td class="w-[1%] text-right whitespace-nowrap">
							<button
								type="button"
								class={[actionBase, actionStyles[action.variant]]}
								tabindex="-1"
								aria-disabled="true"
								{@attach request.id === targetRequestId ? attachTarget : undefined}
							>
								{action.label}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
