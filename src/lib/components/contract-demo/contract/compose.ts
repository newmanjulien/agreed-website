import type { ContractBlock, ResolvedBlock, ResolvedRun } from './model';
import type {
	ConcessionSelection,
	Trigger,
	ContractChange,
	InlineTemplateAtom as ReplacementAtom,
	SourceRange
} from '../playbook/model';
import {
	triggerAnnotationId,
	type AnnotationMembership,
	type DocumentOverlayItem
} from '../playbook/document-overlay';
import { activatedBlock, changeTriggerOwner } from '../playbook/geometry';
import {
	buildSourceIndex,
	pointPosition,
	sourceAddresses,
	type SourceUnit
} from './source-index';
import { localBlock, rangeText, unitsInRange } from './ranges';
import { diffRedlineText } from './redline-diff';
import { referenceText, type Address } from './numbering';
import { changesConflict } from '../playbook/conflicts';

type OwnedTrigger = Trigger & { itemId: string };
type PositionedAnnotation = AnnotationMembership & { start: number; end: number };
type ConcessionChange = {
	change: ContractChange;
	effect?: AnnotationMembership;
};
type Patch = ConcessionChange & { start: number; end: number };
type Annotation = Pick<ResolvedRun, 'annotations' | 'visualSource' | 'generatedOffset'>;

function needsRedlineSeparator(deleted: string, inserted: string): boolean {
	const content = /[\p{L}\p{N}\p{M}\p{S}]/u;
	return (
		!/\s$/u.test(deleted) &&
		!/^\s/u.test(inserted) &&
		content.test(deleted) &&
		content.test(inserted)
	);
}

function emptyHitTarget(annotations: AnnotationMembership[]): ResolvedRun[] {
	return [
		{
			text: '\u00a0',
			generated: 'empty-hit-target',
			annotations,
			visualSource: annotations[0]?.range,
			generatedOffset: 0
		}
	];
}

export interface CompositionInput {
	items: readonly DocumentOverlayItem[];
	activeConcessions: ConcessionSelection;
}

/** Source-owned composition cache; published blocks remain immutable across edits. */
export class ContractCompositionEngine {
	readonly index;
	#blocks: readonly ContractBlock[];
	#atomsByKey;
	#items?: readonly DocumentOverlayItem[];
	#triggers: OwnedTrigger[] = [];
	#overlay = new WeakMap<
		DocumentOverlayItem,
		{ annotations: PositionedAnnotation[]; annotationsByBlock: Map<string, PositionedAnnotation[]> }
	>();
	#annotationVersions = new Map<string, string>();
	#dependencies = new Map<string, Set<string>>();
	#blockContent = new Map<string, { version: string; content: ResolvedRun[] }>();
	#trimmed = new WeakMap<ResolvedRun[], ResolvedRun[]>();
	#slots = new Map<string, { version: string; content: ResolvedRun[] }>();
	#resolved = new Map<string, ResolvedBlock>();
	#activeKey = '';
	#patchVersions = new Map<string, string>();
	#activationVersions = new Map<string, string>();
	#dirtyBlocks = new Set<string>();
	#current: Map<string, Address>;
	constructor(blocks: readonly ContractBlock[], index = buildSourceIndex(blocks)) {
		this.#blocks = blocks;
		this.index = index;
		this.#current = sourceAddresses(blocks);
		for (const key of index.unitsByBlock.keys()) this.#dirtyBlocks.add(key);
		this.#atomsByKey = new Map(
			blocks
				.flatMap((block) => (block.kind === 'table' ? [] : block.content))
				.map((atom) => [atom.sourceKey, atom])
		);
		for (const [blockKey, units] of index.unitsByBlock) {
			const dependencies = new Set<string>();
			for (const unit of units) {
				if (unit.kind === 'number') dependencies.add(unit.sourceKey.slice('number:'.length));
				const atom = this.#atomsByKey.get(unit.sourceKey);
				if (atom?.kind === 'reference') {
					dependencies.add(atom.targetItemKey);
					if (atom.endTargetItemKey) dependencies.add(atom.endTargetItemKey);
				}
			}
			this.#dependencies.set(blockKey, dependencies);
		}
	}
	compose({ items, activeConcessions }: CompositionInput): ResolvedBlock[] {
		const blocks = this.#blocks,
			index = this.index,
			atomsByKey = this.#atomsByKey;
		const changes: ConcessionChange[] = items.flatMap((item) => {
			const concession = item.concessions.find((c) => c.id === activeConcessions[item.itemId]);
			return (
				concession?.changes.map((change, changeIndex) => ({
					change,
					effect: item.annotations.find(
						(annotation) =>
							annotation.kind === 'concession-effect' &&
							annotation.concessionId === concession.id &&
							annotation.changeIndex === changeIndex
					)
				})) ?? []
			);
		});
		const activations = new Map(
			changes.flatMap((patch) => {
				const block = activatedBlock(index, patch.change);
				return block ? [[block, patch] as const] : [];
			})
		);
		// Construct and validate the entire candidate before changing accepted input state.
		const previousAddresses = this.#current;
		const activeKey = JSON.stringify([...activations.keys()].sort());
		const current =
			activeKey === this.#activeKey
				? previousAddresses
				: sourceAddresses(blocks, new Set(activations.keys()));
		const activationVersions = new Map(
			[...activations].map(([key, change]) => [key, JSON.stringify(change)])
		);
		const triggers =
			items === this.#items
				? this.#triggers
				: items.flatMap((item) =>
						item.triggers.map((o) => ({
							...o,
							itemId: item.itemId
						}))
					);
		// Source coordinates and block grouping depend only on immutable saved overlays.
		const overlays = items.map((item) => {
			let cached = this.#overlay.get(item);
			if (!cached) {
				const annotations = item.annotations.map((annotation) => ({
					...annotation,
					start: pointPosition(index, annotation.range.start),
					end: pointPosition(index, annotation.range.end)
				}));
				const annotationsByBlock = new Map<string, PositionedAnnotation[]>();
				for (const [blockKey, units] of index.unitsByBlock) {
					const start = units[0].position,
						last = units.at(-1)!;
					const local = annotations.filter((annotation) =>
						annotation.start === annotation.end
							? index.byKey.get(annotation.range.start.sourceKey)?.blockKey === blockKey
							: annotation.start < last.position + last.length && annotation.end > start
					);
					if (local.length) annotationsByBlock.set(blockKey, local);
				}
				cached = { annotations, annotationsByBlock };
				this.#overlay.set(item, cached);
			}
			return cached;
		});
		const prioritized = new Map(
			overlays.flatMap((overlay) =>
				overlay.annotations.map(
					(annotation) =>
						[
							annotation.id,
							{
								...annotation,
								applied:
									annotation.kind === 'concession-effect' &&
									activeConcessions[annotation.itemId] === annotation.concessionId
							}
						] as const
				)
			)
		);
		const annotationsByBlock = new Map<string, PositionedAnnotation[]>(
			[...index.unitsByBlock.keys()].map((key) => [key, []])
		);
		for (const overlay of overlays)
			for (const [key, annotations] of overlay.annotationsByBlock)
				annotationsByBlock
					.get(key)!
					.push(...annotations.map((annotation) => prioritized.get(annotation.id)!));
		const annotationVersions = new Map(
			[...annotationsByBlock].map(([key, annotations]) => [key, JSON.stringify(annotations)])
		);
		const patches = new Map<string, Patch[]>();
		for (const patch of changes) {
			const { change } = patch;
			const range = change.range;
			const key = localBlock(index, range);
			const items = patches.get(key) ?? [];
			if (items.some((patch) => changesConflict(index, patch.change, change)))
				throw new Error(`Conflicting active changes in ${key}`);
			items.push({
				...patch,
				start: pointPosition(index, range.start),
				end: pointPosition(index, range.end)
			});
			patches.set(key, items);
		}
		const patchVersions = new Map([...patches].map(([key, value]) => [key, JSON.stringify(value)]));
		const replacementDependencies = new Map<string, Set<string>>();
		for (const [key, localPatches] of patches) {
			const targets = new Set<string>();
			for (const patch of localPatches)
				for (const atom of patch.change.replacement) {
					if (atom.kind !== 'reference') continue;
					targets.add(atom.targetItemKey);
					if (atom.endTargetItemKey) targets.add(atom.endTargetItemKey);
				}
			replacementDependencies.set(key, targets);
		}
		const dirty = new Set<string>();
		for (const [next, previous] of [
			[activationVersions, this.#activationVersions],
			[annotationVersions, this.#annotationVersions],
			[patchVersions, this.#patchVersions]
		]) {
			for (const key of new Set([...next.keys(), ...previous.keys()]))
				if (next.get(key) !== previous.get(key)) dirty.add(key);
		}
		if (previousAddresses !== current) {
			const changedTargets = new Set(
				[...current.keys(), ...previousAddresses.keys()].filter(
					(key) => JSON.stringify(current.get(key)) !== JSON.stringify(previousAddresses.get(key))
				)
			);
			for (const [key, targets] of this.#dependencies) {
				if (
					[...targets, ...(replacementDependencies.get(key) ?? [])].some((target) =>
						changedTargets.has(target)
					)
				)
					dirty.add(key);
			}
		}
		// Retain unfinished dirtiness so a failed composition can be retried safely.
		for (const key of dirty) this.#dirtyBlocks.add(key);
		this.#current = current;
		this.#activeKey = activeKey;
		this.#items = items;
		this.#triggers = triggers;
		this.#annotationVersions = annotationVersions;
		this.#activationVersions = activationVersions;
		this.#patchVersions = patchVersions;
		const dirtyBlocks = new Set(this.#dirtyBlocks);
		function patchAnnotation(patch: Patch | ConcessionChange): Annotation {
			const { change } = patch;
			const start = pointPosition(index, change.range.start),
				end = pointPosition(index, change.range.end);
			// Real trigger validation stays independent of visual effect coverage.
			const trigger = changeTriggerOwner(index, triggers, change) as OwnedTrigger | undefined;
			const memberships = annotationsByBlock
				.get(localBlock(index, change.range))!
				.filter((o) =>
					start === end
						? (o.start === start && o.end === end) || (o.start < start && o.end > end)
						: o.start <= start && o.end >= end
				);
			const actualTrigger = trigger
				? prioritized.get(triggerAnnotationId(trigger.itemId, trigger.id))
				: undefined;
			const explicitEffect = patch.effect ? prioritized.get(patch.effect.id) : undefined;
			return {
				annotations: [
					...new Map(
						[
							...memberships,
							...(actualTrigger ? [actualTrigger] : []),
							...(explicitEffect ? [explicitEffect] : [])
						].map((o) => [o.id, o])
					).values()
				],
				visualSource: change.range,
				generatedOffset: 0
			};
		}
		const separator = (owner: Annotation): ResolvedRun => ({
			text: ' ',
			...owner,
			generated: 'separator'
		});
		function replacement(
			atoms: readonly ReplacementAtom[],
			owner: Annotation,
			baseOffset = 0
		): ResolvedRun[] {
			let offset = baseOffset;
			return atoms.map((atom) => {
				const text = atom.kind === 'text' ? atom.text : referenceText(atom, current);
				const run: ResolvedRun = {
					text,
					generated: 'replacement',
					...owner,
					generatedOffset: offset,
					revision: 'added'
				};
				offset += text.length;
				return run;
			});
		}
		function sourceSlice(
			units: readonly SourceUnit[],
			start: number,
			end: number,
			removed = false
		): ResolvedRun[] {
			const localAnnotations = annotationsByBlock.get(units[0].blockKey)!;
			const result: ResolvedRun[] = [];
			for (const unit of units) {
				const from = Math.max(start, unit.position),
					to = Math.min(end, unit.position + unit.length);
				if (from >= to) continue;
				const cuts = [
					...new Set([
						from,
						to,
						...localAnnotations.flatMap((o) => [o.start, o.end]).filter((p) => p > from && p < to)
					])
				].sort((a, b) => a - b);
				for (let i = 0; i < cuts.length - 1; i++) {
					const a = cuts[i],
						b = cuts[i + 1];
					const source: SourceRange = {
						start: { sourceKey: unit.sourceKey, offset: a - unit.position },
						end: { sourceKey: unit.sourceKey, offset: b - unit.position }
					};
					const activation = activations.get(unit.blockKey);
					const sourceMemberships = localAnnotations.filter((o) => o.start <= a && o.end >= b);
					const owner: Annotation =
						unit.kind === 'number' && activation && !removed
							? patchAnnotation(activation)
							: { annotations: sourceMemberships };
					const base: Omit<ResolvedRun, 'text'> = {
						...(unit.kind === 'number' && activation && !removed
							? { generated: 'activation-number' as const }
							: { source }),
						sourceKind: unit.kind,
						...owner
					};
					if (unit.kind === 'text') {
						result.push({
							...base,
							text: unit.displayText.slice(a - unit.position, b - unit.position),
							...(removed ? { revision: 'removed' as const } : {})
						});
						continue;
					}
					const before = unit.displayText;
					let text: string;
					if (unit.kind === 'number') {
						const address = current.get(unit.sourceKey.slice('number:'.length));
						if (!address) throw new Error(`Missing number: ${unit.sourceKey}`);
						text = address.label;
					} else {
						const atom = atomsByKey.get(unit.sourceKey);
						if (atom?.kind !== 'reference')
							throw new Error(`Missing reference atom: ${unit.sourceKey}`);
						text = referenceText(atom, current);
					}
					if (removed) result.push({ ...base, text: before, revision: 'removed' });
					else if (before !== text) {
						if (before)
							result.push(
								{
									...base,
									annotations: sourceMemberships,
									source,
									generated: undefined,
									visualSource: undefined,
									generatedOffset: undefined,
									text: before,
									revision: 'removed'
								},
								...(unit.kind === 'number' ? [separator(owner)] : [])
							);
						result.push({ ...base, text, revision: 'added' });
					} else result.push({ ...base, text });
					if (unit.kind === 'number' && (!removed || end > unit.position + unit.length))
						result.push(separator(owner));
				}
			}
			return result;
		}
		function renderReadableRedline(
			units: readonly SourceUnit[],
			patch: Patch,
			owner: Annotation
		): ResolvedRun[] | null {
			const { change, start, end } = patch;
			if (
				!unitsInRange(index, change.range).every((unit) => unit.kind === 'text') ||
				!change.replacement.every((atom) => atom.kind === 'text')
			)
				return null;
			const before = rangeText(index, change.range);
			// Only ordinary text has a one-to-one mapping from UTF-16 lengths to coordinates.
			if (before.length !== end - start) return null;
			const after = change.replacement.map((atom) => atom.text).join('');
			const parts = diffRedlineText(before, after);
			if (!parts) return null;
			const runs: ResolvedRun[] = [];
			let sourceCursor = start,
				replacementCursor = 0;
			for (const [i, part] of parts.entries()) {
				if (part.kind === 'insert') {
					const previous = parts[i - 1];
					if (previous?.kind === 'delete' && needsRedlineSeparator(previous.text, part.text))
						runs.push(separator(owner));
					runs.push(...replacement([{ kind: 'text', text: part.text }], owner, replacementCursor));
				} else {
					runs.push(
						...sourceSlice(
							units,
							sourceCursor,
							sourceCursor + part.text.length,
							part.kind === 'delete'
						)
					);
					sourceCursor += part.text.length;
				}
				// Equal source spans still occupy positions in the complete replacement wording.
				if (part.kind !== 'delete') replacementCursor += part.text.length;
			}
			return sourceCursor === end && replacementCursor === after.length ? runs : null;
		}
		const cache = this.#blockContent;
		const engine = this;
		function composeContent(key: string): ResolvedRun[] {
			const cached = cache.get(key);
			if (!engine.#dirtyBlocks.has(key) && cached) return cached.content;
			const localChanges = patches.get(key) ?? [];
			const targets = new Set([
				...(engine.#dependencies.get(key) ?? []),
				...(replacementDependencies.get(key) ?? [])
			]);
			const version = JSON.stringify([
				engine.#annotationVersions.get(key),
				localChanges,
				[...targets].map((target) => [target, current.get(target)]),
				engine.#activationVersions.get(key)
			]);
			if (cached?.version === version) {
				engine.#dirtyBlocks.delete(key);
				return cached.content;
			}
			const content = resolveContent(key);
			cache.set(key, { version, content });
			engine.#dirtyBlocks.delete(key);
			return content;
		}
		function resolveContent(blockKey: string): ResolvedRun[] {
			const units = index.unitsByBlock.get(blockKey)!;
			const first = units[0],
				last = units.at(-1)!;
			const localPatches = (patches.get(blockKey) ?? []).sort(
				(a, b) => a.start - b.start || a.end - b.end
			);
			let cursor = first.position;
			const result: ResolvedRun[] = [];
			for (const patch of localPatches) {
				const { change, start, end } = patch;
				if (start < cursor)
					throw new Error(`Overlapping active changes in ${blockKey}`);
				result.push(...sourceSlice(units, cursor, start));
				const owner = patchAnnotation(patch);
				// Prefer word-level redlines when the replacement preserves source structure.
				const readable = end > start ? renderReadableRedline(units, patch, owner) : null;
				if (readable) result.push(...readable);
				else {
					if (end > start) {
						result.push(...sourceSlice(units, start, end, true));
						if (
							change.replacement.some((atom) => atom.kind === 'reference' || atom.text.length > 0)
						)
							result.push(separator(owner));
					}
					result.push(...replacement(change.replacement, owner));
				}
				// Replacing only a generated label keeps its separator before the untouched
				// body. A deleted label still needs that spacing in redline view.
				if (
					first.kind === 'number' &&
					start === first.position &&
					end === first.position + first.length
				)
					result.push(separator(owner));
				cursor = end;
			}
			result.push(...sourceSlice(units, cursor, last.position + last.length));
			if (!result.some((run) => run.text)) {
				const memberships = annotationsByBlock
					.get(blockKey)!
					.filter((o) => o.start === o.end);
				if (memberships.length) return emptyHitTarget(memberships);
			}
			return result;
		}
		function trimAfterNumber(runs: ResolvedRun[]): ResolvedRun[] {
			if (runs[0]?.sourceKind !== 'number') return runs;
			let prefixEnd = 0;
			while (
				prefixEnd < runs.length &&
				(runs[prefixEnd].sourceKind === 'number' || runs[prefixEnd].generated === 'separator')
			)
				prefixEnd++;
			const prefix = runs.slice(0, prefixEnd);
			const body = runs.slice(prefixEnd);
			const first = body.findIndex((run) => /\S/u.test(run.text));
			if (first < 0) return prefix.at(-1)?.generated === 'separator' ? prefix.slice(0, -1) : prefix;
			const content = body.slice(first);
			const leading = /^\s+/u.exec(content[0].text)?.[0].length ?? 0;
			if (leading) {
				const run = content[0];
				content[0] = {
					...run,
					text: run.text.slice(leading),
					...(run.generatedOffset !== undefined
						? { generatedOffset: run.generatedOffset + leading }
						: {}),
					...(run.sourceKind === 'text' && run.source
						? {
								source: {
									start: { ...run.source.start, offset: run.source.start.offset + leading },
									end: run.source.end
								}
							}
						: {})
				};
			}
			return [...prefix, ...content];
		}
		function resolveBlock(block: ContractBlock): ResolvedBlock {
			if (block.kind === 'table') return block;
			if (block.kind === 'paragraph' && block.optional && !activations.has(block.blockKey)) {
				const memberships = annotationsByBlock
					.get(block.blockKey)!
					.filter((o) => o.start === o.end);
				const version = engine.#annotationVersions.get(block.blockKey)!;
				let slot = engine.#slots.get(block.blockKey);
				if (slot?.version !== version) {
					slot = {
						version,
						content: emptyHitTarget(memberships)
					};
					engine.#slots.set(block.blockKey, slot);
				}
				engine.#dirtyBlocks.delete(block.blockKey);
				return {
					kind: 'paragraph',
					blockKey: block.blockKey,
					emptyInsertionSlot: true,
					content: slot!.content
				};
			}
			const raw = composeContent(block.blockKey);
			let content = engine.#trimmed.get(raw);
			if (!content) {
				content = trimAfterNumber(raw);
				engine.#trimmed.set(raw, content);
			}
			return block.kind === 'heading'
				? {
						kind: 'heading',
						blockKey: block.blockKey,
						anchor: block.anchor,
						level: block.level,
						content
					}
				: { kind: 'paragraph', blockKey: block.blockKey, content };
		}
		return blocks.map((block) => {
			const previous = this.#resolved.get(block.blockKey);
			if (previous && !dirtyBlocks.has(block.blockKey)) return previous;
			const next = resolveBlock(block);
			const unchanged =
				previous &&
				previous.kind === next.kind &&
				previous.kind !== 'table' &&
				next.kind !== 'table' &&
				previous.content === next.content;
			if (unchanged) return previous;
			this.#resolved.set(block.blockKey, next);
			return next;
		});
	}
}
