import blocks from './contract-blocks.json';
import items from './playbook-items.json';
import type { ContractBlock } from '../contract/model';
import type { PlaybookItemRecord } from '../playbook/model';
import type { ContractSourceInput } from '../document/runtime/source';

// Checked-in Oceans JSONL snapshot. IDs are `demo:` plus the first trigger ID.
// JSON imports widen string literals; the shapes match the source domain types.
export const demoContract: ContractSourceInput = {
	blocks: blocks as ContractBlock[],
	items: items as PlaybookItemRecord[]
};
