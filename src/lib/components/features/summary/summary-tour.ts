import { defineTour, cursorMoveDuration, type AnimationStep } from '../../product-animation/model.ts';
import { createClauseOpening, clauseSummary } from '../demo/clause-opening.ts';

const negotiation = { ...clauseSummary, box: { clause: 'demo:resale', section: 'negotiation' } } as const;

export const summaryTour: ReadonlyArray<AnimationStep> = defineTour([
	...createClauseOpening(350),
	{ phase: 'approach-negotiation', duration: cursorMoveDuration, state: clauseSummary, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'negotiation' }, mode: 'idle', move: cursorMoveDuration } },
	{ phase: 'click-negotiation', duration: 220, state: clauseSummary, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'negotiation' }, mode: 'clicking' } },
	{ phase: 'read-negotiation', duration: 1800, state: negotiation, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'negotiation' }, mode: 'idle' } },
	{ phase: 'hold', duration: 1000, state: negotiation, cursor: null }
]);
