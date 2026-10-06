import { contractCursorMoveDuration, type ContractTourStep } from '../demo/contract-tour.ts';

export const approvalDemo = {
	mode: 'actions',
	itemId: 'demo:resale',
	concessionId: 'resale-ordinary-course-billing'
} as const;

// Keep the preapproved change from the negotiation tour so Send to buyer is enabled.
const changed = { panelOpen: false, hovered: false, concessionId: approvalDemo.concessionId } as const;

export const approvalTour: ReadonlyArray<ContractTourStep> = [
	{ phase: 'rest', duration: 700, state: changed, cursor: null },
	{ phase: 'enter', duration: 120, state: changed, cursor: { target: 'origin', mode: 'idle' } },
	{ phase: 'approach-send', duration: contractCursorMoveDuration, state: changed, cursor: { target: 'send', mode: 'idle' } },
	{ phase: 'hover-send', duration: 220, state: changed, cursor: { target: 'send', mode: 'idle' } },
	{ phase: 'click-send', duration: 220, state: changed, cursor: { target: 'send', mode: 'clicking' } },
	{ phase: 'clicked', duration: 350, state: changed, cursor: { target: 'send', mode: 'idle' } },
	{ phase: 'hold', duration: 1800, state: changed, cursor: null }
];
