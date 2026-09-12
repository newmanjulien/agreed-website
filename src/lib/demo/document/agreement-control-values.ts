import type { ChangesControlDefinition, ClauseRegistry } from './agreement-model.ts';
import type { DiscussionRoot } from './discussions/types';

export type AgreementControlValues = Record<string, Record<string, string>>;
export type AgreementClauseProposal = DiscussionRoot;

export type AgreementClauseProposals = Record<string, AgreementClauseProposal>;

export function getChangesControl(
	clauses: ClauseRegistry,
	clauseId: string,
	controlId: string
): ChangesControlDefinition | undefined {
	const widget = clauses[clauseId]?.widget;
	return widget?.type === 'changes' && widget.control.id === controlId
		? widget.control
		: undefined;
}

export function createDefaultControlValues(clauses: ClauseRegistry): AgreementControlValues {
	const values: AgreementControlValues = {};
	for (const [clauseId, clause] of Object.entries(clauses)) {
		if (clause.widget.type !== 'changes') continue;
		const { control } = clause.widget;
		values[clauseId] = { [control.id]: control.defaultValue };
	}
	return values;
}

export function normalizeControlValue(
	clauses: ClauseRegistry,
	clauseId: string,
	controlId: string,
	value: string
): string | null {
	const control = getChangesControl(clauses, clauseId, controlId);
	return control?.options.some((option) => option.value === value) ? value : null;
}

export function cloneAgreementControlValues(
	values: AgreementControlValues
): AgreementControlValues {
	return Object.fromEntries(
		Object.entries(values).map(([clauseId, clauseValues]) => [
			clauseId,
			{ ...clauseValues }
		])
	);
}
