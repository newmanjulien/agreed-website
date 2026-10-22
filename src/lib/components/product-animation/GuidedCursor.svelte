<script lang="ts">
	import type { CursorFrame } from './scene-geometry';
	let { cursor }: { cursor: CursorFrame } = $props();
</script>

<div class="guided-cursor" style:opacity={cursor.opacity} style:transform={`translate(${cursor.x}px, ${cursor.y}px) scale(${1 / cursor.scale})`}>
	<svg viewBox="0 0 32 40" width="20" height="25" aria-hidden="true"><path d="M4 3v28.3l7.3-6.7 5.1 12.1 4.8-2-5.1-12h10.7L4 3Z" fill="var(--color-ink)" stroke="white" stroke-width="2.4" stroke-linejoin="round" /></svg>
	<span class="click-ring" style:opacity={cursor.ringOpacity} style:transform={`scale(${cursor.ringScale})`}></span>
</div>

<style>
	.guided-cursor { position: absolute; left: 0; top: 0; z-index: 8; width: 20px; height: 25px; opacity: 0; transform-origin: top left; pointer-events: none; }
	svg { transform: translate(-12.5%, -7.5%); }
	.click-ring { position: absolute; top: 0; left: 0; width: 26px; height: 26px; border: 2px solid var(--color-accent); border-radius: 50%; translate: -50% -50%; opacity: 0; box-shadow: 0 0 0 1px rgb(255 255 255 / 90%), inset 0 0 0 1px rgb(255 255 255 / 90%); }
</style>
