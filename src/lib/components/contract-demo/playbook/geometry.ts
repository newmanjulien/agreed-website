import type { ContractChange, Trigger } from './model';
import type { SourceIndex } from '../contract/source-index';
import { resolvePoint } from '../contract/source-index';
import {
	containsPoint,
	containsRange,
	isEmptyRange,
	localBlock,
	rangesOverlap
} from '../contract/ranges';

export class GeometryError extends Error {
	constructor(
		readonly kind: 'trigger-boundary' | 'ambiguous-owner' | 'invalid-slot',
		message: string
	) {
		super(message);
		this.name = 'GeometryError';
	}
}

/** Throws for partial boundary crossings or ambiguous insertion ownership. */
export function changeTriggerOwner(
	index: SourceIndex,
	triggers: readonly Trigger[],
	change: ContractChange
): Trigger | undefined {
	localBlock(index, change.range);
	const insertion = isEmptyRange(index, change.range);
	const owners = triggers.filter((trigger) => {
		if (insertion) return containsPoint(index, trigger.range, change.range.start, true);
		if (!rangesOverlap(index, trigger.range, change.range)) return false;
		if (!containsRange(index, trigger.range, change.range))
			throw new GeometryError('trigger-boundary', `Change crosses Trigger boundary: ${trigger.id}`);
		return true;
	});
	if (owners.length > 1)
		throw new GeometryError('ambiguous-owner', 'Change has ambiguous Trigger ownership');
	return owners[0];
}

/** Optional paragraph activation is a consequence of a normal nonempty insertion. */
export function activatedBlock(index: SourceIndex, change: ContractChange): string | undefined {
	localBlock(index, change.range);
	const unit = resolvePoint(index, change.range.start);
	const block = index.blocks.get(unit.blockKey)!;
	if (block.kind !== 'paragraph' || !block.optional) return;
	if (
		!isEmptyRange(index, change.range) ||
		unit.kind !== 'text' ||
		unit.length !== 0 ||
		change.range.end.sourceKey !== unit.sourceKey
	)
		throw new GeometryError(
			'invalid-slot',
			'Optional paragraphs only accept insertions at their empty source slot'
		);
	return change.replacement.some((atom) => atom.kind === 'reference' || atom.text.length > 0)
		? block.blockKey
		: undefined;
}
