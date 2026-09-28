<script lang="ts">
	import { onMount } from 'svelte';
	import ProcessingScreen from './ProcessingScreen.svelte';
	import {
		defaultIntake,
		playProcessingSequence,
		processingTasks,
		type ProcessingTask
	} from './processing';

	let {
		onFinished,
		intake = defaultIntake
	}: {
		onFinished?: () => void;
		intake?: ProcessingTask;
	} = $props();

	let tasks = $derived(processingTasks(intake));
	let activeTask = $state(0);
	let completed = $state(0);

	onMount(() => {
		const controller = new AbortController();

		const run = async () => {
			const result = await playProcessingSequence({
				signal: controller.signal,
				onActive: (index) => {
					activeTask = index;
				},
				onCompleted: (count) => {
					completed = count;
				}
			});

			if (result === 'finished') onFinished?.();
		};

		void run();
		return () => controller.abort();
	});
</script>

<ProcessingScreen {tasks} {activeTask} {completed} />
