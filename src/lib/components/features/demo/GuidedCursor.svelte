<script lang="ts">
	import { tick } from 'svelte';
	import type { GuidedCursorMode } from './tour-model';

	let {
		container,
		destination,
		visible = true,
		mode = 'idle',
		phase,
		moveDuration,
		cameraScale,
		cursorHeight,
		clickRingSize
	}: {
		container?: HTMLElement;
		destination?: Element;
		visible?: boolean;
		mode?: GuidedCursorMode;
		phase: string;
		moveDuration: number;
		cameraScale: number;
		cursorHeight: number;
		clickRingSize: number;
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
		const targetRect = destination.getBoundingClientRect();
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
		// Opening guidance can move an unchanged target without resizing it.
		phase;
		cameraScale;
		const frame = requestAnimationFrame(() => void tick().then(measure));
		const observer = new ResizeObserver(measure);
		if (container) observer.observe(container);
		if (destination) observer.observe(destination);
		// Scrolling changes target coordinates without resizing either element.
		const stage = container;
		stage?.addEventListener('scroll', measure, true);
		window.addEventListener('resize', measure);
		document.fonts?.addEventListener('loadingdone', measure);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			stage?.removeEventListener('scroll', measure, true);
			window.removeEventListener('resize', measure);
			document.fonts?.removeEventListener('loadingdone', measure);
		};
	});
</script>

<div
	class={['guided-cursor absolute z-[8] motion-reduce:hidden', visible && measured && settled ? 'opacity-100' : 'opacity-0']}
	class:is-visible={visible && measured && settled}
	class:is-clicking={mode === 'clicking'}
	style:left={`${x}px`}
	style:top={`${y}px`}
	style:width={`${cursorHeight * 32 / 40}px`}
	style:height={`${cursorHeight}px`}
	style:--cursor-camera-scale={1 / cameraScale}
	style:--click-ring-size={`${clickRingSize}px`}
	style:--cursor-move-duration={`${moveDuration}ms`}
>
	<svg class="cursor-pointer-shape" viewBox="0 0 32 40" width="100%" height="100%" shape-rendering="geometricPrecision" aria-hidden="true">
		<path
			d="M4 3v28.3l7.3-6.7 5.1 12.1 4.8-2-5.1-12h10.7L4 3Z"
			fill="var(--color-ink)"
			stroke="white"
			stroke-width="2.4"
			stroke-linejoin="round"
		/>
	</svg>
	<span class="click-ring absolute top-0 left-0 rounded-full border-2 border-accent opacity-0"></span>
</div>

<style>
	@layer components {
		.guided-cursor {
			transform: scale(var(--cursor-camera-scale));
			transform-origin: top left;
			transition: opacity 120ms ease;
		}
		.cursor-pointer-shape {
			/* Keep the SVG tip at (4, 3) on the measured target at every size. */
			transform: translate(-12.5%, -7.5%);
		}
		.guided-cursor.is-visible {
			transition: left var(--cursor-move-duration) cubic-bezier(0.22, 1, 0.36, 1), top var(--cursor-move-duration) cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease;
		}
		.click-ring {
			width: var(--click-ring-size);
			height: var(--click-ring-size);
			box-shadow: 0 0 0 1px rgb(255 255 255 / 90%), inset 0 0 0 1px rgb(255 255 255 / 90%);
			translate: -50% -50%;
			transform: scale(0.45);
		}
		.guided-cursor.is-clicking .click-ring { animation: cursor-click 220ms ease-out both; }
		@keyframes cursor-click {
			0% { opacity: 0; transform: scale(0.45); }
			28% { opacity: 1; }
			100% { opacity: 0; transform: scale(1.25); }
		}
	}
</style>
