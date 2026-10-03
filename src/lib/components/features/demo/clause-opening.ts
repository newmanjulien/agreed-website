import { contractCursorMoveDuration, type ContractTourStep } from './contract-tour.ts';

export const resaleDemo = {
	mode: 'clause',
	itemId: 'demo:resale',
	triggerId: 'resale'
} as const;

const document = { panelOpen: false, hovered: false } as const;
const hovered = { panelOpen: false, hovered: true } as const;
export const clauseSummary = { panelOpen: true, hovered: false } as const;

export function createClauseOpening(revealDuration: number): ReadonlyArray<ContractTourStep> {
	return [
		{ phase: 'rest', duration: 700, state: document, cursor: null },
		{ phase: 'enter', duration: 120, state: document, cursor: { target: 'origin', mode: 'idle' } },
		{ phase: 'approach', duration: contractCursorMoveDuration, state: document, cursor: { target: 'highlight', mode: 'idle' } },
		{ phase: 'hover', duration: 220, state: hovered, cursor: { target: 'highlight', mode: 'idle' } },
		{ phase: 'click', duration: 220, state: hovered, cursor: { target: 'highlight', mode: 'clicking' } },
		{ phase: 'reveal', duration: revealDuration, state: clauseSummary, cursor: { target: 'highlight', mode: 'idle' } }
	];
}
