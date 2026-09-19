<script lang="ts">
	import { approvalRequest } from './approval-tour';

	let { text = '' }: { text?: string } = $props();

	const canSubmit = $derived(text.trim() !== '');
</script>

<div class="flex h-full min-h-0 flex-col overflow-hidden bg-demo-surface">
	<div class="min-h-0 flex-1 overflow-hidden px-(--app-gutter)">
		<div class="mx-auto w-full max-w-[420px]">
			<h1 class="pt-6 pb-3 text-[18px] leading-[1.25] tracking-[-0.02em] text-demo-ink">
				Ask for approval
			</h1>

			<div class="flex items-start gap-2">
				<span
					class="grid size-7 shrink-0 place-items-center rounded-full bg-demo-selection-highlight text-[11px] font-medium text-demo-accent"
					aria-hidden="true"
				>
					JN
				</span>

				<p class="m-0 text-[13.5px] leading-snug text-demo-ink-muted">
					{approvalRequest.requestedChange}
				</p>
			</div>

			<label class="sr-only" for="approval-justification">
				Explain {approvalRequest.requestedChange}
			</label>

			<textarea
				id="approval-justification"
				class="mt-2 min-h-[128px] w-full resize-none rounded-xl border border-demo-line/60 bg-demo-surface px-2.5 py-2 text-[13px] leading-snug text-demo-ink outline-none placeholder:text-demo-ink-muted"
				placeholder="Explain this request"
				readonly
				tabindex="-1"
				value={text}
			></textarea>
		</div>
	</div>

	<div class="px-(--app-gutter) py-3">
		<div class="mx-auto w-full max-w-[420px]">
			<button
				type="button"
				class="h-8 w-full rounded-full border border-demo-line/80 bg-demo-surface px-3 text-[14.5px] text-demo-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] disabled:cursor-default disabled:opacity-40"
				tabindex="-1"
				disabled={!canSubmit}
				aria-disabled={!canSubmit}
			>
				Next
			</button>
		</div>
	</div>
</div>
