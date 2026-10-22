import { defineTour, cursorMoveDuration, type AnimationStep } from '../../product-animation/model.ts';

// Start with a rendered change that actually requires approval in the shared fixture.
const changed = { clause: 'demo:attorneys-fees', contract: 'approval', hovered: false, viewport: 'actions' } as const;

export const approvalTour: ReadonlyArray<AnimationStep> = defineTour([
	{ phase: 'rest', duration: 700, state: changed, cursor: null },
	{ phase: 'enter', duration: 120, state: changed, cursor: { target: { kind: 'origin' }, mode: 'idle' } },
	{ phase: 'approach-approval', duration: cursorMoveDuration, state: changed, cursor: { target: { kind: 'approval' }, mode: 'idle', move: cursorMoveDuration } },
	{ phase: 'hover-approval', duration: 220, state: changed, cursor: { target: { kind: 'approval' }, mode: 'idle' } },
	{ phase: 'click-approval', duration: 220, state: changed, cursor: { target: { kind: 'approval' }, mode: 'clicking' } },
	{ phase: 'clicked', duration: 350, state: changed, cursor: { target: { kind: 'approval' }, mode: 'idle' } },
	{ phase: 'hold', duration: 1800, state: changed, cursor: null }
]);
