import type { AgreementDocument } from './types.ts';

interface ChangesControlOptionBase {
	value: string;
	controlLabel: string;
}

export interface ChangesValueOption extends ChangesControlOptionBase {
	kind: 'value';
	documentLabel: string;
}

export interface ChangesDeactivateOption extends ChangesControlOptionBase {
	kind: 'deactivate';
	documentLabel: string;
}

export interface ChangesCustomOption extends ChangesControlOptionBase {
	kind: 'custom';
}

export type ChangesControlOption =
	| ChangesValueOption
	| ChangesDeactivateOption
	| ChangesCustomOption;

export interface ChangesControlDefinition {
	id: string;
	label: string;
	defaultValue: string;
	options: ReadonlyArray<ChangesControlOption>;
}

export interface DocumentValueDefinition {
	defaultLabel: string;
}

export type ClauseHighlightTone = 'informational' | 'editable';

export type FaqAnswerPart =
	| { type: 'text'; text: string }
	| { type: 'clause-reference'; text: string; clauseId: string };

export interface FaqParagraph {
	parts: ReadonlyArray<FaqAnswerPart>;
}

export interface FaqItem {
	id: string;
	question: string;
	answer: ReadonlyArray<FaqParagraph>;
}

interface ClauseDefinitionBase {
	title: string;
	highlightTone: ClauseHighlightTone;
}

export interface ChangesWidgetDefinition {
	type: 'changes';
	prompt: string;
	appliedMessage: string;
	control: ChangesControlDefinition;
}

export interface FaqWidgetDefinition {
	type: 'faq';
	intro: string;
	items: ReadonlyArray<FaqItem>;
}

export type ClauseWidgetDefinition = ChangesWidgetDefinition | FaqWidgetDefinition;
export type ClauseWidgetType = ClauseWidgetDefinition['type'];

export interface ClauseDefinition extends ClauseDefinitionBase {
	values?: Readonly<Record<string, DocumentValueDefinition>>;
	widget: ClauseWidgetDefinition;
}

export type ClauseRegistry = Readonly<Record<string, ClauseDefinition>>;

export interface CompiledAgreement {
	document: AgreementDocument;
	clauses: ClauseRegistry;
}
