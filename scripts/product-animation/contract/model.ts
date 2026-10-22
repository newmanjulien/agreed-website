export type ContractBlock = import('./source-model.ts').BaselineBlock;
export type InlineAtom = import('./source-model.ts').ReplacementAtom;
export interface ResolvedRun {
	text: string;
	source?: import('./source-model.ts').SourceRange;
	sourceKind?: 'text' | 'reference' | 'number';
	generated?: 'replacement' | 'activation-number' | 'separator' | 'empty-hit-target';
	revision?: 'removed' | 'added';
	annotations?: import('../playbook/document-overlay.ts').AnnotationMembership[];
}
export type ResolvedBlock =
	| { kind: 'heading'; blockKey: string; anchor: string; level: 1 | 2 | 3; content: ResolvedRun[] }
	| { kind: 'paragraph'; blockKey: string; content: ResolvedRun[]; emptyInsertionSlot?: boolean }
	| ({ kind: 'table'; blockKey: string } & import('./source-model.ts').ContractTable);
