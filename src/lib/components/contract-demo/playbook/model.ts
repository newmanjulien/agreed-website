import type { SourceRange, ReplacementAtom } from '../contract/source-model';
export type { SourcePoint, SourceRange } from '../contract/source-model';
export interface Trigger { id: string; range: SourceRange }
export interface Instructions {
	summary?: string;
	howToExplainToBuyers?: string;
	commonObjections?: string;
	negotiation?: string;
	changesNeedApproval?: string;
}
export type InlineTemplateAtom = ReplacementAtom;
export type InlineTemplate = InlineTemplateAtom[];
export interface ContractChange { range: SourceRange; replacement: InlineTemplate }
export interface Concession {
	id: string;
	tier: 'preferred' | 'rare';
	requiresApproval: boolean;
	description: string;
	changes: ContractChange[];
}
export interface PlaybookItem {
	triggers: Trigger[];
	instructions?: Instructions;
	concessions: Concession[];
	importantToNegotiate: boolean;
}
export type ConcessionSelection = Readonly<Record<string, string>>;
export type PlaybookItemId = string;
export interface PlaybookItemRecord extends PlaybookItem { _id: PlaybookItemId }
