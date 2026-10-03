import { tick } from 'svelte';
import type { ConcessionSelection } from '../../playbook/model';
import { getBaseline } from './baseline';
import { prepareDocument } from './preparation';
import { paginatePreparedDocument } from '../pagination/paginate';
import { reconcilePages } from '../pagination/reconcile';
import { type LayoutProfiler, StaleLayoutProfileError } from '../pagination/profiler';
import type { PaginatedPage } from '../pagination/types';
import {
	sameSelection,
	type ContractRenderSource,
	type RenderSnapshot,
	type RenderFailure
} from './types';

const OBSOLETE = Symbol('obsolete render');
interface RenderInput {
	source: ContractRenderSource;
	concessions: ConcessionSelection;
	profiler: LayoutProfiler;
}
interface RenderRequest extends RenderInput {
	generation: number;
	owner: object;
}

/** Latest-request worker; publish complete snapshots and retain the last valid document. */
export class ContractRenderController {
	snapshot = $state.raw<RenderSnapshot | null>(null);
	pending = $state<number | null>(null);
	error = $state.raw<RenderFailure | null>(null);
	#generation = 0;
	#next?: RenderRequest;
	#running = false;
	#destroyed = false;
	#commitListeners = new Set<() => void>();
	#releaseProfiles?: () => void;

	destroy() {
		this.#destroyed = true;
		this.#releaseProfiles?.();
		this.cancelPending();
		this.#commitListeners.clear();
		this.snapshot = null;
	}
	beforeCommit(listener: () => void) {
		this.#commitListeners.add(listener);
		return () => { this.#commitListeners.delete(listener); };
	}
	isCurrent({ source, concessions, profiler }: RenderInput) {
		return profiler.epoch !== undefined &&
			this.snapshot?.layoutEpoch === profiler.epoch &&
			this.snapshot.source === source &&
			sameSelection(this.snapshot.concessions, concessions);
	}
	request(input: RenderInput) {
		if (this.#destroyed) return;
		const generation = ++this.#generation;
		this.#next = {
			...input,
			concessions: Object.freeze({ ...input.concessions }),
			generation,
			owner: {}
		};
		this.pending = generation;
		this.error = null;
		void this.#drain();
	}
	cancelPending() {
		++this.#generation;
		this.#next = undefined;
		this.pending = null;
		this.error = null;
	}
	fail(error: RenderFailure) {
		this.cancelPending();
		this.error = error;
	}
	async #drain() {
		if (this.#running) return;
		this.#running = true;
		try {
			while (this.#next) {
				const request = this.#next;
				this.#next = undefined;
				try {
					const result = await this.#render(request);
					this.#check(request, result.layoutEpoch);
					for (const listener of this.#commitListeners) listener();
					this.#check(request, result.layoutEpoch);
					this.#releaseProfiles?.();
					this.#releaseProfiles = () => request.profiler.cache.release(request.owner);
					this.snapshot = result;
					this.pending = null;
				} catch (cause) {
					request.profiler.cache.release(request.owner);
					if (cause === OBSOLETE || cause instanceof StaleLayoutProfileError ||
						request.generation !== this.#generation) {
						if (request.generation === this.#generation) this.cancelPending();
						continue;
					}
					this.pending = null;
					this.error = { message: 'We couldn’t update the contract.', cause };
					console.error('Contract rendering failed.', cause);
				}
			}
		} finally {
			this.#running = false;
			if (this.#next) void this.#drain();
		}
	}
	#check(request: RenderRequest, epoch: string) {
		if (this.#destroyed || request.generation !== this.#generation) throw OBSOLETE;
		if (request.profiler.epoch !== epoch) throw new StaleLayoutProfileError();
	}
	async #render(request: RenderRequest): Promise<RenderSnapshot> {
		// Leave the effect flush before the shared surface calls flushSync.
		await tick();
		const epoch = request.profiler.epoch;
		if (!epoch) throw new StaleLayoutProfileError();
		const check = () => this.#check(request, epoch);
		check();
		let candidates: readonly PaginatedPage[];
		if (!Object.keys(request.concessions).length) {
			candidates = (await getBaseline(request.source, request.profiler)).pages;
		} else {
			const prepared = prepareDocument(request.source, request.concessions);
			check();
			const profiles = await request.profiler.resolve(prepared, check, request.owner);
			check();
			candidates = paginatePreparedDocument(prepared, profiles);
		}
		check();
		if (!candidates.length) throw new Error('Pagination produced no pages.');
		const { pages, changedPages } = reconcilePages(candidates, epoch, this.snapshot ?? undefined);
		for (const page of pages) {
			if (Object.isFrozen(page)) continue;
			page.placements.forEach(Object.freeze);
			Object.freeze(page.placements);
			Object.freeze(page);
		}
		const publishedPages = pages.every((page, index) => page === candidates[index])
			? Object.freeze(candidates) : Object.freeze(pages);
		return Object.freeze({
			id: request.generation,
			source: request.source,
			concessions: request.concessions,
			layoutEpoch: epoch,
			changedPages: Object.freeze(changedPages),
			pages: publishedPages
		});
	}
}
