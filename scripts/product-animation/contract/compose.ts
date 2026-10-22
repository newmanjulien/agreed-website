import type { ContractBlock, ResolvedBlock, ResolvedRun } from './model.ts';
import type {
	ConcessionSelection,
	Trigger,
	ContractChange,
	InlineTemplateAtom as ReplacementAtom,
	SourceRange
} from '../playbook/model.ts';
import {
	triggerAnnotationId,
	type AnnotationMembership,
	type DocumentOverlayItem
} from '../playbook/document-overlay.ts';
import { activatedBlock, changeTriggerOwner } from '../playbook/geometry.ts';
import {
	buildSourceIndex,
	pointPosition,
	sourceAddresses,
	type SourceUnit
} from './source-index.ts';
import { localBlock, rangeText, unitsInRange } from './ranges.ts';
import { diffRedlineText } from './redline-diff.ts';
import { referenceText } from './numbering.ts';
import { changesConflict } from '../playbook/conflicts.ts';

type OwnedTrigger = Trigger & { itemId: string };
type PositionedAnnotation = AnnotationMembership & { start: number; end: number };
type ConcessionChange = { change: ContractChange };
type Patch = ConcessionChange & { start: number; end: number };
type Annotation = Pick<ResolvedRun, 'annotations'>;

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
		}
	];
}

/** Prepare immutable source geometry once; each selection composes independently. */
export function createContractComposer(blocks: readonly ContractBlock[], items: readonly DocumentOverlayItem[]) {
	const index = buildSourceIndex(blocks);
	const atomsByKey = new Map(blocks.flatMap((block) => block.kind === 'table' ? [] : block.content).map((atom) => [atom.sourceKey, atom]));
	const triggers = items.flatMap((item) => item.triggers.map((trigger) => ({ ...trigger, itemId: item.itemId })));
	const annotations = items.flatMap((item) => item.annotations.map((annotation) => ({
		...annotation, start: pointPosition(index, annotation.range.start), end: pointPosition(index, annotation.range.end)
	})));
	const annotationsByBlock = new Map<string, PositionedAnnotation[]>();
	for (const [key, units] of index.unitsByBlock) {
		const start = units[0].position, last = units.at(-1)!;
		annotationsByBlock.set(key, annotations.filter((annotation) => annotation.start === annotation.end
			? index.byKey.get(annotation.range.start.sourceKey)?.blockKey === key
			: annotation.start < last.position + last.length && annotation.end > start));
	}
	const byAnnotationId = new Map(annotations.map((annotation) => [annotation.id, annotation]));
	const byItemId = new Map(items.map((item) => [item.itemId, item]));
	return function compose(activeConcessions: ConcessionSelection): ResolvedBlock[] {
		for (const [itemId, concessionId] of Object.entries(activeConcessions)) {
			const item = byItemId.get(itemId);
			if (!item) throw new Error(`Unknown playbook item: ${itemId}`);
			if (!item.concessions.some((concession) => concession.id === concessionId))
				throw new Error(`Unknown concession ${concessionId} for ${itemId}`);
		}
		const changes: ConcessionChange[] = items.flatMap((item) =>
			item.concessions.find((concession) => concession.id === activeConcessions[item.itemId])?.changes.map((change) => ({ change })) ?? []);
		const activations = new Map(changes.flatMap((patch) => {
			const block = activatedBlock(index, patch.change);
			return block ? [[block, patch] as const] : [];
		}));
		const current = sourceAddresses(blocks, new Set(activations.keys()));
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
				? byAnnotationId.get(triggerAnnotationId(trigger.itemId, trigger.id))
				: undefined;
			return {
				annotations: [
					...new Map(
						[
							...memberships,
							...(actualTrigger ? [actualTrigger] : [])
						].map((o) => [o.id, o])
					).values()
				],
			};
		}
		const separator = (owner: Annotation): ResolvedRun => ({
			text: ' ',
			...owner,
			generated: 'separator'
		});
		function replacement(
			atoms: readonly ReplacementAtom[],
			owner: Annotation
		): ResolvedRun[] {
			return atoms.map((atom) => {
				const text = atom.kind === 'text' ? atom.text : referenceText(atom, current);
				const run: ResolvedRun = {
					text,
					generated: 'replacement',
					...owner,
					revision: 'added'
				};
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
					runs.push(...replacement([{ kind: 'text', text: part.text }], owner));
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
				return {
					kind: 'paragraph',
					blockKey: block.blockKey,
					emptyInsertionSlot: true,
					content: emptyHitTarget(memberships)
				};
			}
			const content = trimAfterNumber(resolveContent(block.blockKey));
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
		return blocks.map(resolveBlock);
	};
}
