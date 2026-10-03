<script lang="ts">
	import { observeCameraSize } from '$lib/components/contract-demo/document/camera-size';
	import DemoRepWorkspace from './DemoRepWorkspace.svelte';
	import { demoContract } from '$lib/components/contract-demo/data/fixture';
	import '$lib/components/contract-demo/styles/demo.css';

	// 1440px preserves the 816px contract plus the desktop playbook rail.
	const STAGE_WIDTH = 1440;
	const STAGE_HEIGHT = 860;
	let frameWidth = $state(0);
	let frameHeight = $state(0);
	const scale = $derived(frameWidth > 0 ? Math.min(1, frameWidth / STAGE_WIDTH) : 1);
	// Narrow hero frames retain their height; give the virtual app that extra scroll viewport.
	const stageHeight = $derived(frameHeight > 0 ? Math.max(STAGE_HEIGHT, frameHeight / scale) : STAGE_HEIGHT);
</script>

<div class="oceans-demo relative h-full w-full overflow-hidden font-sans text-left text-[16px] leading-[1.5] text-ink bg-canvas" use:observeCameraSize={(width, height) => { frameWidth = width; frameHeight = height; }}>
	<div class="absolute top-0 left-0 origin-top-left overflow-hidden" data-demo-stage style:width={`${STAGE_WIDTH}px`} style:height={`${stageHeight}px`} style:--demo-viewport-height={`${stageHeight}px`} style:transform={`scale(${scale})`}>
		<DemoRepWorkspace data={demoContract} />
	</div>
</div>
