import { contractCursorMoveDuration, type ContractTourStep } from '../demo/contract-tour.ts';
import { createClauseOpening, clauseSummary, resaleDemo } from '../demo/clause-opening.ts';

export const acceptDemo = {
	...resaleDemo,
	concessionId: 'resale-ordinary-course-billing'
} as const;

const concession = { ...clauseSummary, openSection: 'preferred' } as const;
const applied = { ...concession, concessionId: acceptDemo.concessionId } as const;

export const acceptChangesTour: ReadonlyArray<ContractTourStep> = [
	...createClauseOpening(650),
	{ phase: 'approach-concession', duration: contractCursorMoveDuration, state: clauseSummary, cursor: { target: 'preferred', mode: 'idle' } },
	{ phase: 'click-concession', duration: 220, state: clauseSummary, cursor: { target: 'preferred', mode: 'clicking' } },
	{ phase: 'read-concession', duration: 1400, state: concession, cursor: { target: 'preferred', mode: 'idle' } },
	{ phase: 'approach-apply', duration: contractCursorMoveDuration, state: concession, cursor: { target: 'apply', mode: 'idle' } },
	{ phase: 'click-apply', duration: 220, state: concession, cursor: { target: 'apply', mode: 'clicking' } },
	{ phase: 'clicked-apply', duration: 1000, state: concession, cursor: { target: 'apply', mode: 'idle' } },
	{ phase: 'hold', duration: 2800, state: applied, cursor: null }
];
