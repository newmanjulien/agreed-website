import type { ResolvedRun } from '$lib/components/contract-demo/contract/model';
import type { AnnotationMembership } from '$lib/components/contract-demo/playbook/document-overlay';
import type { PreparedBlock } from './prepare';
import type { ContractTable } from '../../contract/source-model';

export interface InlineToken extends Readonly<Omit<ResolvedRun, 'text' | 'annotations'>> {
	readonly value: string;
	readonly annotations?: readonly AnnotationMembership[];
}

export type PageFragment = HeadingFragment | ParagraphFragment | TableFragment;

export interface FragmentInterval {
	readonly start: number;
	readonly end: number;
}

export interface HeadingFragment {
	readonly interval?: FragmentInterval;
	readonly type: 'heading';
	readonly blockKey: string;
	readonly anchor: string;
	readonly level: 1 | 2 | 3;
	readonly tokens: readonly InlineToken[];
}

export interface ParagraphFragment {
	readonly interval?: FragmentInterval;
	readonly type: 'paragraph';
	readonly blockKey: string;
	readonly tokens: readonly InlineToken[];
	readonly isFinal: boolean;
	readonly emptyInsertionSlot?: boolean;
}

export interface TableFragment extends ContractTable {
	readonly interval?: never;
	readonly type: 'table';
	readonly blockKey: string;
}

/** Content identity accompanies placement; geometry alone never authorizes page reuse. */
export interface LayoutPlacement {
	readonly prepared: PreparedBlock;
	readonly fragment: PageFragment;
}

/** Complete candidate page produced by pure pagination. */
export interface PaginatedPage {
	readonly number: number;
	readonly placements: readonly LayoutPlacement[];
}

export function fragmentKey(fragment: PageFragment): string {
	return `${fragment.blockKey}:${fragment.interval?.start ?? 0}:${fragment.interval?.end ?? 'whole'}`;
}
