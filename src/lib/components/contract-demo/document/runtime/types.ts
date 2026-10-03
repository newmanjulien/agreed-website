import type { ContractBlock } from '$lib/components/contract-demo/contract/model';
import type { DocumentOverlayItem } from '$lib/components/contract-demo/playbook/document-overlay';
import type { SourceIndex } from '$lib/components/contract-demo/contract/source-index';
import type { PaginatedPage } from '../pagination/types';
import type { ConcessionSelection } from '../../playbook/model';

export interface ContractRenderSource {
	readonly blocks: readonly ContractBlock[];
	readonly items: readonly DocumentOverlayItem[];
	readonly sourceIndex: SourceIndex;
}
export interface RenderSnapshot {
	readonly id: number;
	readonly layoutEpoch: string;
	readonly changedPages: readonly number[];
	readonly source: ContractRenderSource;
	readonly concessions: ConcessionSelection;
	readonly pages: readonly PaginatedPage[];
}
export interface RenderFailure {
	message: string;
	cause?: unknown;
}
export function sameSelection(a: ConcessionSelection, b: ConcessionSelection): boolean {
	return (
		Object.keys(a).length === Object.keys(b).length &&
		Object.entries(a).every(([key, value]) => b[key] === value)
	);
}
