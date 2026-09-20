<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type {
		GuidedCursorDestination,
		GuidedCursorMode
	} from './tour-model';

	let {
		container,
		destination,
		visible = true,
		mode = 'idle',
		children
	}: {
		container?: HTMLElement;
		destination?: GuidedCursorDestination;
		visible?: boolean;
		mode?: GuidedCursorMode;
		children?: Snippet;
	} = $props();

	let x = $state(0);
	let y = $state(0);
	let measured = $state(false);
	let settled = $state(false);

	function measure() {
		if (!container || !destination) {
			measured = false;
			return;
		}
		const containerRect = container.getBoundingClientRect();
		const scaleX = containerRect.width / container.offsetWidth || 1;
		const scaleY = containerRect.height / container.offsetHeight || 1;
		const targetRect = destination.element.getBoundingClientRect();
		x = (targetRect.left + targetRect.width / 2 - containerRect.left) / scaleX;
		y = (targetRect.top + targetRect.height / 2 - containerRect.top) / scaleY;
		measured = true;
	}

	$effect(() => {
		if (!visible || !measured) {
			settled = false;
			return;
		}

		const frame = requestAnimationFrame(() => {
			settled = true;
		});
		return () => cancelAnimationFrame(frame);
	});

	$effect(() => {
		container;
		destination;
		let frame = requestAnimationFrame(() => void tick().then(measure));
		const observer = new ResizeObserver(measure);
		if (container) observer.observe(container);
		if (destination) observer.observe(destination.element);
		window.addEventListener('resize', measure);
		document.fonts?.addEventListener('loadingdone', measure);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('resize', measure);
			document.fonts?.removeEventListener('loadingdone', measure);
		};
	});
</script>

<div
	class="guided-cursor"
	class:is-visible={visible && measured && settled}
	class:is-clicking={mode === 'clicking'}
	class:is-pressed={mode === 'pressed'}
	style:left={`${x}px`}
	style:top={`${y}px`}
>
	<svg viewBox="0 0 32 40" width="32" height="40" shape-rendering="geometricPrecision" aria-hidden="true">
		<path
			d="M4 3v28.3l7.3-6.7 5.1 12.1 4.8-2-5.1-12h10.7L4 3Z"
			fill="var(--color-ink)"
			stroke="white"
			stroke-width="2.4"
			stroke-linejoin="round"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
	<span class="click-ring"></span>
	{#if children}{@render children()}{/if}
</div>

<style>
	.guided-cursor {
		position: absolute; z-index: 8; width: 32px; height: 40px; opacity: 0;
		transform: translate3d(-4px, -3px, 0);
		transition: opacity 120ms ease;
	}
	.guided-cursor.is-visible {
		opacity: 1;
		transition: left 560ms cubic-bezier(0.22, 1, 0.36, 1), top 560ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease;
	}
	.guided-cursor svg { transform-origin: 5px 5px; transition: transform 120ms ease; }
	.guided-cursor.is-pressed svg { transform: scale(0.9); }
	.click-ring {
		position: absolute; top: -9px; left: -9px; width: 26px; height: 26px;
		border: 2px solid color-mix(in srgb, var(--color-accent) 42%, transparent); border-radius: 999px;
		opacity: 0; transform: scale(0.45);
	}
	.guided-cursor.is-pressed .click-ring { opacity: 0.55; transform: scale(0.62); }
	.guided-cursor.is-clicking .click-ring { animation: cursor-click 220ms ease-out both; }
	@keyframes cursor-click {
		0% { opacity: 0; transform: scale(0.45); }
		28% { opacity: 1; }
		100% { opacity: 0; transform: scale(1.25); }
	}
	@media (prefers-reduced-motion: reduce) { .guided-cursor { display: none; } }
</style>
