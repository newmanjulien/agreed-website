import type { ClauseRegistry } from './agreement-model.ts';
import type { AgreementDocument } from './types.ts';
import {
	cloneAgreementControlValues,
	createDefaultControlValues,
	normalizeControlValue,
	type AgreementClauseProposal,
	type AgreementClauseProposals,
	type AgreementControlValues
} from './agreement-control-values.ts';
import {
	resolveAgreement,
	type ResolvedAgreementDocument
} from './resolve-agreement.ts';
import { createDiscussionMessageId } from './discussions/types.ts';

interface PreparedAgreementChange {
	controlValues: AgreementControlValues;
	clauseProposals: AgreementClauseProposals;
	document: ResolvedAgreementDocument;
}

export class AgreementSession {
	controlValues = $state<AgreementControlValues>({});
	clauseProposals = $state<AgreementClauseProposals>({});

	currentControlValues(clauses: ClauseRegistry): AgreementControlValues {
		const current = createDefaultControlValues(clauses);
		for (const [clauseId, storedValues] of Object.entries(this.controlValues)) {
			for (const [controlId, value] of Object.entries(storedValues)) {
				const normalized = normalizeControlValue(clauses, clauseId, controlId, value);
				if (normalized === null) continue;
				current[clauseId] = { ...current[clauseId], [controlId]: normalized };
			}
		}
		return current;
	}

	snapshot(
		template: AgreementDocument,
		clauses: ClauseRegistry
	): ResolvedAgreementDocument {
		const controlValues = this.currentControlValues(clauses);
		return resolveAgreement(template, clauses, controlValues, this.clauseProposals);
	}

	clauseProposal(clauseId: string): AgreementClauseProposal | undefined {
		return this.clauseProposals[clauseId];
	}

	prepareControlChange(
		template: AgreementDocument,
		clauses: ClauseRegistry,
		clauseId: string,
		controlId: string,
		value: string
	): PreparedAgreementChange | null {
		const normalized = normalizeControlValue(clauses, clauseId, controlId, value);
		if (normalized === null) return null;
		const currentControlValues = this.currentControlValues(clauses);
		const controlValues = {
			...currentControlValues,
			[clauseId]: { ...currentControlValues[clauseId], [controlId]: normalized }
		};
		const clauseProposals = { ...this.clauseProposals };
		delete clauseProposals[clauseId];
		return {
			controlValues,
			clauseProposals,
			document: resolveAgreement(template, clauses, controlValues, clauseProposals)
		};
	}

	prepareClauseProposal(
		template: AgreementDocument,
		clauses: ClauseRegistry,
		clauseId: string,
		optionValue: string,
		text: string
	): PreparedAgreementChange | null {
		const proposal = text.trim();
		if (!proposal || this.clauseProposals[clauseId]) return null;

		const widget = clauses[clauseId]?.widget;
		if (widget?.type !== 'changes') return null;

		const selectedOption = widget.control.options.find((option) => option.value === optionValue);
		if (selectedOption?.kind !== 'custom') return null;

		const currentControlValues = this.currentControlValues(clauses);
		const controlValues = {
			...currentControlValues,
			[clauseId]: {
				...currentControlValues[clauseId],
				[widget.control.id]: selectedOption.value
			}
		};
		const clauseProposals = {
			...this.clauseProposals,
			[clauseId]: {
				text: proposal,
				replies: []
			}
		};

		return {
			controlValues,
			clauseProposals,
			document: resolveAgreement(template, clauses, controlValues, clauseProposals)
		};
	}

	prepareClauseProposalRootEdit(
		template: AgreementDocument,
		clauses: ClauseRegistry,
		clauseId: string,
		text: string
	): PreparedAgreementChange | null {
		const proposal = this.clauseProposals[clauseId];
		const nextText = text.trim();
		if (!proposal || !nextText) return null;

		const widget = clauses[clauseId]?.widget;
		if (widget?.type !== 'changes') return null;
		const controlValues = this.currentControlValues(clauses);
		const selectedValue = controlValues[clauseId]?.[widget.control.id];
		const selectedOption = widget.control.options.find(
			(option) => option.value === selectedValue
		);
		if (selectedOption?.kind !== 'custom') return null;

		const clauseProposals = {
			...this.clauseProposals,
			[clauseId]: { ...proposal, text: nextText }
		};
		return {
			controlValues,
			clauseProposals,
			document: resolveAgreement(template, clauses, controlValues, clauseProposals)
		};
	}

	prepareClauseProposalDeletion(
		template: AgreementDocument,
		clauses: ClauseRegistry,
		clauseId: string
	): PreparedAgreementChange | null {
		if (!this.clauseProposals[clauseId]) return null;

		const widget = clauses[clauseId]?.widget;
		if (widget?.type !== 'changes') return null;

		const currentControlValues = this.currentControlValues(clauses);
		const controlValues = {
			...currentControlValues,
			[clauseId]: {
				...currentControlValues[clauseId],
				[widget.control.id]: widget.control.defaultValue
			}
		};
		const clauseProposals = { ...this.clauseProposals };
		delete clauseProposals[clauseId];

		return {
			controlValues,
			clauseProposals,
			document: resolveAgreement(template, clauses, controlValues, clauseProposals)
		};
	}

	addClauseProposalReply(clauseId: string, text: string): boolean {
		const proposal = this.clauseProposals[clauseId];
		const replyText = text.trim();
		if (!proposal || !replyText) return false;
		proposal.replies.push({
			id: createDiscussionMessageId('reply'),
			text: replyText
		});
		return true;
	}

	editClauseProposalReply(clauseId: string, replyId: string, text: string): boolean {
		const reply = this.clauseProposals[clauseId]?.replies.find(
			(candidate) => candidate.id === replyId
		);
		const nextText = text.trim();
		if (!reply || !nextText) return false;
		reply.text = nextText;
		return true;
	}

	deleteClauseProposalReply(clauseId: string, replyId: string): boolean {
		const proposal = this.clauseProposals[clauseId];
		if (!proposal) return false;
		const replyIndex = proposal.replies.findIndex((reply) => reply.id === replyId);
		if (replyIndex === -1) return false;
		proposal.replies.splice(replyIndex, 1);
		return true;
	}

	commit(change: PreparedAgreementChange): void {
		this.controlValues = cloneAgreementControlValues(change.controlValues);
		this.clauseProposals = { ...change.clauseProposals };
	}
}
