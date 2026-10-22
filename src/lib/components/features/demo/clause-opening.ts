import { cursorMoveDuration, type AnimationStep } from '../../product-animation/model.ts';

const document = { clause: 'demo:resale', contract: 'baseline', hovered: false } as const;
const hovered = { ...document, hovered: true } as const;
export const clauseSummary = { clause: 'demo:resale', contract: 'baseline', box: { clause: 'demo:resale' }, hovered: false } as const;

export function createClauseOpening(revealDuration: number): ReadonlyArray<AnimationStep> {
	return [
		{ phase: 'rest', duration: 700, state: document, cursor: null },
		{ phase: 'enter', duration: 120, state: document, cursor: { target: { kind: 'origin' }, mode: 'idle' } },
		{ phase: 'approach', duration: cursorMoveDuration, state: document, cursor: { target: { kind: 'clause', clause: 'demo:resale' }, mode: 'idle', move: cursorMoveDuration } },
		{ phase: 'hover', duration: 220, state: hovered, cursor: { target: { kind: 'clause', clause: 'demo:resale' }, mode: 'idle' } },
		{ phase: 'click', duration: 220, state: hovered, cursor: { target: { kind: 'clause', clause: 'demo:resale' }, mode: 'clicking' } },
		{ phase: 'reveal', duration: revealDuration, state: clauseSummary, cursor: { target: { kind: 'clause', clause: 'demo:resale' }, mode: 'idle' } }
	];
}
