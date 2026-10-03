import { validateBlockLayoutProfile, type BlockLayoutProfile } from './profile';

/** Current-document geometry plus a bounded LRU of other shapes, all for one epoch. */
export class LayoutProfileCache {
	#epoch: string | undefined;
	#active = new Map<string, BlockLayoutProfile>();
	#owners = new Map<object, ReadonlyMap<string, BlockLayoutProfile>>();
	#profiles = new Map<string, BlockLayoutProfile>();

	constructor(readonly capacity = 256) {
		if (!Number.isSafeInteger(capacity) || capacity < 1)
			throw new RangeError('Layout profile cache capacity must be a positive integer.');
	}

	useEpoch(epoch: string): void {
		if (this.#epoch === epoch) return;
		this.#epoch = epoch;
		this.#active.clear();
		this.#owners.clear();
		this.#profiles.clear();
	}

	/** Keep every current shape, even when the document exceeds the optional LRU capacity. */
	retain(epoch: string, profiles: ReadonlyMap<string, BlockLayoutProfile>, owner: object = this): void {
		if (epoch !== this.#epoch) throw new Error('Cannot retain stale layout profiles.');
		this.#owners.set(owner, new Map(profiles));
		this.#updateOwners();
	}
	release(owner: object): void {
		this.#owners.delete(owner);
		this.#updateOwners();
	}
	get stats() { return { active: this.#active.size, unreferenced: this.#profiles.size, owners: this.#owners.size }; }
	#updateOwners() {
		const previous = this.#active;
		this.#active = new Map([...this.#owners.values()].flatMap(profiles => [...profiles]));
		for (const key of this.#active.keys()) this.#profiles.delete(key);
		for (const [key, profile] of previous) if (!this.#active.has(key)) this.#store(key, profile);
	}

	get(epoch: string, fingerprint: string): BlockLayoutProfile | undefined {
		if (epoch !== this.#epoch) return;
		const active = this.#active.get(fingerprint);
		if (active) return active;
		const profile = this.#profiles.get(fingerprint);
		if (profile) {
			this.#profiles.delete(fingerprint);
			this.#profiles.set(fingerprint, profile);
		}
		return profile;
	}

	/** Normalize and validate the complete batch before inserting any entry. */
	setBatch(
		epoch: string,
		profiles: ReadonlyMap<string, BlockLayoutProfile>
	): ReadonlyMap<string, BlockLayoutProfile> {
		if (epoch !== this.#epoch) throw new Error('Cannot cache a stale layout profile.');
		const stored = new Map(
			[...profiles].map(
				([fingerprint, profile]) => [fingerprint, normalizeProfile(profile)] as const
			)
		);
		for (const [fingerprint, profile] of stored) this.#store(fingerprint, profile);
		return stored;
	}

	#store(fingerprint: string, profile: BlockLayoutProfile): void {
		this.#profiles.delete(fingerprint);
		this.#profiles.set(fingerprint, profile);
		if (this.#profiles.size > this.capacity)
			this.#profiles.delete(this.#profiles.keys().next().value!);
	}
}

function normalizeProfile(profile: BlockLayoutProfile): BlockLayoutProfile {
	validateBlockLayoutProfile(profile);
	// Copy only geometry fields and freeze nested arrays: neither caller mutation nor
	// extra properties on a surface result may carry content/provenance into the cache.
	return Object.freeze(
		profile.kind !== 'paragraph'
			? { kind: profile.kind, outerHeight: profile.outerHeight }
			: {
					kind: 'paragraph',
					tokenCount: profile.tokenCount,
					marginBlockStart: profile.marginBlockStart,
					marginBlockEnd: profile.marginBlockEnd,
					contentHeight: profile.contentHeight,
					lines: Object.freeze(
						profile.lines.map(({ startToken, endToken, top, bottom }) =>
							Object.freeze({ startToken, endToken, top, bottom })
						)
					)
				}
	);
}
