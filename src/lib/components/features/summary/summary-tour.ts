import { contractCursorMoveDuration, type ContractTourStep } from '../demo/contract-tour.ts';
import { createClauseOpening, clauseSummary, resaleDemo } from '../demo/clause-opening.ts';

export const summaryDemo = resaleDemo;

const negotiation = { ...clauseSummary, openSection: 'negotiation' } as const;

export const summaryTour: ReadonlyArray<ContractTourStep> = [
	...createClauseOpening(350),
	{ phase: 'approach-negotiation', duration: contractCursorMoveDuration, state: clauseSummary, cursor: { target: 'negotiation', mode: 'idle' } },
	{ phase: 'click-negotiation', duration: 220, state: clauseSummary, cursor: { target: 'negotiation', mode: 'clicking' } },
	{ phase: 'read-negotiation', duration: 1800, state: negotiation, cursor: { target: 'negotiation', mode: 'idle' } },
	{ phase: 'hold', duration: 1000, state: negotiation, cursor: null }
];
