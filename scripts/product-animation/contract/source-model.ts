/** Immutable coordinates and contract shapes from the Oceans source snapshot. */
export interface SourcePoint { sourceKey: string; offset: number }
export interface SourceRange { start: SourcePoint; end: SourcePoint }
interface ReferenceAtom {
	kind: 'reference';
	targetItemKey: string;
	endTargetItemKey?: string;
}
export type ReplacementAtom = { kind: 'text'; text: string } | ReferenceAtom;
export type InlineSource =
	| { kind: 'text'; sourceKey: string; text: string }
	| (ReferenceAtom & { sourceKey: string });
interface SourceNumbering {
	itemKey: string;
	sequenceKey: string;
	parentItemKey?: string;
	style: 'decimal' | 'lower-alpha' | 'lower-roman' | 'upper-alpha';
}
interface BlockBase { blockKey: string; order: number; numbering?: SourceNumbering }
/** Static contract wording, without playbook targets or editable cell state. */
export interface ContractTable {
	readonly variant?: 'signature';
	readonly headerRowCount: number;
	readonly rows: readonly (readonly string[])[];
}
export type BaselineBlock = BlockBase & (
	| { kind: 'heading'; anchor: string; level: 1 | 2 | 3; content: InlineSource[] }
	| { kind: 'paragraph'; optional?: boolean; content: InlineSource[] }
	| ({ kind: 'table' } & ContractTable)
);
/** Reserved virtual identity for a numbered item; its offsets are 0/1. */
export const numberSourceKey = (itemKey: string): string => `number:${itemKey}`;
