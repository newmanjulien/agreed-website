import type { ContractBlock } from '../../contract/model';
import type { PlaybookItemRecord } from '../../playbook/model';
import { toDocumentOverlay } from '../../playbook/document-overlay';
import { buildSourceIndex } from '../../contract/source-index';
import type { ContractRenderSource } from './types';

export interface ContractSourceInput {
	blocks: ContractBlock[];
	items: PlaybookItemRecord[];
}

const sources = new WeakMap<ContractSourceInput, { items: PlaybookItemRecord[]; renderSource: ContractRenderSource }>();

/** Share immutable fixture preparation across viewers. */
export function createContractSource(input: ContractSourceInput) {
	const cached = sources.get(input);
	if (cached) return cached;
	const { blocks, items } = input;
	const renderSource: ContractRenderSource = Object.freeze({
		blocks,
		items: items.map(toDocumentOverlay),
		sourceIndex: buildSourceIndex(blocks)
	});
	const source = { items, renderSource };
	sources.set(input, source);
	return source;
}
