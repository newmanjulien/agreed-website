<script lang="ts">
	import ModalShell from './ModalShell.svelte';

	let { onClose }: { onClose: () => void } = $props();

	const stepClass =
		"relative grid grid-cols-[2rem_1fr] gap-x-3 not-last:after:absolute not-last:after:top-8 not-last:after:bottom-0 not-last:after:left-[calc(1rem-0.5px)] not-last:after:w-px not-last:after:bg-demo-line not-last:after:content-['']";
	const stepNumberClass =
		'z-1 flex size-8 items-center justify-center rounded-full border border-demo-line bg-demo-canvas text-[13.5px] leading-none text-demo-ink-muted';
</script>

<ModalShell title="How reviewing works" {onClose}>
	<div class="space-y-6 pt-1">
		<p class="text-[14.5px] leading-[1.45] text-demo-ink-muted">
			Each change is grouped by what you can do with it. You have 10 points to accept changes.
		</p>

		<ol class="m-0 list-none p-0" role="list">
			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">1</span>

				<div class="pb-7">
					<h3 class="text-[14.5px] leading-tight font-medium text-demo-ink">You have 10 points</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-demo-ink-muted">
						This is your budget. Each accepted change spends some of it.
					</p>
				</div>
			</li>

			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">2</span>

				<div class="pb-7">
					<h3 class="text-[14.5px] leading-tight font-medium text-demo-ink">
						Spend points to accept changes
					</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-demo-ink-muted">
						Spend them on requests that fit the contract rules. Accept buttons show how many it
						costs.
					</p>
				</div>
			</li>

			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">3</span>

				<div>
					<h3 class="text-[14.5px] leading-tight font-medium text-demo-ink">
						Some changes you can’t accept
					</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-demo-ink-muted">
						You need approval for some changes, and some can’t be accepted at all.
					</p>
				</div>
			</li>
		</ol>
	</div>
</ModalShell>
