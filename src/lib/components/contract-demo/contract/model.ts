export type ContractBlock = import('./source-model').BaselineBlock;
export type InlineAtom = import('./source-model').ReplacementAtom;
export interface ResolvedRun {
	text: string;
	source?: import('./source-model').SourceRange;
	sourceKind?: 'text' | 'reference' | 'number';
	generated?: 'replacement' | 'activation-number' | 'separator' | 'empty-hit-target';
	revision?: 'removed' | 'added';
	/** Visual provenance only; generated text is never baseline-selectable. */
	visualSource?: import('./source-model').SourceRange;
	generatedOffset?: number;
	annotations?: import('../playbook/document-overlay').AnnotationMembership[];
}
export type ResolvedBlock =
	| { kind: 'heading'; blockKey: string; anchor: string; level: 1 | 2 | 3; content: ResolvedRun[] }
	| { kind: 'paragraph'; blockKey: string; content: ResolvedRun[]; emptyInsertionSlot?: boolean }
	| ({ kind: 'table'; blockKey: string } & import('./source-model').ContractTable);
