import { contractCursorMoveDuration, type ContractTourStep } from '../demo/contract-tour.ts';

export const approvalDemo = {
	mode: 'actions',
	itemId: 'demo:attorneys-fees',
	concessionId: 'attorneys-fees-mutual'
} as const;

// Start with a rendered change that actually requires approval in the shared fixture.
const changed = { panelOpen: false, hovered: false, concessionId: approvalDemo.concessionId } as const;

export const approvalTour: ReadonlyArray<ContractTourStep> = [
	{ phase: 'rest', duration: 700, state: changed, cursor: null },
	{ phase: 'enter', duration: 120, state: changed, cursor: { target: 'origin', mode: 'idle' } },
	{ phase: 'approach-approval', duration: contractCursorMoveDuration, state: changed, cursor: { target: 'approval', mode: 'idle' } },
	{ phase: 'hover-approval', duration: 220, state: changed, cursor: { target: 'approval', mode: 'idle' } },
	{ phase: 'click-approval', duration: 220, state: changed, cursor: { target: 'approval', mode: 'clicking' } },
	{ phase: 'clicked', duration: 350, state: changed, cursor: { target: 'approval', mode: 'idle' } },
	{ phase: 'hold', duration: 1800, state: changed, cursor: null }
];
