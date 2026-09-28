<script lang="ts">
	import ModalShell from './ModalShell.svelte';

	let { onClose }: { onClose: () => void } = $props();

	const stepClass =
		"relative grid grid-cols-[2rem_1fr] gap-x-3 not-last:after:absolute not-last:after:top-8 not-last:after:bottom-0 not-last:after:left-[calc(1rem-0.5px)] not-last:after:w-px not-last:after:bg-line not-last:after:content-['']";
	const stepNumberClass =
		'z-1 flex size-8 items-center justify-center rounded-full border border-line bg-canvas text-[13.5px] leading-none text-ink-muted';
</script>

<ModalShell title="How reviewing works" {onClose}>
	<div class="space-y-6 pt-1">
		<p class="text-[14.5px] leading-[1.45] text-ink-muted">
			You have 10 points to spend on changes. Some changes require approval, changes in red can’t be accepted
		</p>

		<ol class="m-0 list-none p-0" role="list">
			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">1</span>

				<div class="pb-7">
					<h3 class="text-[14.5px] leading-tight font-medium text-ink">Start with 10 points</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-ink-muted">
						This is your review budget. Each change you accept uses some of your points.
					</p>
				</div>
			</li>

			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">2</span>

				<div class="pb-7">
					<h3 class="text-[14.5px] leading-tight font-medium text-ink">
						Some changes you can’t accept
					</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-ink-muted">
						Some changes need approval and
						<span class="text-danger">changes in red can’t be accepted at all.</span>
					</p>
				</div>
			</li>

			<li class={stepClass}>
				<span class={stepNumberClass} aria-hidden="true">3</span>

				<div>
					<h3 class="text-[14.5px] leading-tight font-medium text-ink">
						Talk through changes you can’t accept
					</h3>

					<p class="mt-1.5 text-[14.5px] leading-[1.45] text-ink-muted">
						Use How to discuss for questions and context that help you respond to the buyer.
					</p>
				</div>
			</li>
		</ol>
	</div>
</ModalShell>
