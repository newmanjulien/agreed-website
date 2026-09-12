import type { GuidedTourStep } from '../demo/tour-model.ts';

export type CannotChangePhase =
	| 'rest'
	| 'approach-clause'
	| 'click-clause'
	| 'panel-open'
	| 'approach-objection'
	| 'click-objection'
	| 'answer';

export type CannotChangeTarget = 'clause' | 'objection';
export type CannotChangeView = 'document' | 'panel' | 'answer';

export interface CannotChangeTourState {
	view: CannotChangeView;
}

export type CannotChangeTourStep = GuidedTourStep<
	CannotChangePhase,
	CannotChangeTourState,
	CannotChangeTarget
>;

export const cannotChangeTour: ReadonlyArray<CannotChangeTourStep> = [
	{ phase: 'rest', duration: 650, state: { view: 'document' }, cursor: null },
	{ phase: 'approach-clause', duration: 850, state: { view: 'document' }, cursor: { target: 'clause', mode: 'idle' } },
	{ phase: 'click-clause', duration: 200, state: { view: 'document' }, cursor: { target: 'clause', mode: 'clicking' } },
	{ phase: 'panel-open', duration: 800, state: { view: 'panel' }, cursor: { target: 'clause', mode: 'idle' } },
	{ phase: 'approach-objection', duration: 700, state: { view: 'panel' }, cursor: { target: 'objection', mode: 'idle' } },
	{ phase: 'click-objection', duration: 200, state: { view: 'panel' }, cursor: { target: 'objection', mode: 'clicking' } },
	{ phase: 'answer', duration: 2700, state: { view: 'answer' }, cursor: null }
];
