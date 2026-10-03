<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import { LAYOUT_EPOCH, PAGE_FORMAT } from '$lib/components/contract-demo/document/pagination/page-format';
	import type { PageFragment } from '$lib/components/contract-demo/document/pagination/types';
	import type { BlockLayoutProfile } from '$lib/components/contract-demo/document/pagination/profile';
	import {
		StaleLayoutProfileError,
		type LayoutProfileSurface
	} from '$lib/components/contract-demo/document/pagination/profiler';
	import {
		readParagraphProfile,
		readWholeBlockProfile
	} from '$lib/components/contract-demo/document/pagination/profile-dom';
	import BlockFragment from './BlockFragment.svelte';
	import '../../styles/demo.css';
	import { LayoutProfiler } from '../../document/pagination/profiler';
	import { contractMeasurement, contractProfileCache } from '../../document/runtime/measurement.svelte';
	import { yieldToBrowser, PROCESSING_BUDGET_MS } from '../../document/pagination/scheduling';

	let element: HTMLDivElement;
	let fragments = $state.raw<readonly PageFragment[]>([]);

	onMount(() => {
		let mounted = true;
		let initialization = 0;
		// The contract uses installed Arial/Helvetica, independently of marketing webfonts.
		let epoch: string | undefined;
		const handle: LayoutProfileSurface = {
			get epoch() { return mounted ? epoch : undefined; },
			async profile(blocks, expectedEpoch, checkCurrent) {
				const check = () => {
					checkCurrent?.();
					if (!mounted || epoch !== expectedEpoch) throw new StaleLayoutProfileError();
				};
				const write = (next: readonly PageFragment[]) => {
					flushSync(() => { fragments = next; });
				};
				const profiles: BlockLayoutProfile[] = [];
				let sliceStart = performance.now();
				try {
					for (const block of blocks) {
						check();
						const fragment = block.fragment;
						write([fragment]);
						const child = element.firstElementChild as HTMLElement;
						if (!child) throw new Error('Missing profile block.');
						profiles.push(
							fragment.type === 'paragraph'
								? await readParagraphProfile(child, fragment, check)
								: readWholeBlockProfile(child, fragment)
						);
						if (performance.now() - sliceStart >= PROCESSING_BUDGET_MS) {
							await yieldToBrowser();
							check();
							sliceStart = performance.now();
						}
					}
					check();
					return { epoch: expectedEpoch, profiles };
				} finally { write([]); }
			}
		};
		const initialize = async () => {
			const attempt = ++initialization;
			epoch = undefined;
			contractMeasurement.profiler = undefined;
			contractMeasurement.error = undefined;
			try {
				const typography = getComputedStyle(element);
				// Wait for precisely the contract font, independently of marketing webfonts.
				await document.fonts.load(`${typography.fontSize} ${typography.fontFamily}`);
				if (!mounted || attempt !== initialization) return;
				epoch = `${LAYOUT_EPOCH}:${PAGE_FORMAT.contentWidth}:${typography.fontFamily}:${typography.fontSize}:${typography.lineHeight}`;
				contractMeasurement.profiler = new LayoutProfiler(handle, contractProfileCache);
			} catch (cause) {
				if (mounted && attempt === initialization) contractMeasurement.error = { message: 'We couldn’t prepare the contract typography.', cause };
			}
		};
		contractMeasurement.retry = () => { void initialize(); };
		void initialize();
		return () => {
			mounted = false;
			if (contractMeasurement.profiler?.surface === handle) contractMeasurement.profiler = undefined;
			contractMeasurement.error = undefined;
			contractMeasurement.retry = undefined;
		};
	});
</script>

<!-- The application owns this native-size surface outside every transformed camera. -->
<div class="oceans-demo pointer-events-none invisible fixed top-0 left-0 h-0 w-0 overflow-hidden font-sans text-left text-[16px] leading-[1.5] text-ink bg-canvas" aria-hidden="true" inert>
	<div
		class="layout-profile-surface pointer-events-none invisible absolute top-0 left-0 flex h-auto w-(--contract-content-width) flex-col font-sans text-[#171717] select-none"
		bind:this={element}
		style:--contract-content-width={`${PAGE_FORMAT.contentWidth}px`}
	>
		{#each fragments as fragment}
			<BlockFragment {fragment} profileMode />
		{/each}
	</div>
</div>
