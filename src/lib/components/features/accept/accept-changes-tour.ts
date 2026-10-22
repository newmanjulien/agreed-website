import { defineTour, cursorMoveDuration, type AnimationStep } from '../../product-animation/model.ts';
import { createClauseOpening, clauseSummary } from '../demo/clause-opening.ts';

const concession = { ...clauseSummary, box: { clause: 'demo:resale', section: 'preferred' } } as const;
const applied = { ...concession, contract: 'resale' } as const;

export const acceptChangesTour: ReadonlyArray<AnimationStep> = defineTour([
	...createClauseOpening(650),
	{ phase: 'approach-concession', duration: cursorMoveDuration, state: clauseSummary, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'preferred' }, mode: 'idle', move: cursorMoveDuration } },
	{ phase: 'click-concession', duration: 220, state: clauseSummary, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'preferred' }, mode: 'clicking' } },
	{ phase: 'read-concession', duration: 1400, state: concession, cursor: { target: { kind: 'section', clause: 'demo:resale', section: 'preferred' }, mode: 'idle' } },
	{ phase: 'approach-apply', duration: cursorMoveDuration, state: concession, cursor: { target: { kind: 'concession', clause: 'demo:resale', concession: 'resale-ordinary-course-billing' }, mode: 'idle', move: cursorMoveDuration } },
	{ phase: 'click-apply', duration: 220, state: concession, cursor: { target: { kind: 'concession', clause: 'demo:resale', concession: 'resale-ordinary-course-billing' }, mode: 'clicking' } },
	{ phase: 'clicked-apply', duration: 1000, state: applied, cursor: { target: { kind: 'concession', clause: 'demo:resale', concession: 'resale-ordinary-course-billing' }, mode: 'idle' } },
	{ phase: 'hold', duration: 2800, state: { ...applied, viewport: 'revision' }, cursor: null }
]);
