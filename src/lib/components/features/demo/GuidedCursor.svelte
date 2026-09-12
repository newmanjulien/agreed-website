<script lang="ts">
	import { tick } from 'svelte';
	import type {
		GuidedCursorDestination,
		GuidedCursorMode
	} from './tour-model';

	let {
		container,
		destination,
		visible = true,
		mode = 'idle'
	}: {
		container?: HTMLElement;
		destination?: GuidedCursorDestination;
		visible?: boolean;
		mode?: GuidedCursorMode;
	} = $props();

	let x = $state(0);
	let y = $state(0);
	let measured = $state(false);

	function measure() {
		if (!container || !destination) {
			measured = false;
			return;
		}
		if (destination.kind === 'point') {
			x = destination.point.x;
			y = destination.point.y;
		} else {
			const containerRect = container.getBoundingClientRect();
			const scaleX = containerRect.width / container.offsetWidth || 1;
			const scaleY = containerRect.height / container.offsetHeight || 1;
			const targetRect = destination.element.getBoundingClientRect();
			x = (targetRect.left + targetRect.width / 2 - containerRect.left) / scaleX;
			y = (targetRect.top + targetRect.height / 2 - containerRect.top) / scaleY;
		}
		measured = true;
	}

	$effect(() => {
		container;
		destination;
		if (destination?.kind === 'point') {
			destination.point.x;
			destination.point.y;
			measure();
			return;
		}
		let frame = requestAnimationFrame(() => void tick().then(measure));
		const observer = new ResizeObserver(measure);
		if (container) observer.observe(container);
		if (destination?.kind === 'element') observer.observe(destination.element);
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
	class:is-visible={visible && measured}
	class:is-clicking={mode === 'clicking'}
	class:is-pressed={mode === 'pressed'}
	class:is-dragging={mode === 'dragging'}
	style:left={`${x}px`}
	style:top={`${y}px`}
>
	<svg viewBox="0 0 32 40" width="32" height="40" shape-rendering="geometricPrecision" aria-hidden="true">
		<path
			d="M4 3v28.3l7.3-6.7 5.1 12.1 4.8-2-5.1-12h10.7L4 3Z"
			fill="#202124"
			stroke="white"
			stroke-width="2.4"
			stroke-linejoin="round"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
	<span class="click-ring"></span>
</div>

<style>
	.guided-cursor {
		position: absolute; z-index: 8; width: 32px; height: 40px; opacity: 0;
		transform: translate3d(-4px, -3px, 0);
		transition: left 560ms cubic-bezier(0.22, 1, 0.36, 1), top 560ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease;
	}
	.guided-cursor.is-visible { opacity: 1; }
	.guided-cursor.is-dragging {
		transition: opacity 120ms ease;
	}
	.guided-cursor svg { transform-origin: 5px 5px; transition: transform 120ms ease; }
	.guided-cursor:is(.is-pressed, .is-dragging) svg { transform: scale(0.9); }
	.click-ring {
		position: absolute; top: -9px; left: -9px; width: 26px; height: 26px;
		border: 2px solid rgba(37, 99, 235, 0.42); border-radius: 999px;
		opacity: 0; transform: scale(0.45);
	}
	.guided-cursor:is(.is-pressed, .is-dragging) .click-ring { opacity: 0.55; transform: scale(0.62); }
	.guided-cursor.is-clicking .click-ring { animation: cursor-click 220ms ease-out both; }
	@keyframes cursor-click {
		0% { opacity: 0; transform: scale(0.45); }
		28% { opacity: 1; }
		100% { opacity: 0; transform: scale(1.25); }
	}
	@media (prefers-reduced-motion: reduce) { .guided-cursor { display: none; } }
</style>
