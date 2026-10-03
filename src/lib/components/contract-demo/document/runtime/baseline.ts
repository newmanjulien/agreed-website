import { prepareDocument } from './preparation';
import { paginatePreparedDocument } from '../pagination/paginate';
import { StaleLayoutProfileError, type LayoutProfiler } from '../pagination/profiler';
import type { ContractRenderSource, RenderSnapshot } from './types';

const baselines = new WeakMap<ContractRenderSource, {
	epoch: string;
	result: Promise<RenderSnapshot>;
	release: () => void;
}>();

/** Unchanged contracts share pagination across all scenes. */
export function getBaseline(source: ContractRenderSource, profiler: LayoutProfiler): Promise<RenderSnapshot> {
	const epoch = profiler.epoch;
	if (!epoch) return Promise.reject(new StaleLayoutProfileError());
	const existing = baselines.get(source);
	if (existing?.epoch === epoch) return existing.result;
	existing?.release();
	const owner = {};
	const check = () => {
		if (profiler.epoch !== epoch) throw new StaleLayoutProfileError();
	};
	const result = (async () => {
		const prepared = prepareDocument(source, {});
		const profiles = await profiler.resolve(prepared, check, owner);
		check();
		const pages = paginatePreparedDocument(prepared, profiles);
		if (!pages.length) throw new Error('Pagination produced no pages.');
		for (const page of pages) {
			page.placements.forEach(Object.freeze);
			Object.freeze(page.placements);
			Object.freeze(page);
		}
		return Object.freeze({
			id: 0,
			layoutEpoch: epoch,
			source,
			concessions: Object.freeze({}),
			pages: Object.freeze(pages),
			changedPages: Object.freeze(pages.map(page => page.number))
		});
	})();
	baselines.set(source, { epoch, result, release: () => profiler.cache.release(owner) });
	void result.catch(() => {
		profiler.cache.release(owner);
		if (baselines.get(source)?.result === result) baselines.delete(source);
	});
	return result;
}
