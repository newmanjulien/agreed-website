<script lang="ts">
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotchIcon';
	import type { UploadProcessingTask } from './upload-changes-tour';

	let {
		tasks,
		activeTask,
		completed
	}: {
		tasks: ReadonlyArray<UploadProcessingTask>;
		activeTask: number;
		completed: number;
	} = $props();
</script>

<div class="grid h-full place-items-center bg-demo-surface px-(--app-gutter)">
	<div
		class="activity-frame relative w-max max-w-full overflow-hidden [--task-height:40px] [--task-icon-size:26px] max-[590px]:[--task-icon-size:23px] max-[330px]:[--task-icon-size:21px]"
	>
		<ol
			class="activity-list relative top-[calc(var(--task-height)+4.5px)] m-0 w-max list-none p-0"
			style:--active-task={activeTask}
		>
			{#each tasks as task, i}
				{@const done = completed > i}
				{@const shown = activeTask >= i}
				{@const working = activeTask === i && !done}
				<li
					class={[
						'flex h-(--task-height) w-max items-center gap-3 text-base leading-[1.4] font-[350] tracking-[-0.19px] text-demo-ink-muted transition-opacity duration-300 max-[590px]:gap-2.5 max-[590px]:text-[13px] max-[590px]:tracking-[-0.11px] max-[330px]:gap-[9px] max-[330px]:text-sm motion-reduce:transition-none',
						shown ? 'opacity-100' : 'opacity-0'
					]}
				>
					<span
						class="relative block size-(--task-icon-size) shrink-0 rounded-full bg-demo-canvas text-demo-ink-muted"
					>
						<span
							class={[
								'task-spinner absolute inset-0 grid place-items-center transition-opacity duration-200 motion-reduce:transition-none',
								working && 'is-working',
								done && 'opacity-0'
							]}
						>
							<CircleNotchIcon size={13} weight="bold" />
						</span>
						<span
							class={[
								'absolute inset-0 grid place-items-center text-demo-ink-muted transition-opacity duration-200 motion-reduce:transition-none',
								done ? 'opacity-100' : 'opacity-0'
							]}
						>
							<CheckIcon size={13} weight="bold" />
						</span>
					</span>
					<span class="grid min-w-0">
						<span
							class={[
								'col-start-1 row-start-1 transition-opacity duration-[180ms] motion-reduce:transition-none',
								done && 'opacity-0'
							]}
						>
							{task.active}
						</span>
						<span
							class={[
								'col-start-1 row-start-1 transition-opacity duration-[180ms] motion-reduce:transition-none',
								done ? 'opacity-100' : 'opacity-0'
							]}
						>
							{task.done}
						</span>
					</span>
				</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	.activity-frame {
		height: calc(var(--task-height) * 2 + 9px);
		mask-image: linear-gradient(to bottom, transparent, #000 8px, #000 calc(100% - 3px), transparent);
	}

	.activity-list {
		transform: translateY(calc(var(--active-task) * var(--task-height) * -1));
		transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.task-spinner {
		animation: task-turn 900ms linear infinite;
		animation-play-state: paused;
	}

	.task-spinner.is-working {
		animation-play-state: running;
	}

	@keyframes task-turn {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.activity-list,
		.task-spinner {
			animation: none;
			transition: none;
		}
	}
</style>
