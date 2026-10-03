import type { PreparedBlock } from './prepare';
import type { BlockLayoutProfile, LayoutProfiles } from './profile';
import { LayoutProfileCache } from './profile-cache';

export interface LayoutProfileBatch {
	readonly epoch: string;
	/** One whole-block profile per input, in input order. */
	readonly profiles: readonly BlockLayoutProfile[];
}

export interface LayoutProfileSurface {
	/** Undefined while fonts are loading or the surface is detached. Always read live. */
	readonly epoch: string | undefined;
	profile(
		blocks: readonly PreparedBlock[],
		expectedEpoch: string,
		checkCurrent?: () => void
	): LayoutProfileBatch | Promise<LayoutProfileBatch>;
}

export class StaleLayoutProfileError extends Error {
	constructor() {
		super('Layout environment changed during profiling.');
		this.name = 'StaleLayoutProfileError';
	}
}

function validateAssociation(block: PreparedBlock, profile: BlockLayoutProfile): void {
	const fragment = block.fragment;
	if (
		profile.kind !== fragment.type ||
		(profile.kind === 'paragraph' &&
			fragment.type === 'paragraph' &&
			profile.tokenCount !== fragment.tokens.length)
	)
		throw new Error('Layout profile does not match its prepared block.');
}

/** Serializes shared-surface requests; deduplicates geometry before any DOM work.
 * Returned associations always use the current request's prepared objects, never cached content.
 */
export class LayoutProfiler {
	#pending: Promise<unknown> = Promise.resolve();

	constructor(
		readonly surface: LayoutProfileSurface,
		readonly cache = new LayoutProfileCache()
	) {}

	get epoch(): string | undefined {
		return this.surface.epoch;
	}

	resolve(
		blocks: readonly PreparedBlock[],
		checkCurrent?: () => void,
		owner: object = this
	): Promise<LayoutProfiles> {
		const epoch = this.surface.epoch;
		if (epoch === undefined) return Promise.reject(new StaleLayoutProfileError());
		const input = [...blocks];
		const work = this.#pending.then(() => this.#resolve(input, epoch, checkCurrent, owner));
		// A failed request must not poison the queue for a newer epoch/request.
		this.#pending = work.catch(() => {});
		return work;
	}

	async #resolve(
		blocks: readonly PreparedBlock[],
		epoch: string,
		checkCurrent?: () => void,
		owner: object = this
	): Promise<LayoutProfiles> {
		const checkEpoch = () => {
			checkCurrent?.();
			if (this.surface.epoch !== epoch) throw new StaleLayoutProfileError();
		};
		checkEpoch();
		this.cache.useEpoch(epoch);
		const byFingerprint = new Map<string, BlockLayoutProfile>();
		const misses = new Map<string, PreparedBlock>();
		for (const block of blocks) {
			const key = block.geometryFingerprint;
			if (!byFingerprint.has(key) && !misses.has(key)) {
				const cached = this.cache.get(epoch, key);
				if (cached) byFingerprint.set(key, cached);
				else misses.set(key, block);
			}
		}
		if (misses.size) {
			const candidates = [...misses.values()];
			const batch = await this.surface.profile(candidates, epoch, checkEpoch);
			checkEpoch();
			if (batch.epoch !== epoch) throw new StaleLayoutProfileError();
			if (batch.profiles.length !== candidates.length)
				throw new Error('Layout profile batch has missing or extra blocks.');
			// Check all content associations before the cache validates/inserts the batch.
			const geometry = new Map(
				candidates.map((block, i) => {
					const profile = batch.profiles[i];
					validateAssociation(block, profile);
					return [block.geometryFingerprint, profile];
				})
			);
			for (const [key, profile] of this.cache.setBatch(epoch, geometry))
				byFingerprint.set(key, profile);
		}
		checkEpoch();
		const profiles: LayoutProfiles = new Map(
			blocks.map((block) => {
				const profile = byFingerprint.get(block.geometryFingerprint)!;
				validateAssociation(block, profile);
				return [block, profile];
			})
		);
		this.cache.retain(epoch, byFingerprint, owner);
		return profiles;
	}
}
